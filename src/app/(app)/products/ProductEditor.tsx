"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, formatQty, parseNumber, unitLabel } from "@/lib/format";
import { createProduct, updateProduct } from "./actions";

type MaterialOption = {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
};

type Row = {
  key: string;
  materialId: string;
  quantity: string;
};

export type ProductInitial = {
  id: string;
  name: string;
  outputQuantity: number;
  ingredients: { materialId: string; quantity: number }[];
};

let keyCounter = 0;
const newKey = () => `r${keyCounter++}`;

export default function ProductEditor({
  materials,
  initial,
}: {
  materials: MaterialOption[];
  initial?: ProductInitial;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initial?.name ?? "");
  const [outputQty, setOutputQty] = useState(
    initial ? String(initial.outputQuantity) : ""
  );
  const [rows, setRows] = useState<Row[]>(
    initial && initial.ingredients.length > 0
      ? initial.ingredients.map((i) => ({
          key: newKey(),
          materialId: i.materialId,
          quantity: String(i.quantity),
        }))
      : [{ key: newKey(), materialId: "", quantity: "" }]
  );

  const materialById = useMemo(() => {
    const map = new Map<string, MaterialOption>();
    materials.forEach((m) => map.set(m.id, m));
    return map;
  }, [materials]);

  // الحسابات الحية
  const computed = useMemo(() => {
    let total = 0;
    const lines = rows.map((r) => {
      const mat = materialById.get(r.materialId);
      const qty = parseNumber(r.quantity);
      const lineCost =
        mat && isFinite(qty) && qty > 0 ? qty * mat.pricePerUnit : 0;
      total += lineCost;
      return { ...r, mat, qty, lineCost };
    });
    const out = parseNumber(outputQty);
    const perKg = isFinite(out) && out > 0 ? total / out : 0;
    return { lines, total, perKg, out };
  }, [rows, outputQty, materialById]);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((r) => (r.key === key ? { ...r, ...patch } : r))
    );
  }
  function addRow() {
    setRows((prev) => [...prev, { key: newKey(), materialId: "", quantity: "" }]);
  }
  function removeRow(key: string) {
    setRows((prev) =>
      prev.length === 1 ? prev : prev.filter((r) => r.key !== key)
    );
  }

  function save() {
    setError(null);
    const ingredients = rows
      .map((r) => ({
        materialId: r.materialId,
        quantity: parseNumber(r.quantity),
      }))
      .filter((i) => i.materialId && isFinite(i.quantity) && i.quantity > 0);

    const payload = {
      name,
      outputQuantity: parseNumber(outputQty),
      ingredients,
    };

    startTransition(async () => {
      const res = initial
        ? await updateProduct(initial.id, payload)
        : await createProduct(payload);
      if (!res.ok) {
        setError(res.error ?? "حدث خطأ");
        return;
      }

      if (initial) {
        router.push(`/products/${res.id ?? initial.id}`);
      } else {
        router.push("/products");
      }

      router.refresh();
    });
  }

  if (materials.length === 0) {
    return (
      <div className="card bg-amber-50/80 text-sm text-amber-700 ring-1 ring-amber-100">
        لا توجد مواد أولية. أضف المواد أولاً من تبويب «المواد الأولية».
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="card space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label">اسم المنتج</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="مثال: دواء غسيل"
            />
          </div>
          <div>
            <label className="label">الكمية المنتجة من الخلطة (كيلو)</label>
            <input
              value={outputQty}
              onChange={(e) => setOutputQty(e.target.value)}
              className="input text-left"
              dir="ltr"
              inputMode="decimal"
              placeholder="مثال: 10"
            />
          </div>
        </div>
      </div>

      {/* مكونات الخلطة */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">مكونات الخلطة</h2>
          <button onClick={addRow} className="btn-ghost !py-1.5 !px-3 text-xs">
            + مادة
          </button>
        </div>

        <div className="space-y-2.5">
          {computed.lines.map((line) => (
            <div
              key={line.key}
              className="grid grid-cols-[1fr_auto_auto] items-end gap-2 rounded-xl bg-slate-50/70 p-2.5"
            >
              <div>
                <label className="label !mb-1 text-xs">المادة</label>
                <select
                  value={line.materialId}
                  onChange={(e) =>
                    updateRow(line.key, { materialId: e.target.value })
                  }
                  className="input !py-2"
                >
                  <option value="">— اختر —</option>
                  {materials.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({formatMoney(m.pricePerUnit)}/
                      {unitLabel(m.unit)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-24">
                <label className="label !mb-1 text-xs">
                  الكمية{line.mat ? ` (${unitLabel(line.mat.unit)})` : ""}
                </label>
                <input
                  value={line.quantity}
                  onChange={(e) =>
                    updateRow(line.key, { quantity: e.target.value })
                  }
                  className="input !py-2 text-left"
                  dir="ltr"
                  inputMode="decimal"
                  placeholder="0"
                />
              </div>
              <div className="flex flex-col items-end pb-1">
                <span className="text-[11px] text-slate-400">التكلفة</span>
                <span className="text-sm font-semibold text-brand-700" dir="ltr">
                  {formatMoney(line.lineCost)}
                </span>
              </div>
              <button
                onClick={() => removeRow(line.key)}
                className="col-span-3 justify-self-start text-xs text-rose-400 hover:text-rose-600"
                type="button"
              >
                إزالة هذه المادة
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* النتيجة */}
      <div className="card bg-gradient-to-l from-brand-600 to-leaf-500 text-white">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[11px] opacity-80">التكلفة الإجمالية</div>
            <div className="text-lg font-bold" dir="ltr">
              {formatMoney(computed.total)}
            </div>
          </div>
          <div>
            <div className="text-[11px] opacity-80">الكمية المنتجة</div>
            <div className="text-lg font-bold" dir="ltr">
              {computed.out > 0 ? `${formatQty(computed.out)} كغ` : "—"}
            </div>
          </div>
          <div>
            <div className="text-[11px] opacity-80">سعر الكيلو</div>
            <div className="text-xl font-extrabold" dir="ltr">
              {computed.out > 0 ? formatMoney(computed.perKg) : "—"}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button onClick={save} className="btn-primary flex-1" disabled={isPending}>
          {isPending ? "جارٍ الحفظ..." : initial ? "حفظ التعديلات" : "حفظ المنتج"}
        </button>
        <button
          onClick={() => router.back()}
          className="btn-ghost"
          disabled={isPending}
        >
          إلغاء
        </button>
      </div>
    </div>
  );
}
