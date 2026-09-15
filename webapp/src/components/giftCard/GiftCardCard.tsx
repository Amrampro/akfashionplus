import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function GiftCardCard({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Carte cadeau" description="Affiche type, numero, solde courant, reserve et statut.">
      {children}
    </ModulePanel>
  );
}
