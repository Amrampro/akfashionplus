import { useEffect, useMemo, useState } from "react";
import CashierLayout from "../../components/layout/CashierLayout";
import { get } from "../../services/api";
import { dateTime, type CashierPageProps } from "./cashierUtils";

type HistoryRow = {
  id: number;
  order_id: number;
  order_number: string;
  branch_id: number;
  cashier_id: number;
  pickup_type: string;
  beneficiary_name: string;
  beneficiary_phone: string | null;
  notes: string | null;
  completed_at: string;
};

function typeLabel(value: string) {
  const labels: Record<string, string> = {
    order_pickup: "Retrait commande",
    rental: "Remise location",
    rental_return: "Retour location",
    resale_payout: "Paiement revente",
  };
  return labels[value] || value;
}

export default function CashierHistoryPage(props: CashierPageProps) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    get<HistoryRow[]>("/cashier/history")
      .then((data) => {
        if (active) setRows(data || []);
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

  const filteredRows = useMemo(
    () =>
      rows.filter((row) => {
        const matchType = type === "all" || row.pickup_type === type;
        const term = search.trim().toLowerCase();
        const matchSearch =
          !term ||
          [
            row.order_number,
            row.beneficiary_name,
            row.beneficiary_phone,
            row.notes,
          ]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(term));
        return matchType && matchSearch;
      }),
    [rows, search, type],
  );

  const types = Array.from(new Set(rows.map((row) => row.pickup_type))).sort();

  return (
    <CashierLayout {...props}>
      <section className="cashier-page">
        <section className="cashier-hero">
          <div>
            <p>Historique</p>
            <h2>Operations traitees</h2>
            <span>
              Consultez les retraits et operations finalisees au guichet, du
              plus recent au plus ancien.
            </span>
          </div>
        </section>

        {error ? <div className="cashier-error">{error}</div> : null}

        <section className="cashier-kpis">
          <article>
            <span>Operations</span>
            <strong>{loading ? "..." : filteredRows.length}</strong>
          </article>
          <article>
            <span>Retraits</span>
            <strong>
              {rows.filter((row) => row.pickup_type === "order_pickup").length}
            </strong>
          </article>
          <article>
            <span>Locations</span>
            <strong>
              {
                rows.filter((row) =>
                  ["rental", "rental_return"].includes(row.pickup_type),
                ).length
              }
            </strong>
          </article>
          <article>
            <span>Derniere operation</span>
            <strong>{rows[0] ? dateTime(rows[0].completed_at) : "-"}</strong>
          </article>
        </section>

        <section className="cashier-filters">
          <label>
            Recherche
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Commande, beneficiaire, note..."
              value={search}
            />
          </label>
          <label>
            Type
            <select onChange={(event) => setType(event.target.value)} value={type}>
              <option value="all">Tous les types</option>
              {types.map((option) => (
                <option key={option} value={option}>
                  {typeLabel(option)}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section className="cashier-panel">
          <div className="cashier-panel-head">
            <div>
              <p>Journal</p>
              <h3>Historique guichet</h3>
            </div>
            <strong>{filteredRows.length}</strong>
          </div>
          <div className="cashier-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Commande</th>
                  <th>Type</th>
                  <th>Beneficiaire</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row, index) => (
                  <tr key={row.id}>
                    <td>{index + 1}</td>
                    <td>{dateTime(row.completed_at)}</td>
                    <td>{row.order_number}</td>
                    <td>{typeLabel(row.pickup_type)}</td>
                    <td>
                      {row.beneficiary_name}
                      <small>{row.beneficiary_phone || "-"}</small>
                    </td>
                    <td>{row.notes || "-"}</td>
                  </tr>
                ))}
                {!filteredRows.length ? (
                  <tr>
                    <td colSpan={6}>Aucune operation trouvee.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </CashierLayout>
  );
}
