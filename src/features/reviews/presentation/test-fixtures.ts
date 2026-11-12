import type { VendorReview } from "@/features/reviews/domain/types";

/** Raw `VendorReviewOut` as the callable returns it. */
export const RAW_REVIEW = {
  appointmentId: "appt1",
  branchId: "b1",
  buyerDisplay: { firstName: "Mona", anonymous: false },
  ratings: { cleanliness: 5, waiting_time: 3, doctor_efficiency: 4 },
  overallTenths: 40,
  tags: ["friendly_doctor", "long_waiting_time"],
  comment: "Very kind staff.",
  serviceNames: [{ serviceId: "s1", nameEn: "Checkup", nameAr: "كشف" }],
  appointmentStartAtMs: Date.UTC(2026, 10, 10, 8, 0),
  createdAtMs: Date.UTC(2026, 10, 11, 8, 0),
  editedAtMs: null,
  reply: null,
  canReply: true,
};

/** The mapped form of `RAW_REVIEW`. */
export function makeReview(overrides: Partial<VendorReview> = {}): VendorReview {
  return {
    appointmentId: "appt1",
    branchId: "b1",
    firstName: "Mona",
    anonymous: false,
    ratings: [
      { id: "cleanliness", value: 5 },
      { id: "waiting_time", value: 3 },
      { id: "doctor_efficiency", value: 4 },
    ],
    overallTenths: 40,
    tags: ["friendly_doctor", "long_waiting_time"],
    comment: "Very kind staff.",
    serviceNames: [{ serviceId: "s1", nameEn: "Checkup", nameAr: "كشف" }],
    appointmentStartAtMs: RAW_REVIEW.appointmentStartAtMs,
    createdAtMs: RAW_REVIEW.createdAtMs,
    editedAtMs: null,
    reply: null,
    canReply: true,
    ...overrides,
  };
}
