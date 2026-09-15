import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function PayoutCard({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Paiement revente" description="Affiche montant EUR, taux historique et paiement en devise locale.">
      {children}
    </ModulePanel>
  );
}
