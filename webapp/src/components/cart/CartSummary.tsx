import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function CartSummary({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Resume panier" description="Affiche sous-total, livraison, total multidevise et action checkout.">
      {children}
    </ModulePanel>
  );
}
