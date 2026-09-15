import { get, put } from "./api";

export type SecondHandProposalStatus =
  | "submitted"
  | "under_review"
  | "offer_sent"
  | "accepted"
  | "rejected"
  | "awaiting_item"
  | "item_received"
  | "verified"
  | "verification_failed"
  | "payment_pending"
  | "paid"
  | "completed"
  | "cancelled";

export type SecondHandHandoverMethod = "dropoff" | "shipping";

export type SecondHandProposalImage = {
  id?: number;
  image_url: string;
  sort_order?: number;
};

export type SecondHandProposal = {
  id: number;
  proposal_number: string;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  category_name_fr?: string | null;
  item_type: string;
  brand: string;
  size?: string | null;
  color?: string | null;
  condition_state: string;
  description?: string | null;
  desired_price_eur: number | string;
  offered_price_eur?: number | string | null;
  final_price_eur?: number | string | null;
  status: SecondHandProposalStatus;
  bank_account_holder?: string | null;
  bank_account_number?: string | null;
  bank_account_number_masked?: string | null;
  bank_name?: string | null;
  evaluated_by_name?: string | null;
  admin_notes?: string | null;
  handover_method?: SecondHandHandoverMethod | null;
  handover_instructions?: string | null;
  payment_reference?: string | null;
  cover_image_url?: string | null;
  images_count?: number | string | null;
  images?: SecondHandProposalImage[];
  created_at?: string | null;
  evaluated_at?: string | null;
  accepted_at?: string | null;
  rejected_at?: string | null;
  item_received_at?: string | null;
  verified_at?: string | null;
  paid_at?: string | null;
};

export const secondHandStatuses: Array<[SecondHandProposalStatus | "", string]> = [
  ["", "Tous les statuts"],
  ["submitted", "Proposition recue"],
  ["under_review", "En evaluation"],
  ["offer_sent", "Offre envoyee"],
  ["accepted", "Acceptee"],
  ["rejected", "Refusee"],
  ["awaiting_item", "En attente article"],
  ["item_received", "Article recu"],
  ["verified", "Article valide"],
  ["verification_failed", "Verification refusee"],
  ["payment_pending", "Paiement en attente"],
  ["paid", "Payee"],
  ["completed", "Terminee"],
  ["cancelled", "Annulee"],
];

export function secondHandStatusLabel(status: string | null | undefined) {
  return secondHandStatuses.find(([id]) => id === status)?.[1] || status || "-";
}

export const getStaffSecondHandProposals = (params: URLSearchParams) =>
  get<SecondHandProposal[]>(
    `/second-hand-proposals/admin?${params.toString()}`,
  );

export const getStaffSecondHandProposal = (id: number) =>
  get<SecondHandProposal>(`/second-hand-proposals/admin/${id}`);

export const evaluateSecondHandProposal = (
  id: number,
  body: { offered_price_eur: number; admin_notes?: string },
) => put<SecondHandProposal>(`/second-hand-proposals/${id}/evaluate`, body);

export const updateSecondHandProposalStatus = (
  id: number,
  body: { status: SecondHandProposalStatus; admin_notes?: string },
) => put<SecondHandProposal>(`/second-hand-proposals/${id}/status`, body);

export const setSecondHandProposalInstructions = (
  id: number,
  body: {
    handover_method: SecondHandHandoverMethod;
    handover_instructions: string;
  },
) => put<SecondHandProposal>(`/second-hand-proposals/${id}/instructions`, body);

export const markSecondHandProposalReceived = (id: number, admin_notes = "") =>
  put<SecondHandProposal>(`/second-hand-proposals/${id}/received`, {
    admin_notes,
  });

export const verifySecondHandProposal = (
  id: number,
  body: { valid: boolean; admin_notes?: string },
) => put<SecondHandProposal>(`/second-hand-proposals/${id}/verify`, body);

export const confirmSecondHandProposalPayment = (
  id: number,
  body: {
    final_price_eur?: number;
    payment_reference?: string;
    admin_notes?: string;
  },
) => put<SecondHandProposal>(`/second-hand-proposals/${id}/payment`, body);
