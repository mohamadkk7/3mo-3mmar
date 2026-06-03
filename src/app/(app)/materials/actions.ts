"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { parseNumber } from "@/lib/format";
import {
  createMaterial as createStoredMaterial,
  deleteMaterial as deleteStoredMaterial,
  listMaterialsWithUsage,
  updateMaterial as updateStoredMaterial,
} from "@/lib/store";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("غير مصرّح");
  return user;
}

export type ActionResult = { ok: boolean; error?: string };

export async function createMaterial(formData: FormData): Promise<ActionResult> {
  await requireUser();

  const name = String(formData.get("name") || "").trim();
  const unit = String(formData.get("unit") || "kg");
  const price = parseNumber(String(formData.get("price") || "0"));

  if (!name) return { ok: false, error: "اسم المادة مطلوب." };
  if (unit !== "kg" && unit !== "l")
    return { ok: false, error: "وحدة غير صالحة." };
  if (!isFinite(price) || price < 0)
    return { ok: false, error: "السعر غير صالح." };

  await createStoredMaterial({ name, unit, pricePerUnit: price });

  revalidatePath("/materials");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function updateMaterialPrice(
  id: string,
  price: number
): Promise<ActionResult> {
  await requireUser();
  if (!isFinite(price) || price < 0)
    return { ok: false, error: "السعر غير صالح." };

  const material = await updateStoredMaterial(id, { pricePerUnit: price });
  if (!material) return { ok: false, error: "المادة غير موجودة." };

  revalidatePath("/materials");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function updateMaterial(
  id: string,
  data: { name?: string; unit?: string; price?: number }
): Promise<ActionResult> {
  await requireUser();

  const patch: { name?: string; unit?: "kg" | "l"; pricePerUnit?: number } = {};
  if (data.name !== undefined) {
    const name = data.name.trim();
    if (!name) return { ok: false, error: "اسم المادة مطلوب." };
    patch.name = name;
  }
  if (data.unit !== undefined) {
    if (data.unit !== "kg" && data.unit !== "l")
      return { ok: false, error: "وحدة غير صالحة." };
    patch.unit = data.unit;
  }
  if (data.price !== undefined) {
    if (!isFinite(data.price) || data.price < 0)
      return { ok: false, error: "السعر غير صالح." };
    patch.pricePerUnit = data.price;
  }

  const material = await updateStoredMaterial(id, patch);
  if (!material) return { ok: false, error: "المادة غير موجودة." };

  revalidatePath("/materials");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteMaterial(id: string): Promise<ActionResult> {
  await requireUser();

  const material = (await listMaterialsWithUsage()).find((item) => item.id === id);
  if (!material) return { ok: false, error: "المادة غير موجودة." };
  if (material.usedIn > 0)
    return {
      ok: false,
      error: "لا يمكن حذف مادة مستخدمة في منتجات. احذفها من المنتجات أولاً.",
    };

  await deleteStoredMaterial(id);

  revalidatePath("/materials");
  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}
