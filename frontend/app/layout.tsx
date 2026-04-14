import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Agent Function Call Simulation",
  description: "Simulate agent tool/function calls with Next.js and Django",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}