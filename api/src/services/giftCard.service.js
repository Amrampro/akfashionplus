export function availableGiftCardBalance(card) {
  return (
    Number(card.current_balance_eur || 0) -
    Number(card.reserved_balance_eur || 0)
  );
}

export function canUseGiftCard(card, amountEur) {
  return (
    card.status === "active" &&
    availableGiftCardBalance(card) >= Number(amountEur || 0)
  );
}

export default { availableGiftCardBalance, canUseGiftCard };
