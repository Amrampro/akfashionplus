import type { ReactNode } from "react";
import ModulePanel from "./ModulePanel";

export default function Pagination({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Pagination" description="Controle page, limite et navigation des listes.">
      {children}
    </ModulePanel>
  );
}
