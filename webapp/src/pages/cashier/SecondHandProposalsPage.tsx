import CashierLayout from "../../components/layout/CashierLayout";
import SecondHandProposalsWorkspace from "../shared/SecondHandProposalsWorkspace";
import type { CashierPageProps } from "./cashierUtils";

export default function SecondHandProposalsPage(props: CashierPageProps) {
  return (
    <CashierLayout {...props}>
      <SecondHandProposalsWorkspace variant="cashier" />
    </CashierLayout>
  );
}
