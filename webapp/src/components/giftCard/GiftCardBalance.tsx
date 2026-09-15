import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function GiftCardBalance({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Solde carte cadeau" description="Met en avant le solde disponible et les montants reserves.">
      {children}
    </ModulePanel>
  );
}
