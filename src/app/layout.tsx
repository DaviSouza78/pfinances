import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "@uploadthing/react/styles.css";
import { SessionWrapper } from "@/components/layout/SessionWrapper";
import { AppShell } from "@/components/layout/AppShell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PersonalHub",
  description: "Unified dashboard for Finances, Habits, and Studies.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Forçando o dark mode por omissão conforme solicitado (Dark Mode nativo)
    <html lang="pt" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        <SessionWrapper>
          <AppShell>{children}</AppShell>
        </SessionWrapper>
      </body>
    </html>
  );
}
