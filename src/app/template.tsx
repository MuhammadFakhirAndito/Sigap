import React from "react";
import { LanguageController } from "@/components/ui/LanguageController";

export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return (
    <div className="sigap-page-enter flex-1 flex flex-col">
      <LanguageController />
      {children}
    </div>
  );
}
