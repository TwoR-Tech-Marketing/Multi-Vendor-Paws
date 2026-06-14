"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PortalSelect } from "@/components/ui/select/PortalSelect";
import { Routes } from "@/constants/routes";
import {
  createVendorProductFromApi,
  fetchProductCategoriesFromApi,
  fetchVendorProductFromApi,
  updateVendorProductFromApi,
} from "@/features/products/application/products.api";
import { egpToPiastres, piastresToEgp } from "@/features/products/domain/currency";
import type { ProductStatus } from "@/features/products/domain/types";
import { uploadProductImage } from "@/features/products/infrastructure/product-images.service";
import { IconImageAdd } from "@/features/products/presentation/ProductIcons";
import { ProductsSkeleton } from "@/features/products/presentation/ProductsSkeleton";
import { usePortalSession } from "@/features/vendor/presentation/PortalSessionContext";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./products.module.css";

const MAX_IMAGES = 8;
const DRAFT_PRODUCT_ID = "draft";

type ImageItem = {
  id: string;
  url: string;
  file?: File;
};

type ProductFormSectionProps = {
  mode: "create" | "edit";
  productId?: string;
};

type FormState = {
  name: string;
  description: string;
  categoryId: string;
  priceEgp: string;
  stock: string;
  sku: string;
  status: ProductStatus;
};

function buildInitialFormState(): FormState {
  return {
    name: "",
    description: "",
    categoryId: "",
    priceEgp: "",
    stock: "",
    sku: "",
    status: "active",
  };
}

