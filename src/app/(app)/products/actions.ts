"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  createProduct as createStoredProduct,
  deleteProduct as deleteStoredProduct,
  getProductById,
  listMaterials,
  updateProduct as updateStoredProduct,
} from "@/lib/store";

async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("غير مصرّح");
  return user;
}

export type ActionResult = { ok: boolean; error?: string; id?: string };

type IngredientInput = { materialId: string; quantity: number };

export async function createProduct(input: {
  name: string;
  outputQuantity: number;
  ingredients: IngredientInput[];
}): Promise<ActionResult> {
  await requireUser();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "اسم المنتج مطلوب." };
  if (!isFinite(input.outputQuantity) || input.outputQuantity <= 0)
    return { ok: false, error: "الكمية المنتجة يجب أن تكون أكبر من صفر." };

  const cleaned = input.ingredients.filter(
    (i) => i.materialId && isFinite(i.quantity) && i.quantity > 0
  );

  if (cleaned.length > 0) {
    const materials = await listMaterials();
    const ids = cleaned.map((i) => i.materialId);
    const validIds = new Set(materials.map((material) => material.id));
    if (!ids.every((id) => validIds.has(id))) {
      return { ok: false, error: "بعض المواد غير صالحة." };
    }
  }

  const product = await createStoredProduct({
    name,
    outputQuantity: input.outputQuantity,
    ingredients: cleaned,
  });
  if (!product) return { ok: false, error: "بعض المواد غير صالحة." };

  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true, id: product.id };
}

export async function updateProduct(
  id: string,
  input: {
    name: string;
    outputQuantity: number;
    ingredients: IngredientInput[];
  }
): Promise<ActionResult> {
  await requireUser();

  const existing = await getProductById(id);
  if (!existing) return { ok: false, error: "المنتج غير موجود." };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "اسم المنتج مطلوب." };
  if (!isFinite(input.outputQuantity) || input.outputQuantity <= 0)
    return { ok: false, error: "الكمية المنتجة يجب أن تكون أكبر من صفر." };

  const cleaned = input.ingredients.filter(
    (i) => i.materialId && isFinite(i.quantity) && i.quantity > 0
  );

  if (cleaned.length > 0) {
    const materials = await listMaterials();
    const ids = cleaned.map((i) => i.materialId);
    const validIds = new Set(materials.map((material) => material.id));
    if (!ids.every((materialId) => validIds.has(materialId))) {
      return { ok: false, error: "بعض المواد غير صالحة." };
    }
  }

  await updateStoredProduct(id, {
    name,
    outputQuantity: input.outputQuantity,
    ingredients: cleaned,
  });

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/");
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  await requireUser();
  const deleted = await deleteStoredProduct(id);
  if (!deleted) return { ok: false, error: "المنتج غير موجود." };

  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProductAndRedirect(id: string): Promise<void> {
  const res = await deleteProduct(id);
  if (res.ok) redirect("/products");
}
