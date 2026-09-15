import type { ReactNode } from "react";
import ModulePanel from "./ModulePanel";

export default function EmptyState({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Etat vide" description="Message visuel quand aucune donnee ne correspond aux filtres.">
      {children}
    </ModulePanel>
  );
}
