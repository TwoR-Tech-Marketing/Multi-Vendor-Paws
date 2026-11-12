import type { InvoiceServiceOption } from "@/features/appointments/domain/extra-invoices";
import { getBranch } from "@/features/branches/application/branches.api";

/**
 * Active services of the appointment's branch, offered as invoice service
 * lines. The server prices service lines itself from the same documents.
 */
export async function listInvoiceServices(branchId: string): Promise<InvoiceServiceOption[]> {
  const { services } = await getBranch(branchId);
  return services
    .filter((service) => service.status === "active" && service.serviceId)
    .map((service) => ({
      serviceId: service.serviceId,
      nameEn: service.nameEn,
      nameAr: service.nameAr,
      pricePiastres: service.pricePiastres,
    }));
}