function makeImageId(): string {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function ProductFormSection({ mode, productId }: ProductFormSectionProps) {
  const router = useRouter();
  const strings = useStrings();
  const { profile } = usePortalSession();
  const vendorId = profile.vendorId;

  const [form, setForm] = useState<FormState>(buildInitialFormState);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [primaryImageId, setPrimaryImageId] = useState<string | null>(null);
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const statusOptions = useMemo(
    () => [
      { value: "active", label: strings.products.statusLabels.active },
      { value: "inactive", label: strings.products.statusLabels.inactive },
      { value: "out_of_stock", label: strings.products.statusLabels.out_of_stock },
    ],
    [strings.products.statusLabels],
  );

  const loadForm = useCallback(async () => {
    setError(null);
    setIsLoading(true);

    try {
      const categoryItems = await fetchProductCategoriesFromApi();
      setCategories(
        categoryItems.map((category) => ({
          value: category.categoryId,
          label: category.name,
        })),
      );

      if (mode === "edit" && productId) {
        const product = await fetchVendorProductFromApi(productId);
        setForm({
          name: product.name,
          description: product.description ?? "",
          categoryId: product.primaryCategoryId,
          priceEgp: String(piastresToEgp(product.pricePiastres)),
          stock: String(product.stock),
          sku: product.sku ?? "",
          status: product.status === "archived" ? "inactive" : product.status,
        });

        const loadedImages = product.imageUrls.map((url) => ({
          id: makeImageId(),
          url,
        }));
        setImages(loadedImages);
        const primary =
          loadedImages.find((image) => image.url === product.primaryImageUrl)?.id ??
          loadedImages[0]?.id ??
          null;
        setPrimaryImageId(primary);
      }
    } catch {
      setError(strings.products.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [mode, productId, strings.products.loadError]);

  useEffect(() => {
    void loadForm();
  }, [loadForm]);

  function updateField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function onImagesSelected(fileList: FileList | null) {
    if (!fileList) return;

    const remainingSlots = MAX_IMAGES - images.length;
    if (remainingSlots <= 0) return;

    const nextFiles = Array.from(fileList).slice(0, remainingSlots);
    const nextItems = nextFiles.map((file) => ({
      id: makeImageId(),
      url: URL.createObjectURL(file),
      file,
    }));

    setImages((current) => [...current, ...nextItems]);
    if (!primaryImageId && nextItems[0]) {
      setPrimaryImageId(nextItems[0].id);
    }
  }

  function removeImage(imageId: string) {
    setImages((current) => {
      const target = current.find((image) => image.id === imageId);
      if (target?.file) {
        URL.revokeObjectURL(target.url);
      }
      const remaining = current.filter((image) => image.id !== imageId);
      setPrimaryImageId((prev) => (prev === imageId ? remaining[0]?.id ?? null : prev));
      return remaining;
    });
  }

  function validateForm(): string | null {
    if (!form.name.trim()) return strings.products.validation.name;
    if (!form.categoryId) return strings.products.validation.category;

    const price = Number(form.priceEgp);
    if (!Number.isFinite(price) || price < 0) return strings.products.validation.price;

    const stock = Number(form.stock);
    if (!Number.isInteger(stock) || stock < 0) return strings.products.validation.stock;

    if (images.length === 0) return strings.products.validation.images;
    if (!primaryImageId) return strings.products.validation.images;

    if (form.description.length > 2000) {
      return strings.products.validation.descriptionLength;
    }

    return null;
  }

  async function resolveImageUrls(
    uploadProductKey: string,
  ): Promise<{ imageUrls: string[]; primaryImageUrl: string }> {
    const imageUrls: string[] = [];

    for (const image of images) {
      if (image.file) {
        imageUrls.push(await uploadProductImage(vendorId, uploadProductKey, image.file));
        continue;
      }
      imageUrls.push(image.url);
    }

    const primaryIndex = Math.max(
      0,
      images.findIndex((image) => image.id === primaryImageId),
    );

    return {
      imageUrls,
      primaryImageUrl: imageUrls[primaryIndex] ?? imageUrls[0],
    };
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!vendorId) {
      setError(strings.errors.unauthorized);
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadKey = mode === "edit" && productId ? productId : DRAFT_PRODUCT_ID;
      const { imageUrls, primaryImageUrl } = await resolveImageUrls(uploadKey);

      const pricePiastres = egpToPiastres(Number(form.priceEgp));
      const stock = Number(form.stock);
      const status: ProductStatus =
        stock === 0 && form.status === "active" ? "out_of_stock" : form.status;

      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        imageUrls,
        primaryImageUrl: primaryImageUrl,
        categoryIds: [form.categoryId],
        primaryCategoryId: form.categoryId,
        pricePiastres,
        stock,
        sku: form.sku.trim() || null,
        status,
      };

      if (mode === "create") {
        await createVendorProductFromApi(payload);
        setSuccess(strings.products.createSuccess);
        router.replace(Routes.vendor.products);
        return;
      }

      if (!productId) {
        setError(strings.products.saveError);
        return;
      }

      await updateVendorProductFromApi(productId, payload);
      setSuccess(strings.products.updateSuccess);
      router.replace(Routes.vendor.products);
    } catch {
      setError(strings.products.saveError);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return <ProductsSkeleton />;
  }

  return (
    <section>
      {error ? <div className={`${styles.alert} ${styles.alertError}`}>{error}</div> : null}
      {success ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div>
      ) : null}

      <article className={styles.panel}>
        <form className={styles.formPanel} onSubmit={(event) => void onSubmit(event)}>
          <div className={styles.formGrid}>
            <label className={`${styles.field} ${styles.span2}`}>
              {strings.products.fields.name}
              <input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder={strings.products.placeholders.name}
                required
              />
            </label>

            <label className={`${styles.field} ${styles.span2}`}>
              {strings.products.fields.description}
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => updateField("description", event.target.value)}
                placeholder={strings.products.placeholders.description}
              />
            </label>

            <label className={styles.field}>
              {strings.products.fields.category}
              <PortalSelect
                value={form.categoryId}
                options={categories}
                onChange={(value) => updateField("categoryId", value)}
                ariaLabel={strings.products.fields.category}
              />
            </label>

            <label className={styles.field}>
              {strings.products.fields.price}
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.priceEgp}
                onChange={(event) => updateField("priceEgp", event.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              {strings.products.fields.stock}
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(event) => updateField("stock", event.target.value)}
                required
              />
            </label>

            <label className={styles.field}>
              {strings.products.fields.status}
              <PortalSelect
                value={form.status}
                options={statusOptions}
                onChange={(value) => updateField("status", value as ProductStatus)}
                ariaLabel={strings.products.fields.status}
              />
            </label>

            <label className={styles.field}>
              {strings.products.fields.sku}
              <input
                value={form.sku}
                onChange={(event) => updateField("sku", event.target.value)}
                placeholder={strings.products.placeholders.sku}
              />
            </label>

            <div className={`${styles.field} ${styles.span2}`}>
              {strings.products.uploadImages}
              <span className={styles.fieldHint}>{strings.products.uploadImagesHint}</span>
              <div className={styles.uploadGrid}>
                {images.map((image) => (
                  <div
                    key={image.id}
                    className={`${styles.uploadTile} ${styles.uploadTileFilled}`}
                  >
                    <Image src={image.url} alt="" width={108} height={108} unoptimized />
                    <div className={styles.uploadTileActions}>
                      {primaryImageId !== image.id ? (
                        <button
                          type="button"
                          className={styles.uploadTileBtn}
                          onClick={() => setPrimaryImageId(image.id)}
                        >
                          {strings.products.setPrimaryImage}
                        </button>
                      ) : (
                        <span className={`${styles.uploadTileBtn} ${styles.uploadTileBtnPrimary}`}>
                          {strings.products.primaryImage}
                        </span>
                      )}
                      <button
                        type="button"
                        className={styles.uploadTileBtn}
                        onClick={() => removeImage(image.id)}
                      >
                        {strings.common.delete}
                      </button>
                    </div>
                  </div>
                ))}

                {images.length < MAX_IMAGES ? (
                  <label className={`${styles.uploadTile} ${styles.uploadTileAdd}`}>
                    <IconImageAdd />
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => onImagesSelected(event.target.files)}
                    />
                  </label>
                ) : null}
              </div>
            </div>

            <div className={`${styles.formActions} ${styles.span2}`}>
              <Link href={Routes.vendor.products} className={styles.btnSecondary}>
                {strings.products.cancelEdit}
              </Link>
              <button type="submit" className={styles.btnPrimary} disabled={isSubmitting}>
                {isSubmitting ? strings.products.saving : strings.products.saveProduct}
              </button>
            </div>
          </div>
        </form>
      </article>
    </section>
  );
}
