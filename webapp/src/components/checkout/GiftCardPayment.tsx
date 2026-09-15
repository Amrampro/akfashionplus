import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function GiftCardPayment({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Paiement carte cadeau" description="Applique un solde disponible avec reservation avant confirmation.">
      {children}
    </ModulePanel>
  );
}
