export type Language = "fr" | "en" | "pt";
export type Role = "user" | "cashier" | "admin";

export interface Product {
  id: number;
  name: string;
  slug?: string;
  sale_price_eur?: number;
  sale_price_aoa?: number;
  rental_price_per_day_eur?: number;
}

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

export type SecondHandConditionState =
  | "new_never_worn"
  | "excellent"
  | "very_good"
  | "good"
  | "fair";

export type SecondHandHandoverMethod = "dropoff" | "shipping";

export interface SecondHandProposalImage {
  id?: number;
  proposal_id?: number;
  image_url: string;
  sort_order?: number;
  created_at?: string;
}

export interface SecondHandProposal {
  id: number;
  proposal_number: string;
  user_id?: number;
  category_id?: number | null;
  category_name_fr?: string | null;
  category_name_en?: string | null;
  category_name_pt?: string | null;
  user_name?: string | null;
  user_email?: string | null;
  user_phone?: string | null;
  item_type: string;
  brand: string;
  size?: string | null;
  color?: string | null;
  condition_state: SecondHandConditionState;
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
  created_at?: string;
  updated_at?: string;
}

export interface SecondHandProposalForm {
  category_id?: number | null;
  item_type: string;
  brand: string;
  size: string;
  color: string;
  condition_state: SecondHandConditionState;
  description: string;
  desired_price_eur: string;
  bank_account_holder: string;
  bank_account_number: string;
  bank_name: string;
}
