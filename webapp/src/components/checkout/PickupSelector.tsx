import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function PickupSelector({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Retrait boutique" description="Selection branche et beneficiaire pour retrait securise.">
      {children}
    </ModulePanel>
  );
}
