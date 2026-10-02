import "@fontsource-variable/plus-jakarta-sans";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Shared Living", template: "%s · Shared Living" },
  description: "Shared bills, fair chores, and a happier home in one place.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
