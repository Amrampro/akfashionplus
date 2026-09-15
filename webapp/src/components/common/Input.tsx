import type { ReactNode } from "react";
import ModulePanel from "./ModulePanel";

export default function Input({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Champ AK" description="Champ de formulaire pour recherche, profil, adresse ou paiement.">
      {children}
    </ModulePanel>
  );
}
