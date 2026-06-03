export const UNITS = {
  kg: { label: "كيلو", short: "كغ" },
  l: { label: "لتر", short: "ل" },
} as const;

export type UnitKey = keyof typeof UNITS;

export function unitLabel(unit: string): string {
  return UNITS[unit as UnitKey]?.label ?? unit;
}

export function unitShort(unit: string): string {
  return UNITS[unit as UnitKey]?.short ?? unit;
}

/** تنسيق رقم كعملة دولار، مع دعم الكسور (مثل 1.25). */
export function formatMoney(value: number): string {
  if (!isFinite(value)) return "$0.00";
  return (
    "$" +
    value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

/** تنسيق كمية رقمية مع إزالة الأصفار الزائدة (3 يبقى 3، و1.25 يبقى 1.25). */
export function formatQty(value: number): string {
  if (!isFinite(value)) return "0";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
}

/** تحويل نص إلى رقم يدعم الكسور والفاصلة العربية. يرجع NaN إن لم يكن رقماً. */
export function parseNumber(input: string | number): number {
  if (typeof input === "number") return input;
  const cleaned = String(input)
    .trim()
    .replace(/٫|،/g, ".") // الفاصلة العربية
    .replace(/[^\d.\-]/g, "");
  if (cleaned === "" || cleaned === "-" || cleaned === ".") return NaN;
  return Number(cleaned);
}

type IngredientLike = {
  quantity: number;
  material: { pricePerUnit: number };
};

/** التكلفة الإجمالية لخلطة المنتج. */
export function totalCost(ingredients: IngredientLike[]): number {
  return ingredients.reduce(
    (sum, ing) => sum + ing.quantity * ing.material.pricePerUnit,
    0
  );
}

/** تكلفة الكيلو الواحد من المنتج. */
export function costPerUnit(
  ingredients: IngredientLike[],
  outputQuantity: number
): number {
  if (!outputQuantity || outputQuantity <= 0) return 0;
  return totalCost(ingredients) / outputQuantity;
}
