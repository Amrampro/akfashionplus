import { created, fail, ok } from "../utils/apiResponse.js";
import { writeAudit } from "../services/audit.service.js";
import { notifyUser } from "../services/notification.service.js";
import {
  decryptBankValue,
  encryptBankValue,
  maskBankValue,
} from "../utils/bankData.js";
import * as Proposal from "../models/secondHandProposal.model.js";

const statuses = new Set([
  "submitted",
  "under_review",
  "offer_sent",
  "accepted",
  "rejected",
  "awaiting_item",
  "item_received",
  "verified",
  "verification_failed",
  "payment_pending",
  "paid",
  "completed",
  "cancelled",
]);

const conditions = new Set([
  "new_never_worn",
  "excellent",
  "very_good",
  "good",
  "fair",
]);

const handoverMethods = new Set(["dropoff", "shipping"]);

const notificationCopy = {
  fr: {
    submitted: ["Proposition recue", "Votre proposition de vente seconde main a ete recue."],
    offer_sent: ["Offre AK Fashion Plus", "AK Fashion Plus a envoye une offre pour votre article."],
    status: ["Mise a jour proposition", "Le statut de votre proposition seconde main a ete mis a jour."],
    instructions: ["Instructions disponibles", "Les instructions pour remettre votre article sont disponibles."],
    item_received: ["Article recu", "Votre article a ete recu."],
    verified: ["Article verifie", "Votre article a ete verifie par AK Fashion Plus."],
    verification_failed: ["Verification non conforme", "Votre article ne correspond pas a la proposition initiale."],
    paid: ["Paiement effectue", "Le paiement de votre proposition seconde main a ete enregistre."],
  },
  en: {
    submitted: ["Proposal received", "Your second hand sale proposal has been received."],
    offer_sent: ["AK Fashion Plus offer", "AK Fashion Plus sent an offer for your item."],
    status: ["Proposal update", "The status of your second hand proposal was updated."],
    instructions: ["Instructions available", "Instructions to hand over your item are available."],
    item_received: ["Item received", "Your item has been received."],
    verified: ["Item verified", "Your item was verified by AK Fashion Plus."],
    verification_failed: ["Verification failed", "Your item does not match the initial proposal."],
    paid: ["Payment completed", "The payment for your second hand proposal was recorded."],
  },
  pt: {
    submitted: ["Proposta recebida", "A sua proposta de venda em segunda mao foi recebida."],
    offer_sent: ["Oferta AK Fashion Plus", "A AK Fashion Plus enviou uma oferta pelo seu artigo."],
    status: ["Atualizacao da proposta", "O estado da sua proposta de segunda mao foi atualizado."],
    instructions: ["Instrucoes disponiveis", "As instrucoes para entregar o artigo estao disponiveis."],
    item_received: ["Artigo recebido", "O seu artigo foi recebido."],
    verified: ["Artigo verificado", "O seu artigo foi verificado pela AK Fashion Plus."],
    verification_failed: ["Verificacao recusada", "O seu artigo nao corresponde a proposta inicial."],
    paid: ["Pagamento efetuado", "O pagamento da sua proposta de segunda mao foi registado."],
  },
};

function numeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function uniqueProposalNumber() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const random = Math.random().toString(16).slice(2, 8).toUpperCase();
    const value = `SHP-${Date.now()}-${random}`;
    if (!(await Proposal.proposalNumberExists(value))) return value;
  }
  return `SHP-${Date.now()}`;
}

function publicImageUrl(req, file) {
  return `${req.protocol}://${req.get("host")}/uploads/second-hand-proposals/${file.filename}`;
}

async function hydrate(proposal, user) {
  if (!proposal) return null;
  const images = await Proposal.listImages(proposal.id);
  const bankNumber = decryptBankValue(proposal.bank_account_number);
  const staff = user?.role === "admin" || user?.role === "cashier";
  const safe = {
    ...proposal,
    images,
    bank_account_number: staff ? bankNumber : undefined,
    bank_account_number_masked: maskBankValue(bankNumber),
  };
  if (!staff) delete safe.bank_account_number;
  return safe;
}

function notificationFor(proposal, key) {
  const language = ["fr", "en", "pt"].includes(proposal?.user_language)
    ? proposal.user_language
    : "fr";
  return notificationCopy[language][key] || notificationCopy[language].status;
}

function notify(proposal, event, key) {
  const [title, message] = notificationFor(proposal, key);
  return notifyUser(proposal.user_id, event, title, message, {
    proposal_id: proposal.id,
    proposal_number: proposal.proposal_number,
  });
}

async function audit(req, action, proposal, oldData = null, newData = null) {
  return writeAudit({
    userId: req.user?.id || null,
    action,
    entityType: "second_hand_proposal",
    entityId: proposal?.id || null,
    oldData,
    newData,
    ip: req.ip,
  });
}

