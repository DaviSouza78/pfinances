"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

// Rotas que NÃO exibem o shell (Sidebar + Header)
const SHELL_EXCLUDED_ROUTES = ["/login", "/auth/error"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const isExcluded = SHELL_EXCLUDED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isExcluded) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
