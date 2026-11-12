import { TelehealthChatSection } from "@/features/telehealth/presentation/TelehealthChatSection";

type TelehealthChatPageProps = {
  params: Promise<{ sessionId: string }>;
};

export default async function TelehealthChatPage({ params }: TelehealthChatPageProps) {
  const { sessionId } = await params;
  return <TelehealthChatSection sessionId={decodeURIComponent(sessionId)} />;
}
