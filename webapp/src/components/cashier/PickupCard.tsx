import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function PickupCard({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Carte retrait" description="Affiche beneficiaire, code, commande et validation de retrait.">
      {children}
    </ModulePanel>
  );
}
