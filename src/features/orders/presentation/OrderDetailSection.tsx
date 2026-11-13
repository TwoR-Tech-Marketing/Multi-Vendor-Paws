"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

import { StatusBadge } from "@/components/ui/badge/StatusBadge";
import { LoadErrorState } from "@/components/ui/error-state/LoadErrorState";
import { toLoadErrorView, type LoadErrorView } from "@/components/ui/error-state/load-error";
import { PortalSelect } from "@/components/ui/select/PortalSelect";
import {
  fetchVendorOrderFromApi,
  updateVendorOrderStatusFromApi,
} from "@/features/orders/application/orders.api";
import { ApiClientError } from "@/lib/auth-client";
import {
  VENDOR_ORDER_STATUS_VALUES,
  type VendorOrder,
  type VendorOrderStatus,
} from "@/features/orders/domain/types";
import { formatOrderRef } from "@/features/orders/presentation/OrdersListPanel";
import { OrderStatusBadge } from "@/features/orders/presentation/OrderStatusBadge";
import { OrderStatusTimeline } from "@/features/orders/presentation/OrderStatusTimeline";
import { OrderDetailSkeleton } from "@/features/orders/presentation/OrderDetailSkeleton";
import { formatEgp } from "@/features/products/domain/currency";
import { IconImage } from "@/features/products/presentation/ProductIcons";
import { formatDateTime } from "@/shared/lib/format-date";
import { usePreferences, useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./orders.module.css";

type OrderDetailSectionProps = {
  vendorOrderId: string;
};

export function OrderDetailSection({ vendorOrderId }: OrderDetailSectionProps) {
  const strings = useStrings();
  const { locale } = usePreferences();
  const formatDate = useCallback((date: Date) => formatDateTime(date, locale), [locale]);
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [nextStatus, setNextStatus] = useState<VendorOrderStatus>("pending");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loadError, setLoadError] = useState<LoadErrorView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setLoadError(null);
    setIsLoading(true);
    try {
      const data = await fetchVendorOrderFromApi(vendorOrderId);
      setOrder(data);
      setNextStatus(data.status);
    } catch (failure) {
      setLoadError(toLoadErrorView(failure, strings, strings.orders.detailLoadError));
    } finally {
      setIsLoading(false);
    }
  }, [vendorOrderId, strings]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadOrder();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrder]);

  const statusOptions = useMemo(
    () =>
      VENDOR_ORDER_STATUS_VALUES.map((status) => ({
        value: status,
        label: strings.orders.statusLabels[status],
      })),
    [strings.orders.statusLabels],
  );

  async function handleUpdateStatus() {
    if (!order || nextStatus === order.status) return;

    setIsUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await updateVendorOrderStatusFromApi(
        order.vendorOrderId,
        nextStatus,
        note.trim() || undefined,
      );
      setOrder(updated);
      setNote("");
      setSuccess(strings.orders.updateSuccess);
      setNextStatus(updated.status);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : strings.orders.updateError);
    } finally {
      setIsUpdating(false);
    }
  }

  if (isLoading) return <OrderDetailSkeleton />;
  if (!order) {
    const view = loadError ?? toLoadErrorView(null, strings, strings.orders.detailLoadError);
    return (
      <article className={styles.panel}>
        <LoadErrorState
          view={view}
          strings={strings}
          onRetry={() => void loadOrder()}
        />
      </article>
    );
  }

  const isHeld = order.holdState === "held";
  const displayNet =
    order.vendorNetPiastres != null ? order.vendorNetPiastres : order.netPiastres;
  const displayFee =
    order.platformFeePiastres != null
      ? order.platformFeePiastres
      : order.commissionPiastres;

  return (
    <section className={styles.sectionStack}>
      {error ? (
        <div className={`${styles.alert} ${styles.alertError}`} role="alert">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
          {success}
        </div>
      ) : null}
      {isHeld ? (
        <div className={`${styles.alert} ${styles.alertHold}`} role="status">
          <strong>{strings.orders.holdBannerTitle}</strong>
          <p>{strings.orders.holdBannerMessage}</p>
        </div>
      ) : null}

      <article className={`${styles.panel} ${styles.detailHeader}`}>
        <div className={styles.detailHeaderMain}>
          <h2 className={styles.detailOrderRef}>
            <bdi>{formatOrderRef(order.orderId)}</bdi>
          </h2>
          <span className={styles.badgeRow}>
            <OrderStatusBadge status={order.status} strings={strings} />
            {isHeld ? (
              <StatusBadge tone="hold" label={strings.orders.heldLabel} status="held" />
            ) : null}
          </span>
        </div>
        <dl className={styles.detailHeaderMeta}>
          <div>
            <dt>{strings.orders.tableDate}</dt>
            <dd>{formatDate(order.placedAt)}</dd>
          </div>
          <div>
            <dt>{strings.orders.tableCustomer}</dt>
            <dd title={order.buyerDisplayName ?? undefined}>
              {order.buyerDisplayName ?? strings.orders.guestCustomer}
            </dd>
          </div>
        </dl>
      </article>

      <div className={styles.detailGrid}>
        <article className={`${styles.panel} ${styles.areaItems}`}>
          <div className={styles.detailPanel}>
            <h2 className={styles.sectionTitle}>{strings.orders.itemsSection}</h2>
            <ul className={styles.itemList}>
              {order.lineItems.map((item) => (
                <li key={`${item.productId}-${item.name}`} className={styles.itemRow}>
                  <div className={styles.itemThumb}>
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" width={44} height={44} unoptimized />
                    ) : (
                      <IconImage />
                    )}
                  </div>
                  <div className={styles.itemMeta}>
                    <strong title={item.name}>{item.name}</strong>
                    <small>
                      {strings.orders.lineSummary
                        .replace("{quantity}", String(item.quantity))
                        .replace("{price}", formatEgp(item.unitPricePiastres, locale))}
                    </small>
                  </div>
                  <span className={styles.itemTotal}>
                    {formatEgp(item.lineTotalPiastres, locale)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.areaSummary}`}>
          <div className={styles.detailPanel}>
            <h2 className={styles.sectionTitle}>{strings.orders.summarySection}</h2>
            <dl className={styles.metaList}>
              <div className={styles.metaRow}>
                <dt>{strings.orders.subtotal}</dt>
                <dd>{formatEgp(order.subtotalPiastres, locale)}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>{strings.orders.deliveryFee}</dt>
                <dd>{formatEgp(order.deliveryFeePiastres, locale)}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>{strings.orders.discount}</dt>
                <dd>{formatEgp(order.discountPiastres, locale)}</dd>
              </div>
              <div className={`${styles.metaRow} ${styles.metaRowTotal}`}>
                <dt>{strings.orders.total}</dt>
                <dd>{formatEgp(order.totalPiastres, locale)}</dd>
              </div>
              <div className={styles.metaRow}>
                <dt>{strings.orders.commission}</dt>
                <dd>
                  <bdi>{order.commissionRatePercent}%</bdi> · {formatEgp(displayFee, locale)}
                </dd>
              </div>
              <div className={`${styles.metaRow} ${styles.metaRowTotal} ${styles.metaRowEarnings}`}>
                <dt>{strings.orders.netEarnings}</dt>
                <dd>{formatEgp(displayNet, locale)}</dd>
              </div>
            </dl>
          </div>
        </article>

        <article className={`${styles.panel} ${styles.areaHistory}`}>
          <div className={styles.detailPanel}>
            <h2 className={styles.sectionTitle}>{strings.orders.timelineSection}</h2>
            <OrderStatusTimeline
              events={order.statusHistory}
              strings={strings}
              formatDate={formatDate}
            />
          </div>
        </article>

        {!isHeld ? (
          <article className={`${styles.panel} ${styles.areaUpdate}`}>
            <div className={styles.detailPanel}>
              <h2 className={styles.sectionTitle}>{strings.orders.updateStatus}</h2>
              <div className={styles.statusForm}>
                <label>
                  {strings.orders.updateStatus}
                  <PortalSelect
                    value={nextStatus}
                    options={statusOptions}
                    onChange={(value) => setNextStatus(value as VendorOrderStatus)}
                    ariaLabel={strings.orders.updateStatus}
                  />
                </label>
                <label>
                  {strings.orders.statusNote}
                  <textarea value={note} onChange={(event) => setNote(event.target.value)} />
                </label>
                <button
                  type="button"
                  className={styles.btnPrimary}
                  disabled={isUpdating || nextStatus === order.status}
                  onClick={() => void handleUpdateStatus()}
                >
                  {strings.orders.updateStatus}
                </button>
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
