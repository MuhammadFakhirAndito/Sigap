import React from "react";

export default function RootTemplate({ children }: { children: React.ReactNode }) {
  return <div className="sigap-page-enter flex-1 flex flex-col">{children}</div>;
}
