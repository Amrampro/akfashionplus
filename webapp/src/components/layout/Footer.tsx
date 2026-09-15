import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function Footer({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Pied de page" description="Pied de page avec marque, liens et promesse AK Fashion Plus.">
      {children}
    </ModulePanel>
  );
}
