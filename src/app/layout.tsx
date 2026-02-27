import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Meta Ads Manager",
  description: "Vereinfachte Verwaltung deiner Meta-Werbekampagnen",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="font-sans">
        <Sidebar />
        <main className="ml-[var(--sidebar-width)] min-h-screen">
          <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
        </main>
      </body>
    </html>
  );
}
