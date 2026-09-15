import { useEffect, useMemo, useState } from "react";
import CashierLayout from "../../components/layout/CashierLayout";
import { get } from "../../services/api";
import {
  aoa,
  dateOnly,
  eur,
  statusLabel,
  type CashierPageProps,
} from "./cashierUtils";

type DashboardData = {
  pending_pickups: number;
  pending_payouts: number;
  payout_aoa: number;
  rentals_to_handle: number;
};

type PickupRow = {
  id: number;
  order_number: string;
  beneficiary_name: string;
  beneficiary_phone: string | null;
  total_eur: number;
  status: string;
};

type RentalRow = {
  order_item_id: number;
  product_name: string;
  customer_name: string;
  rental_end_date: string;
  rental_status: string;
  line_total_eur: number;
};

type ResaleRow = {
  id: number;
  order_number: string;
  product_name: string;
  beneficiary_name: string;
  payout_amount_aoa: number;
  status: string;
};

export default function CashierDashboardPage(props: CashierPageProps) {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [pickups, setPickups] = useState<PickupRow[]>([]);
  const [rentals, setRentals] = useState<RentalRow[]>([]);
  const [resales, setResales] = useState<ResaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      get<DashboardData>("/cashier/dashboard"),
      get<PickupRow[]>("/cashier/pickups"),
      get<RentalRow[]>("/rentals"),
      get<ResaleRow[]>("/resales"),
    ])
      .then(([dashboardData, pickupRows, rentalRows, resaleRows]) => {
        if (!active) return;
        setDashboard(dashboardData);
        setPickups((pickupRows || []).slice(0, 5));
        setRentals(
          (rentalRows || [])
            .filter((rental) =>
              [
                "reserved",
                "ready_for_pickup",
                "active",
                "return_due",
                "overdue",
              ].includes(rental.rental_status),
            )
            .slice(0, 5),
        );
        setResales(
          (resaleRows || [])
            .filter((resale) =>
              ["approved", "ready_for_payout"].includes(resale.status),
            )
            .slice(0, 5),
        );
      })
      .catch((requestError: Error) => {
        if (active) setError(requestError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const kpis = useMemo(
    () => [
      ["Retraits a remettre", dashboard?.pending_pickups || 0],
      ["Locations a traiter", dashboard?.rentals_to_handle || 0],
      ["Reventes a payer", dashboard?.pending_payouts || 0],
      ["Montant revente", aoa(dashboard?.payout_aoa || 0)],
    ],
    [dashboard],
  );

  return (
    <CashierLayout {...props}>
      <section className="cashier-page">
        <section className="cashier-hero">
          <div>
            <p>Operations guichet</p>
            <h2>Tableau de bord guichet</h2>
            <span>
              Suivez les retraits clients, les locations a remettre ou retourner
              et les paiements de revente a effectuer au comptoir.
            </span>
          </div>
          <button onClick={() => props.go("cashier-pickups")} type="button">
            Ouvrir les retraits
          </button>
        </section>

        {error ? <div className="cashier-error">{error}</div> : null}

        <section className="cashier-kpis">
          {kpis.map(([label, value]) => (
            <article key={label}>
              <span>{label}</span>
              <strong>{loading ? "..." : value}</strong>
            </article>
          ))}
        </section>

        <section className="cashier-grid">
          <article className="cashier-panel">
            <div className="cashier-panel-head">
              <div>
                <p>Retraits</p>
                <h3>Commandes pretes</h3>
              </div>
              <button onClick={() => props.go("cashier-pickups")} type="button">
                Tout voir
              </button>
            </div>
            <div className="cashier-list">
              {pickups.length ? (
                pickups.map((pickup) => (
                  <div key={pickup.id} className="cashier-list-row">
                    <div>
                      <strong>{pickup.order_number}</strong>
                      <span>
                        {pickup.beneficiary_name} -{" "}
                        {pickup.beneficiary_phone || "telephone non renseigne"}
                      </span>
                    </div>
                    <b>{eur(pickup.total_eur)}</b>
                    <small>{statusLabel(pickup.status)}</small>
                  </div>
                ))
              ) : (
                <p className="cashier-empty">Aucun retrait prioritaire.</p>
              )}
            </div>
          </article>

          <article className="cashier-panel">
            <div className="cashier-panel-head">
              <div>
                <p>Locations</p>
                <h3>Calendrier proche</h3>
              </div>
              <button onClick={() => props.go("cashier-rentals")} type="button">
                Gerer
              </button>
            </div>
            <div className="cashier-list">
              {rentals.length ? (
                rentals.map((rental) => (
                  <div key={rental.order_item_id} className="cashier-list-row">
                    <div>
                      <strong>{rental.product_name}</strong>
                      <span>
                        {rental.customer_name} - retour{" "}
                        {dateOnly(rental.rental_end_date)}
                      </span>
                    </div>
                    <b>{eur(rental.line_total_eur)}</b>
                    <small>{statusLabel(rental.rental_status)}</small>
                  </div>
                ))
              ) : (
                <p className="cashier-empty">Aucune location urgente.</p>
              )}
            </div>
          </article>

          <article className="cashier-panel wide">
            <div className="cashier-panel-head">
              <div>
                <p>Reventes AK</p>
                <h3>Paiements a preparer</h3>
              </div>
              <button onClick={() => props.go("cashier-resales")} type="button">
                Payer
              </button>
            </div>
            <div className="cashier-table">
              <table>
                <thead>
                  <tr>
                    <th>Commande</th>
                    <th>Article</th>
                    <th>Beneficiaire</th>
                    <th>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {resales.map((resale) => (
                    <tr key={resale.id}>
                      <td>{resale.order_number}</td>
                      <td>{resale.product_name}</td>
                      <td>{resale.beneficiary_name}</td>
                      <td>{aoa(resale.payout_amount_aoa)}</td>
                      <td>{statusLabel(resale.status)}</td>
                    </tr>
                  ))}
                  {!resales.length ? (
                    <tr>
                      <td colSpan={5}>Aucune revente a payer.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </section>
    </CashierLayout>
  );
}
