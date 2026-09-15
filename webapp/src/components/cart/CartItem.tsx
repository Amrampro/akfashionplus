import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function CartItem({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Ligne panier" description="Affiche un article du panier avec quantite, prix, variante et action de retrait.">
      {children}
    </ModulePanel>
  );
}
