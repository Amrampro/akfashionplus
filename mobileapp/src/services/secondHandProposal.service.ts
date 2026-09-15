import { endpoints } from "./apiEndpoints";
import { get, post, postForm, put } from "./api";
import type {
  SecondHandProposal,
  SecondHandProposalForm,
  SecondHandProposalStatus,
  SecondHandHandoverMethod,
} from "../types";

export const getSecondHandProposals = () =>
  get<SecondHandProposal[]>(endpoints.secondHandProposals);

export const getSecondHandProposal = (id: number) =>
  get<SecondHandProposal>(`${endpoints.secondHandProposals}/${id}`);

export const createSecondHandProposal = (body: SecondHandProposalForm) =>
  post<SecondHandProposal>(endpoints.secondHandProposals, body);

export const uploadSecondHandProposalImages = (
  id: number,
  images: Array<{ uri: string; name?: string; type?: string }>,
) => {
  const form = new FormData();
  images.forEach((image, index) => {
    form.append("proposal_photos", {
      uri: image.uri,
      name: image.name || `proposal-${id}-${index}.jpg`,
      type: image.type || "image/jpeg",
    } as unknown as Blob);
  });
  return postForm<SecondHandProposal>(
    `${endpoints.secondHandProposals}/${id}/images`,
    form,
  );
};

export const acceptSecondHandProposal = (id: number) =>
  post<SecondHandProposal>(`${endpoints.secondHandProposals}/${id}/accept`);

export const rejectSecondHandProposal = (id: number) =>
  post<SecondHandProposal>(`${endpoints.secondHandProposals}/${id}/reject`);

export const getAdminSecondHandProposals = (params = "") =>
  get<SecondHandProposal[]>(
    `${endpoints.secondHandProposals}/admin${params ? `?${params}` : ""}`,
  );

export const getAdminSecondHandProposal = (id: number) =>
  get<SecondHandProposal>(`${endpoints.secondHandProposals}/admin/${id}`);

export const evaluateSecondHandProposal = (
  id: number,
  body: { offered_price_eur: number; admin_notes?: string },
) =>
  put<SecondHandProposal>(
    `${endpoints.secondHandProposals}/${id}/evaluate`,
    body,
  );

export const updateSecondHandProposalStatus = (
  id: number,
  body: { status: SecondHandProposalStatus; admin_notes?: string },
) =>
  put<SecondHandProposal>(
    `${endpoints.secondHandProposals}/${id}/status`,
    body,
  );

export const setSecondHandProposalInstructions = (
  id: number,
  body: {
    handover_method: SecondHandHandoverMethod;
    handover_instructions: string;
  },
) =>
  put<SecondHandProposal>(
    `${endpoints.secondHandProposals}/${id}/instructions`,
    body,
  );

export const markSecondHandProposalReceived = (id: number, admin_notes = "") =>
  put<SecondHandProposal>(`${endpoints.secondHandProposals}/${id}/received`, {
    admin_notes,
  });

export const verifySecondHandProposal = (
  id: number,
  body: { valid: boolean; admin_notes?: string },
) =>
  put<SecondHandProposal>(
    `${endpoints.secondHandProposals}/${id}/verify`,
    body,
  );

export const confirmSecondHandProposalPayment = (
  id: number,
  body: {
    final_price_eur?: number;
    payment_reference?: string;
    admin_notes?: string;
  },
) =>
  put<SecondHandProposal>(
    `${endpoints.secondHandProposals}/${id}/payment`,
    body,
  );
