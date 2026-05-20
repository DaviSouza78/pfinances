"use client";

import { usePathname } from "next/navigation";

const getPageTitle = (pathname: string) => {
  switch (pathname) {
    case "/":
      return "Dashboard";
    case "/wallet":
      return "Carteira";
    case "/habits":
      return "Rotina Diária";
    case "/studies":
      return "Estudos";
    default:
      return "PersonalHub";
  }
};

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  // Exemplo: mostrar mês atual
  const currentMonth = new Intl.DateTimeFormat("pt-BR", { 
    month: "long", 
    year: "numeric" 
  }).format(new Date());

  return (
    <header className="h-16 border-b border-border bg-background/50 backdrop-blur-sm sticky top-0 z-10 px-8 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      <div className="flex items-center gap-4">
        {/* Aqui poderia vir o seletor de mês para o módulo financeiro */}
        <div className="text-sm text-muted-foreground capitalize">
          {currentMonth}
        </div>
      </div>
    </header>
  );
}