function requireOwnerEditable(proposal) {
  return ["submitted"].includes(proposal.status);
}

export async function listMyProposals(req, res) {
  const rows = await Proposal.listUserProposals(req.user.id, req.query);
  return ok(
    res,
    rows.map((row) => ({
      ...row,
      bank_account_number: undefined,
      bank_account_number_masked: undefined,
    })),
  );
}

export async function listAdminProposals(req, res) {
  const rows = await Proposal.listAdminProposals(req.query);
  return ok(
    res,
    rows.map((row) => ({
      ...row,
      bank_account_number: undefined,
      bank_account_number_masked: maskBankValue(
        decryptBankValue(row.bank_account_number),
      ),
    })),
  );
}

export async function getProposal(req, res) {
  const proposal = await Proposal.findProposalById(req.params.id, req.user);
  if (!proposal) return fail(res, 404, "Proposal not found");
  return ok(res, await hydrate(proposal, req.user));
}

export async function createProposal(req, res) {
  const desiredPrice = numeric(req.body.desired_price_eur);
  if (!req.body.item_type || !req.body.brand || desiredPrice <= 0) {
    return fail(res, 422, "Item type, brand and desired price are required");
  }
  if (!conditions.has(req.body.condition_state)) {
    return fail(res, 422, "Invalid condition state");
  }
  if (!req.body.bank_account_holder || !req.body.bank_account_number || !req.body.bank_name) {
    return fail(res, 422, "Bank information is required");
  }

  const result = await Proposal.createProposal({
    proposal_number: await uniqueProposalNumber(),
    user_id: req.user.id,
    category_id: req.body.category_id || null,
    item_type: req.body.item_type,
    brand: req.body.brand,
    size: req.body.size || null,
    color: req.body.color || null,
    condition_state: req.body.condition_state,
    description: req.body.description || null,
    desired_price_eur: desiredPrice,
    status: "submitted",
    bank_account_holder: req.body.bank_account_holder,
    bank_account_number: encryptBankValue(req.body.bank_account_number),
    bank_name: req.body.bank_name,
  });

  const proposal = await Proposal.findProposalById(result.insertId, req.user);
  await notify(
    proposal,
    "second_hand_proposal_submitted",
    "submitted",
  );
  await audit(req, "second_hand_proposal.submitted", proposal, null, proposal);
  return created(res, await hydrate(proposal, req.user), "Proposal submitted");
}

export async function uploadProposalImages(req, res) {
  const proposal = await Proposal.findProposalById(req.params.id, req.user);
  if (!proposal) return fail(res, 404, "Proposal not found");
  if (req.user.role !== "admin" && !requireOwnerEditable(proposal)) {
    return fail(res, 409, "Proposal can no longer be edited");
  }
  const files = req.files || [];
  if (!files.length) return fail(res, 422, "At least one image is required");

  await Proposal.addImages(
    proposal.id,
    files.map((file) => publicImageUrl(req, file)),
  );
  const updated = await Proposal.findProposalById(proposal.id, req.user);
  await audit(req, "second_hand_proposal.images_uploaded", proposal, null, {
    count: files.length,
  });
  return ok(res, await hydrate(updated, req.user), "Images uploaded");
}

export async function evaluateProposal(req, res) {
  const proposal = await Proposal.findProposalById(req.params.id, req.user);
  if (!proposal) return fail(res, 404, "Proposal not found");
  const offer = numeric(req.body.offered_price_eur);
  if (offer <= 0) return fail(res, 422, "A valid offer is required");

  await Proposal.updateProposal(proposal.id, {
    offered_price_eur: offer,
    final_price_eur: offer,
    status: "offer_sent",
    evaluated_by: req.user.id,
    evaluated_at: new Date(),
    admin_notes: req.body.admin_notes || proposal.admin_notes || null,
  });
  const updated = await Proposal.findProposalById(proposal.id, req.user);
  await notify(
    updated,
    "second_hand_offer_sent",
    "offer_sent",
  );
  await audit(req, "second_hand_proposal.offer_sent", proposal, proposal, updated);
  return ok(res, await hydrate(updated, req.user), "Offer sent");
}

export async function acceptProposal(req, res) {
  const proposal = await Proposal.findProposalById(req.params.id, req.user);
  if (!proposal) return fail(res, 404, "Proposal not found");
  if (proposal.status !== "offer_sent") {
    return fail(res, 409, "Proposal has no pending offer");
  }
  await Proposal.updateProposal(proposal.id, {
    status: "accepted",
    user_responded_at: new Date(),
    accepted_at: new Date(),
    final_price_eur: proposal.offered_price_eur,
  });
  const updated = await Proposal.findProposalById(proposal.id, req.user);
  await audit(req, "second_hand_proposal.accepted", proposal, proposal, updated);
  return ok(res, await hydrate(updated, req.user), "Offer accepted");
}

