import { AppointmentDetailSection } from "@/features/appointments/presentation/AppointmentDetailSection";

type AppointmentDetailPageProps = {
  params: Promise<{ appointmentId: string }>;
};

export default async function AppointmentDetailPage({ params }: AppointmentDetailPageProps) {
  const { appointmentId } = await params;
  return <AppointmentDetailSection appointmentId={decodeURIComponent(appointmentId)} />;
}
