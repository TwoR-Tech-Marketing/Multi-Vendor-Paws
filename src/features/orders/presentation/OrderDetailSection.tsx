"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";

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
import { OrderStatusBadge } from "@/features/orders/presentation/OrderStatusBadge";
import { OrdersSkeleton } from "@/features/orders/presentation/OrdersSkeleton";
import { formatEgp } from "@/features/products/domain/currency";
import { useStrings } from "@/shared/preferences/PreferencesContext";

import styles from "./orders.module.css";

type OrderDetailSectionProps = {
  vendorOrderId: string;
};

function formatDate(date: Date): string {
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function OrderDetailSection({ vendorOrderId }: OrderDetailSectionProps) {
  const strings = useStrings();
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [nextStatus, setNextStatus] = useState<VendorOrderStatus>("pending");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadOrder = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await fetchVendorOrderFromApi(vendorOrderId);
      setOrder(data);
      setNextStatus(data.status);
    } catch {
      setError(strings.orders.loadError);
    } finally {
      setIsLoading(false);
    }
  }, [vendorOrderId, strings.orders.loadError]);

  useEffect(() => {
    void loadOrder();
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

  if (isLoading) return <OrdersSkeleton />;
  if (!order) {
    return <div className={`${styles.alert} ${styles.alertError}`}>{strings.orders.loadError}</div>;
  }

  return (
    <section className={styles.sectionStack}>
      {error ? <div className={`${styles.alert} ${styles.alertError}`}>{error}</div> : null}
      {success ? (
        <div className={`${styles.alert} ${styles.alertSuccess}`}>{success}</div>
      ) : null}

      <div className={styles.detailGrid}>
        <article className={styles.panel}>
          <div className={styles.detailPanel}>
            <h2 className={styles.sectionTitle}>{strings.orders.itemsSection}</h2>
            {order.lineItems.map((item) => (
              <div key={`${item.productId}-${item.name}`} className={styles.itemRow}>
                <div className={styles.itemThumb}>
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt="" width={44} height={44} unoptimized />
                  ) : null}
                </div>
                <div className={styles.itemMeta}>
                  <strong>{item.name}</strong>
                  <small>
                    {item.quantity} × {formatEgp(item.unitPricePiastres)}
                  </small>
                </div>
                <strong>{formatEgp(item.lineTotalPiastres)}</strong>
              </div>
            ))}
          </div>
        </article>

        <div className={styles.sectionStack}>
          <article className={styles.panel}>
            <div className={styles.detailPanel}>
              <h2 className={styles.sectionTitle}>{strings.orders.customerSection}</h2>
              <dl className={styles.metaList}>
                <div className={styles.metaRow}>
                  <dt>{strings.orders.tableCustomer}</dt>
                  <dd>{order.buyerDisplayName ?? "—"}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>{strings.orders.tableStatus}</dt>
                  <dd>
                    <OrderStatusBadge status={order.status} strings={strings} />
                  </dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>{strings.orders.tableDate}</dt>
                  <dd>{formatDate(order.placedAt)}</dd>
                </div>
              </dl>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.detailPanel}>
              <h2 className={styles.sectionTitle}>{strings.orders.summarySection}</h2>
              <dl className={styles.metaList}>
                <div className={styles.metaRow}>
                  <dt>{strings.orders.subtotal}</dt>
                  <dd>{formatEgp(order.subtotalPiastres)}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>{strings.orders.deliveryFee}</dt>
                  <dd>{formatEgp(order.deliveryFeePiastres)}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>{strings.orders.discount}</dt>
                  <dd>{formatEgp(order.discountPiastres)}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>{strings.orders.total}</dt>
                  <dd>{formatEgp(order.totalPiastres)}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>{strings.orders.commission}</dt>
                  <dd>
                    {order.commissionRatePercent}% · {formatEgp(order.commissionPiastres)}
                  </dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>{strings.orders.netEarnings}</dt>
                  <dd>{formatEgp(order.netPiastres)}</dd>
                </div>
              </dl>

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
        </div>
      </div>

      <article className={styles.panel}>
        <div className={styles.detailPanel}>
          <h2 className={styles.sectionTitle}>{strings.orders.timelineSection}</h2>
          <div className={styles.timeline}>
            {order.statusHistory.map((event) => (
              <div key={`${event.status}-${event.at.toISOString()}`} className={styles.timelineItem}>
                <span>
                  <OrderStatusBadge status={event.status} strings={strings} />
                  {event.note ? ` — ${event.note}` : ""}
                </span>
                <span>{formatDate(event.at)}</span>
              </div>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}
