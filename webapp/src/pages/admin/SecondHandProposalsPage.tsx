import AdminLayout from "../../components/layout/AdminLayout";
import SecondHandProposalsWorkspace from "../shared/SecondHandProposalsWorkspace";

type Props = {
  go: (page: string) => void;
  logout: () => void;
  page: string;
  sessionEmail?: string;
  sessionName?: string;
};

export default function SecondHandProposalsPage({
  go,
  logout,
  page,
  sessionEmail,
  sessionName,
}: Props) {
  return (
    <AdminLayout
      go={go}
      logout={logout}
      page={page}
      sessionEmail={sessionEmail}
      sessionName={sessionName}
    >
      <SecondHandProposalsWorkspace variant="admin" />
    </AdminLayout>
  );
}
