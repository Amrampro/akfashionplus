import { useEffect, useState } from "react";
import CashierLayout from "../../components/layout/CashierLayout";
import { get } from "../../services/api";
import { eur, statusLabel, type CashierPageProps } from "./cashierUtils";

type PickupRow = {
  id: number;
  order_number: string;
  beneficiary_name: string;
  beneficiary_phone: string | null;
  total_eur: number;
  status: string;
};

export default function PickupDetailsPage(props: CashierPageProps) {
  const [rows, setRows] = useState<PickupRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    get<PickupRow[]>("/cashier/pickups")
      .then((data) => setRows(data || []))
      .catch((requestError: Error) => setError(requestError.message));
  }, []);

  const selected = rows[0] || null;

  return (
    <CashierLayout {...props}>
      <section className="cashier-page">
        <section className="cashier-hero">
          <div>
            <p>Details retrait</p>
            <h2>Controle de remise</h2>
            <span>
              Cette vue affiche le prochain retrait disponible pour verifier le
              beneficiaire avant remise.
            </span>
          </div>
          <button onClick={() => props.go("cashier-pickups")} type="button">
            Retour retraits
          </button>
        </section>
        {error ? <div className="cashier-error">{error}</div> : null}
        <section className="cashier-panel">
          {selected ? (
            <div className="cashier-detail-grid">
              <article>
                <span>Commande</span>
                <strong>{selected.order_number}</strong>
              </article>
              <article>
                <span>Beneficiaire</span>
                <strong>{selected.beneficiary_name}</strong>
                <small>{selected.beneficiary_phone || "-"}</small>
              </article>
              <article>
                <span>Total</span>
                <strong>{eur(selected.total_eur)}</strong>
              </article>
              <article>
                <span>Statut</span>
                <strong>{statusLabel(selected.status)}</strong>
              </article>
            </div>
          ) : (
            <p className="cashier-empty">Aucun retrait disponible.</p>
          )}
        </section>
      </section>
    </CashierLayout>
  );
}
