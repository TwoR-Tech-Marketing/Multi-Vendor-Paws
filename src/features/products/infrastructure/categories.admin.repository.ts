import "server-only";

import type { DocumentData } from "firebase-admin/firestore";

import { getAdminFirestore } from "@/lib/firebase-admin";

export type ProductCategory = {
  categoryId: string;
  name: string;
  nameAr?: string | null;
  order: number;
  isActive: boolean;
};

const CATEGORIES_PATH = ["store", "items", "categories"] as const;

function categoriesCollection() {
  return getAdminFirestore()
    .collection(CATEGORIES_PATH[0])
    .doc(CATEGORIES_PATH[1])
    .collection(CATEGORIES_PATH[2]);
}

function toCategory(id: string, data: DocumentData): ProductCategory {
  return {
    categoryId: id,
    name: typeof data.name === "string" ? data.name : id,
    nameAr: typeof data.nameAr === "string" ? data.nameAr : null,
    order: typeof data.order === "number" ? data.order : 0,
    isActive: data.isActive !== false,
  };
}

export async function listProductCategoriesAdmin(): Promise<ProductCategory[]> {
  const snap = await categoriesCollection().get();
  return snap.docs
    .map((doc) => toCategory(doc.id, doc.data()))
    .filter((category) => category.isActive)
    .sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}

export async function resolveCategoryNamesByIds(
  categoryIds: string[],
): Promise<string[]> {
  if (categoryIds.length === 0) return [];

  const uniqueIds = [...new Set(categoryIds)];
  const snaps = await Promise.all(
    uniqueIds.map((id) => categoriesCollection().doc(id).get()),
  );

  const nameById = new Map<string, string>();
  snaps.forEach((snap, index) => {
    const id = uniqueIds[index];
    if (!snap.exists) {
      nameById.set(id, id);
      return;
    }
    const data = snap.data() ?? {};
    nameById.set(
      id,
      typeof data.name === "string" && data.name.trim() ? data.name : id,
    );
  });

  return categoryIds.map((id) => nameById.get(id) ?? id);
}
