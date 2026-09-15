import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function BeneficiaryForm({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Beneficiaire" description="Collecte nom, telephone et adresse du beneficiaire.">
      {children}
    </ModulePanel>
  );
}
