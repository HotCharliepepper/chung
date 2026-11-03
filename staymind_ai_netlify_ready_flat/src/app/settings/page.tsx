import type { Metadata } from "next";
import PropertySettings from "@/components/PropertySettings";

export const metadata: Metadata = {
  title: "숙소 정보 입력 | StayMind AI",
};

export default function SettingsPage() {
  return <PropertySettings />;
}
