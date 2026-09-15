import { useEffect, useState } from "react";
import CashierLayout from "../../components/layout/CashierLayout";
import { get } from "../../services/api";
import {
  aoa,
  dateTime,
  eur,
  statusLabel,
  type CashierPageProps,
} from "./cashierUtils";

type ResaleRow = {
  id: number;
  order_number: string;
  product_name: string;
  amount_eur: number;
  exchange_rate: number;
  payout_amount_aoa: number;
  beneficiary_name: string;
  beneficiary_phone: string | null;
  branch_name: string;
  status: string;
  requested_at: string;
};

export default function ResalePayoutDetailsPage(props: CashierPageProps) {
  const [rows, setRows] = useState<ResaleRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    get<ResaleRow[]>("/resales")
      .then((data) => setRows(data || []))
      .catch((requestError: Error) => setError(requestError.message));
  }, []);

  const selected =
    rows.find((row) => ["approved", "ready_for_payout"].includes(row.status)) ||
    rows[0] ||
    null;

  return (
    <CashierLayout {...props}>
      <section className="cashier-page">
        <section className="cashier-hero">
          <div>
            <p>Details revente</p>
            <h2>Paiement au guichet</h2>
            <span>
              Controle du beneficiaire, du montant EUR converti en devise locale et de
              l'agence de paiement.
            </span>
          </div>
          <button onClick={() => props.go("cashier-resales")} type="button">
            Retour reventes
          </button>
        </section>
        {error ? <div className="cashier-error">{error}</div> : null}
        <section className="cashier-panel">
          {selected ? (
            <div className="cashier-detail-grid">
              <article>
                <span>Commande</span>
                <strong>{selected.order_number}</strong>
                <small>{selected.product_name}</small>
              </article>
              <article>
                <span>Beneficiaire</span>
                <strong>{selected.beneficiary_name}</strong>
                <small>{selected.beneficiary_phone || "-"}</small>
              </article>
              <article>
                <span>Montants</span>
                <strong>{aoa(selected.payout_amount_aoa)}</strong>
                <small>
                  {eur(selected.amount_eur)} - taux {selected.exchange_rate}
                </small>
              </article>
              <article>
                <span>Guichet</span>
                <strong>{selected.branch_name}</strong>
                <small>{dateTime(selected.requested_at)}</small>
              </article>
              <article>
                <span>Statut</span>
                <strong>{statusLabel(selected.status)}</strong>
              </article>
            </div>
          ) : (
            <p className="cashier-empty">Aucune revente disponible.</p>
          )}
        </section>
      </section>
    </CashierLayout>
  );
}
