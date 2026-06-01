export const promoCodes = {
  EVENT20: {
    code: "EVENT20",
    label: "Event sale",
    type: "percent",
    value: 20,
    minTotal: 50000
  },
  CREATOR10: {
    code: "CREATOR10",
    label: "Creator discount",
    type: "percent",
    value: 10,
    minTotal: 0
  },
  BUNDLE15: {
    code: "BUNDLE15",
    label: "Bundle bonus",
    type: "percent",
    value: 15,
    minTotal: 60000
  }
};

export function normalizePromoCode(code) {
  return String(code || "").trim().toUpperCase().replace(/\s+/g, "");
}

export function validatePromo(code, subtotal) {
  const normalized = normalizePromoCode(code);
  if (!normalized) return null;

  const promo = promoCodes[normalized];
  if (!promo || subtotal < promo.minTotal) return null;

  const discount = promo.type === "percent"
    ? Math.round(subtotal * promo.value / 100)
    : Number(promo.value || 0);

  return {
    ...promo,
    discount: Math.min(discount, subtotal)
  };
}
