"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

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
  const user = await requireUser();

  const name = input.name.trim();
  if (!name) return { ok: false, error: "اسم المنتج مطلوب." };
  if (!isFinite(input.outputQuantity) || input.outputQuantity <= 0)
    return { ok: false, error: "الكمية المنتجة يجب أن تكون أكبر من صفر." };

  const cleaned = input.ingredients.filter(
    (i) => i.materialId && isFinite(i.quantity) && i.quantity > 0
  );

  // التأكد أن كل المواد تخص المستخدم
  if (cleaned.length > 0) {
    const ids = cleaned.map((i) => i.materialId);
    const count = await prisma.material.count({
      where: { id: { in: ids }, userId: user.id },
    });
    if (count !== new Set(ids).size)
      return { ok: false, error: "بعض المواد غير صالحة." };
  }

  const product = await prisma.product.create({
    data: {
      userId: user.id,
      name,
      outputQuantity: input.outputQuantity,
      ingredients: {
        create: cleaned.map((i) => ({
          materialId: i.materialId,
          quantity: i.quantity,
        })),
      },
    },
  });

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
  const user = await requireUser();

  const existing = await prisma.product.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "المنتج غير موجود." };

  const name = input.name.trim();
  if (!name) return { ok: false, error: "اسم المنتج مطلوب." };
  if (!isFinite(input.outputQuantity) || input.outputQuantity <= 0)
    return { ok: false, error: "الكمية المنتجة يجب أن تكون أكبر من صفر." };

  const cleaned = input.ingredients.filter(
    (i) => i.materialId && isFinite(i.quantity) && i.quantity > 0
  );

  if (cleaned.length > 0) {
    const ids = cleaned.map((i) => i.materialId);
    const count = await prisma.material.count({
      where: { id: { in: ids }, userId: user.id },
    });
    if (count !== new Set(ids).size)
      return { ok: false, error: "بعض المواد غير صالحة." };
  }

  // استبدال المكونات بالكامل ضمن معاملة
  await prisma.$transaction([
    prisma.ingredient.deleteMany({ where: { productId: id } }),
    prisma.product.update({
      where: { id },
      data: {
        name,
        outputQuantity: input.outputQuantity,
        ingredients: {
          create: cleaned.map((i) => ({
            materialId: i.materialId,
            quantity: i.quantity,
          })),
        },
      },
    }),
  ]);

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  revalidatePath("/");
  return { ok: true, id };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const user = await requireUser();
  const existing = await prisma.product.findFirst({
    where: { id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return { ok: false, error: "المنتج غير موجود." };

  await prisma.product.delete({ where: { id } });

  revalidatePath("/products");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProductAndRedirect(id: string): Promise<void> {
  const res = await deleteProduct(id);
  if (res.ok) redirect("/products");
}
