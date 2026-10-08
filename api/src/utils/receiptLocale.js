// Shared by receipt builders and the PDF renderer; never translate customer data.
const labels = {
  receipt: ['Reçu AK Fashion Plus', 'AK Fashion Plus receipt', 'Recibo AK Fashion Plus'],
  order: ['Commande', 'Order', 'Encomenda'], rental: ['Location', 'Rental', 'Aluguer'], resale: ['Revente', 'Resale', 'Revenda'],
  reference: ['Référence', 'Reference', 'Referência'], type: ['Type', 'Type', 'Tipo'],
  customer: ['Client', 'Customer', 'Cliente'], beneficiary: ['Bénéficiaire', 'Recipient', 'Beneficiário'],
  address: ['Adresse', 'Address', 'Morada'], branch: ['Guichet', 'Counter', 'Balcão'],
  date: ['Date', 'Date', 'Data'], payment: ['Paiement', 'Payment', 'Pagamento'], status: ['Statut', 'Status', 'Estado'],
  subtotal: ['Sous-total', 'Subtotal', 'Subtotal'], delivery: ['Livraison', 'Delivery', 'Entrega'],
  discount: ['Remise', 'Discount', 'Desconto'], total: ['Total', 'Total', 'Total'],
  items: ['Articles', 'Items', 'Artigos'], payments: ['Paiements', 'Payments', 'Pagamentos'],
  noPayments: ['Aucun paiement détaillé.', 'No payment details.', 'Sem detalhes de pagamento.'],
  deliveryItem: ['Livraison article', 'Item delivery', 'Entrega do artigo'],
  pickupItem: ['Retrait article', 'Item collection', 'Levantamento do artigo'],
  rentalItem: ['Location article', 'Item rental', 'Aluguer do artigo'],
  resalePayout: ['Retrait argent revente AK', 'AK resale payout', 'Pagamento de revenda AK'],
  item: ['Article', 'Item', 'Artigo'], variant: ['Variante', 'Variant', 'Variante'],
  start: ['Départ', 'Start', 'Início'], return: ['Retour prévu', 'Expected return', 'Devolução prevista'],
  days: ['Nombre de jours', 'Number of days', 'Número de dias'], dayUnit: ['jour(s)', 'day(s)', 'dia(s)'],
  from: ['du', 'from', 'de'], to: ['au', 'to', 'a'],
  dailyPrice: ['Prix/jour', 'Price/day', 'Preço/dia'], deposit: ['Caution', 'Deposit', 'Caução'],
  rentalTotal: ['Total location', 'Rental total', 'Total do aluguer'],
  rentalStatus: ['Statut location', 'Rental status', 'Estado do aluguer'],
  orderDate: ['Date commande', 'Order date', 'Data da encomenda'],
  eurValue: ['Valeur EUR', 'EUR value', 'Valor EUR'], rate: ['Taux', 'Exchange rate', 'Taxa de câmbio'],
  payout: ['Montant retiré équivalent', 'Equivalent payout amount', 'Montante equivalente pago'],
  cashier: ['Caissier', 'Cashier', 'Operador de caixa'], document: ['Document', 'Document', 'Documento'],
  requestedAt: ['Demande', 'Requested', 'Pedido'],
};
const values = {
  partially_refunded: ['Partiellement remboursé', 'Partially refunded', 'Parcialmente reembolsado'],
  pending_payment: ['En attente de paiement', 'Awaiting payment', 'A aguardar pagamento'],
  ready_for_payout: ['Prêt au paiement', 'Ready for payout', 'Pronto para pagamento'],
  requires_action: ['Action requise', 'Action required', 'Ação necessária'],
  succeeded: ['Réussi', 'Succeeded', 'Concluído'],
  gift_card_purchase: ['Achat de carte cadeau', 'Gift card purchase', 'Compra de cartão-presente'],
  rental_fee: ['Frais de location', 'Rental fee', 'Custo do aluguer'],
  other: ['Autre', 'Other', 'Outro'],
  paid: ['Payé', 'Paid', 'Pago'], pending: ['En attente', 'Pending', 'Pendente'],
  unpaid: ['Non payé', 'Unpaid', 'Não pago'], failed: ['Échec', 'Failed', 'Falhou'],
  refunded: ['Remboursé', 'Refunded', 'Reembolsado'], partially_paid: ['Partiellement payé', 'Partially paid', 'Parcialmente pago'],
  cancelled: ['Annulé', 'Cancelled', 'Cancelado'], approved: ['Approuvé', 'Approved', 'Aprovado'],
  requested: ['Demandé', 'Requested', 'Solicitado'], rejected: ['Refusé', 'Rejected', 'Recusado'],
  confirmed: ['Confirmé', 'Confirmed', 'Confirmado'], processing: ['En cours', 'Processing', 'Em processamento'],
  shipped: ['Expédié', 'Shipped', 'Enviado'], delivered: ['Livré', 'Delivered', 'Entregue'],
  completed: ['Terminé', 'Completed', 'Concluído'], ready_for_pickup: ['Prêt au retrait', 'Ready for collection', 'Pronto para levantamento'],
  reserved: ['Réservé', 'Reserved', 'Reservado'], active: ['Actif', 'Active', 'Ativo'],
  return_due: ['Retour attendu', 'Return due', 'Devolução prevista'], overdue: ['En retard', 'Overdue', 'Em atraso'],
  returned: ['Retourné', 'Returned', 'Devolvido'], damaged: ['Endommagé', 'Damaged', 'Danificado'],
  lost: ['Perdu', 'Lost', 'Perdido'], not_applicable: ['Sans objet', 'Not applicable', 'Não aplicável'],
  stripe: ['Stripe', 'Stripe', 'Stripe'], cash: ['Espèces', 'Cash', 'Numerário'],
  bank_transfer: ['Virement bancaire', 'Bank transfer', 'Transferência bancária'],
  gift_card: ['Carte cadeau', 'Gift card', 'Cartão-presente'], card: ['Carte bancaire', 'Bank card', 'Cartão bancário'],
  purchase: ['Achat', 'Purchase', 'Compra'], order: ['Commande', 'Order', 'Encomenda'],
  rental: ['Location', 'Rental', 'Aluguer'], rental_deposit: ['Caution de location', 'Rental deposit', 'Caução de aluguer'],
  rental_late_fee: ['Frais de retard', 'Late fee', 'Taxa de atraso'], rental_damage_fee: ['Frais de dommage', 'Damage fee', 'Taxa por danos'],
  resale: ['Revente', 'Resale', 'Revenda'], refund: ['Remboursement', 'Refund', 'Reembolso'],
};

export function normalizeReceiptLanguage(value) {
  if (typeof value !== 'string') return undefined;
  const language = value.toLowerCase().trim().split(/[-_]/)[0];
  return ['fr', 'en', 'pt'].includes(language) ? language : undefined;
}

export function receiptLanguage(req) {
  return normalizeReceiptLanguage(req.query?.lang)
    || normalizeReceiptLanguage(req.user?.preferred_language) || 'pt';
}

export function receiptLocale(language = 'pt') {
  language = normalizeReceiptLanguage(language) || 'pt';
  const index = { fr: 0, en: 1, pt: 2 }[language];
  const locale = { fr: 'fr-FR', en: 'en-GB', pt: 'pt-PT' }[language];
  return {
    language,
    t: (key) => labels[key]?.[index] || key,
    value: (key) => values[key]?.[index] || key || '-',
    eur: (value) => `${Number(value || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} EUR`,
    aoa: (value, currency = 'Kwanza') => `${Math.round(Number(value || 0)).toLocaleString(locale)} ${currency}`,
    date: (value, dateOnly = false) => {
      if (!value) return '-';
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) return '-';
      return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', ...(dateOnly ? {} : { timeStyle: 'short' }) }).format(parsed);
    },
  };
}
