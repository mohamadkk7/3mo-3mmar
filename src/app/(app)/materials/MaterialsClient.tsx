"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { formatMoney, parseNumber, unitLabel } from "@/lib/format";
import {
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "./actions";

type Material = {
  id: string;
  name: string;
  unit: string;
  pricePerUnit: number;
  usedIn: number;
};

export default function MaterialsClient({
  materials,
}: {
  materials: Material[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // حقول النموذج الجديد
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState("");

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const fd = new FormData();
    fd.set("name", name);
    fd.set("unit", unit);
    fd.set("price", price || "0");
    startTransition(async () => {
      const res = await createMaterial(fd);
      if (!res.ok) {
        setError(res.error ?? "حدث خطأ");
        return;
      }
      setName("");
      setPrice("");
      setUnit("kg");
      router.refresh();
    });
  }

  function handleDelete(m: Material) {
    if (m.usedIn > 0) {
      setError("لا يمكن حذف مادة مستخدمة في منتجات.");
      return;
    }
    if (!confirm(`حذف المادة «${m.name}»؟`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteMaterial(m.id);
      if (!res.ok) setError(res.error ?? "حدث خطأ");
      else router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">المواد الأولية</h1>
        <p className="mt-1 text-sm text-slate-500">
          عرّف المواد وسعّرها مرة واحدة. عند تغيّر السعر، عدّله هنا ليتحدّث رأس
          مال كل المنتجات تلقائياً.
        </p>
      </div>

      {/* إضافة مادة */}
      <form onSubmit={handleAdd} className="card space-y-4">
        <h2 className="text-sm font-bold text-slate-700">+ إضافة مادة جديدة</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <div>
            <label className="label">اسم المادة</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              placeholder="مثال: ملح، ماء، زفت"
              required
            />
          </div>
          <div>
            <label className="label">الوحدة</label>
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="input min-w-[7rem]"
            >
              <option value="kg">كيلو</option>
              <option value="l">لتر</option>
            </select>
          </div>
          <div>
            <label className="label">السعر / الوحدة ($)</label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="input min-w-[8rem] text-left"
              dir="ltr"
              inputMode="decimal"
              placeholder="0.00"
            />
          </div>
        </div>
        {error && (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-600">
            {error}
          </p>
        )}
        <button className="btn-primary" disabled={isPending}>
          {isPending ? "جارٍ الحفظ..." : "إضافة المادة"}
        </button>
      </form>

      {/* قائمة المواد */}
      {materials.length === 0 ? (
        <div className="card text-center text-sm text-slate-500">
          لا توجد مواد بعد. أضف أول مادة من الأعلى.
        </div>
      ) : (
        <div className="space-y-2.5">
          {materials.map((m) => (
            <MaterialRow
              key={m.id}
              material={m}
              editing={editingId === m.id}
              onEdit={() => {
                setError(null);
                setEditingId(editingId === m.id ? null : m.id);
              }}
              onDelete={() => handleDelete(m)}
              onSaved={() => {
                setEditingId(null);
                router.refresh();
              }}
              onError={(msg) => setError(msg)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialRow({
  material,
  editing,
  onEdit,
  onDelete,
  onSaved,
  onError,
}: {
  material: Material;
  editing: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSaved: () => void;
  onError: (msg: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(material.name);
  const [unit, setUnit] = useState(material.unit);
  const [price, setPrice] = useState(String(material.pricePerUnit));

  function save() {
    const parsed = parseNumber(price);
    startTransition(async () => {
      const res = await updateMaterial(material.id, {
        name,
        unit,
        price: parsed,
      });
      if (!res.ok) onError(res.error ?? "حدث خطأ");
      else onSaved();
    });
  }

  if (editing) {
    return (
      <div className="card space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto]">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input"
            placeholder="اسم المادة"
          />
          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="input min-w-[7rem]"
          >
            <option value="kg">كيلو</option>
            <option value="l">لتر</option>
          </select>
          <input
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="input min-w-[8rem] text-left"
            dir="ltr"
            inputMode="decimal"
          />
        </div>
        <div className="flex gap-2">
          <button className="btn-primary" onClick={save} disabled={isPending}>
            {isPending ? "حفظ..." : "حفظ"}
          </button>
          <button className="btn-ghost" onClick={onEdit} disabled={isPending}>
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card flex items-center justify-between gap-3 !p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate font-semibold text-slate-800">
            {material.name}
          </span>
          <span className="chip">{unitLabel(material.unit)}</span>
        </div>
        <div className="mt-0.5 text-xs text-slate-400">
          {material.usedIn > 0
            ? `مستخدمة في ${material.usedIn} منتج`
            : "غير مستخدمة بعد"}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-left">
          <div className="font-bold text-brand-700" dir="ltr">
            {formatMoney(material.pricePerUnit)}
          </div>
          <div className="text-[11px] text-slate-400">
            / {unitLabel(material.unit)}
          </div>
        </div>
        <button
          onClick={onEdit}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600"
          title="تعديل"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
          title="حذف"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m1 0v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
