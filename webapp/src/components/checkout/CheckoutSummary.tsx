import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function CheckoutSummary({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Resume checkout" description="Regroupe total, livraison, paiement et conversion secondaire.">
      {children}
    </ModulePanel>
  );
}
