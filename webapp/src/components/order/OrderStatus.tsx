import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function OrderStatus({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Statut commande" description="Affiche la progression pending, confirmed, ready, delivered ou cancelled.">
      {children}
    </ModulePanel>
  );
}
