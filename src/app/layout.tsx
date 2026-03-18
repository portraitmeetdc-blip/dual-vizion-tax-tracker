import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dual Vizion Photography - Tax Expense Tracker",
  description: "Business expense tracking and Schedule C tax preparation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#ebf4ff]">{children}</body>
    </html>
  );
}
