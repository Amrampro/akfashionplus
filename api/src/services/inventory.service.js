export function availableQuantity(variant) {
  return (
    Number(variant.stock_quantity || 0) - Number(variant.reserved_quantity || 0)
  );
}

export function hasEnoughQuantity(variant, requestedQuantity) {
  return availableQuantity(variant) >= Number(requestedQuantity || 0);
}

export default { availableQuantity, hasEnoughQuantity };
