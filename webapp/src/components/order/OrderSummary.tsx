import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function OrderSummary({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Resume commande" description="Detaille articles, paiements, livraison, retrait et historique de statut.">
      {children}
    </ModulePanel>
  );
}
