import type { ReactNode } from "react";
import ModulePanel from "../common/ModulePanel";

export default function StripePayment({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <ModulePanel className={className} title="Paiement Stripe" description="Prepare paiement carte bancaire via Stripe PaymentIntent.">
      {children}
    </ModulePanel>
  );
}
