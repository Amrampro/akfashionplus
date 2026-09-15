import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function MobileMenu({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Menu mobile" description="Navigation mobile compacte pour toutes les zones.">
      {children}
    </ModulePanel>
  );
}
