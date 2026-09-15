import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function CartDrawer({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Panier rapide" description="Panneau lateral pour consulter rapidement les articles avant paiement.">
      {children}
    </ModulePanel>
  );
}
