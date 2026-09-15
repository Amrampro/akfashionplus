import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function GiftCardTransactions({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Transactions carte" description="Journal des credits, debits, reservations et remboursements.">
      {children}
    </ModulePanel>
  );
}
