import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function GiftCardPurchaseForm({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Achat carte cadeau" description="Formulaire pour acheter ou assigner une carte cadeau AK.">
      {children}
    </ModulePanel>
  );
}
