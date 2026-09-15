import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function ResellToCompanyOption({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Revente a AK" description="Option de revente a l entreprise depuis le checkout.">
      {children}
    </ModulePanel>
  );
}
