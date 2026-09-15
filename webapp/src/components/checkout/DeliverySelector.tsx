import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function DeliverySelector({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Mode livraison" description="Selection livraison domicile ou retrait en boutique.">
      {children}
    </ModulePanel>
  );
}
