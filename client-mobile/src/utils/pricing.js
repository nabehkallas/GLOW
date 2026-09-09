// entity = a product or a resolved variant object from the API (both carry
// is_offer_active, offer_price, price_tiers, and either original_price+price
// (variant) or just price (product, always the base — client_price already
// renamed to `price` by ClientProductResource)).
export function resolvePrice(entity, qty = 1) {
  if (!entity) return 0;
  if (entity.is_offer_active) return Number(entity.offer_price);
  const tiers = entity.price_tiers || [];
  const tier = tiers
    .filter((t) => qty >= t.min_quantity && t.price != null)
    .sort((a, b) => b.min_quantity - a.min_quantity)[0];
  if (tier) return Number(tier.price);
  return Number(entity.original_price ?? entity.price);
}

export function originalPriceOf(entity) {
  return Number(entity?.original_price ?? entity?.price ?? 0);
}
