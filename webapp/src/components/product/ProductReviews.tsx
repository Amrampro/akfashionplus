import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function ProductReviews({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Avis produit" description="Liste et formulaire des avis client avec moderation.">
      {children}
    </ModulePanel>
  );
}
