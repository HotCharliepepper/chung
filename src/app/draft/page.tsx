import type { Metadata } from "next";
import DraftAssistant from "@/components/DraftAssistant";

export const metadata: Metadata = {
  title: "문의 답변 만들기 | StayMind AI",
};

export default function DraftPage() {
  return <DraftAssistant />;
}
