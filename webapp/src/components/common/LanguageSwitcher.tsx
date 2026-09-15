import type { ReactNode } from "react";
import ModulePanel from "./ModulePanel";

export default function LanguageSwitcher({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Langues" description="Selection francais, anglais ou portugais.">
      {children}
    </ModulePanel>
  );
}