export async function rejectProposal(req, res) {
  const proposal = await Proposal.findProposalById(req.params.id, req.user);
  if (!proposal) return fail(res, 404, "Proposal not found");
  if (proposal.status !== "offer_sent") {
    return fail(res, 409, "Proposal has no pending offer");
  }
  await Proposal.updateProposal(proposal.id, {
    status: "rejected",
    user_responded_at: new Date(),
    rejected_at: new Date(),
  });
  const updated = await Proposal.findProposalById(proposal.id, req.user);
  await audit(req, "second_hand_proposal.rejected", proposal, proposal, updated);
  return ok(res, await hydrate(updated, req.user), "Offer rejected");
}

export async function updateStatus(req, res) {
  if (!statuses.has(req.body.status)) return fail(res, 422, "Invalid status");
  const proposal = await Proposal.findProposalById(req.params.id, req.user);
  if (!proposal) return fail(res, 404, "Proposal not found");
  await Proposal.updateProposal(proposal.id, {
    status: req.body.status,
    admin_notes: req.body.admin_notes || proposal.admin_notes || null,
  });
  const updated = await Proposal.findProposalById(proposal.id, req.user);
  await notify(
    updated,
    `second_hand_${req.body.status}`,
    "status",
  );
  await audit(req, "second_hand_proposal.status_updated", proposal, proposal, updated);
  return ok(res, await hydrate(updated, req.user), "Status updated");
}

export async function setInstructions(req, res) {
  if (!handoverMethods.has(req.body.handover_method)) {
    return fail(res, 422, "Invalid handover method");
  }
  if (!req.body.handover_instructions) {
    return fail(res, 422, "Instructions are required");
  }
  const proposal = await Proposal.findProposalById(req.params.id, req.user);
  if (!proposal) return fail(res, 404, "Proposal not found");
  await Proposal.updateProposal(proposal.id, {
    handover_method: req.body.handover_method,
    handover_instructions: req.body.handover_instructions,
    status: "awaiting_item",
  });
  const updated = await Proposal.findProposalById(proposal.id, req.user);
  await notify(
    updated,
    "second_hand_instructions",
    "instructions",
  );
  await audit(req, "second_hand_proposal.instructions_set", proposal, proposal, updated);
  return ok(res, await hydrate(updated, req.user), "Instructions saved");
}

export async function markReceived(req, res) {
  const proposal = await Proposal.findProposalById(req.params.id, req.user);
  if (!proposal) return fail(res, 404, "Proposal not found");
  await Proposal.updateProposal(proposal.id, {
    status: "item_received",
    item_received_at: new Date(),
    admin_notes: req.body.admin_notes || proposal.admin_notes || null,
  });
  const updated = await Proposal.findProposalById(proposal.id, req.user);
  await notify(updated, "second_hand_item_received", "item_received");
  await audit(req, "second_hand_proposal.item_received", proposal, proposal, updated);
  return ok(res, await hydrate(updated, req.user), "Item received");
}

export async function verifyProposal(req, res) {
  const valid = req.body.valid !== false;
  const proposal = await Proposal.findProposalById(req.params.id, req.user);
  if (!proposal) return fail(res, 404, "Proposal not found");
  await Proposal.updateProposal(proposal.id, {
    status: valid ? "verified" : "verification_failed",
    verified_at: new Date(),
    admin_notes: req.body.admin_notes || proposal.admin_notes || null,
  });
  const updated = await Proposal.findProposalById(proposal.id, req.user);
  await notify(
    updated,
    "second_hand_verified",
    valid ? "verified" : "verification_failed",
  );
  await audit(req, "second_hand_proposal.verified", proposal, proposal, updated);
  return ok(res, await hydrate(updated, req.user), "Verification saved");
}

export async function confirmPayment(req, res) {
  const proposal = await Proposal.findProposalById(req.params.id, req.user);
  if (!proposal) return fail(res, 404, "Proposal not found");
  const amount = numeric(req.body.final_price_eur || proposal.final_price_eur);
  if (amount <= 0) return fail(res, 422, "A valid final price is required");
  await Proposal.updateProposal(proposal.id, {
    status: "paid",
    final_price_eur: amount,
    paid_at: new Date(),
    payment_reference: req.body.payment_reference || null,
    admin_notes: req.body.admin_notes || proposal.admin_notes || null,
  });
  const updated = await Proposal.findProposalById(proposal.id, req.user);
  await notify(
    updated,
    "second_hand_paid",
    "paid",
  );
  await audit(req, "second_hand_proposal.paid", proposal, proposal, updated);
  return ok(res, await hydrate(updated, req.user), "Payment recorded");
}

export default {
  listMyProposals,
  listAdminProposals,
  getProposal,
  createProposal,
  uploadProposalImages,
  evaluateProposal,
  acceptProposal,
  rejectProposal,
  updateStatus,
  setInstructions,
  markReceived,
  verifyProposal,
  confirmPayment,
};
