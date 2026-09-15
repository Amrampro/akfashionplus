import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function Header({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Entete" description="Entete public avec marque, navigation, langue, panier et compte.">
      {children}
    </ModulePanel>
  );
}
