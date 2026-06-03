import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ProductEditor from "../../ProductEditor";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [product, materials] = await Promise.all([
    prisma.product.findFirst({
      where: { id, userId: user.id },
      include: { ingredients: true },
    }),
    prisma.material.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true, unit: true, pricePerUnit: true },
    }),
  ]);

  if (!product) notFound();

  const initial = {
    id: product.id,
    name: product.name,
    outputQuantity: product.outputQuantity,
    ingredients: product.ingredients.map((i) => ({
      materialId: i.materialId,
      quantity: i.quantity,
    })),
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/products" className="text-brand-600 hover:underline">
          المنتجات
        </Link>
        <span className="text-slate-300">/</span>
        <Link
          href={`/products/${product.id}`}
          className="text-brand-600 hover:underline"
        >
          {product.name}
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500">تعديل</span>
      </div>
      <h1 className="text-xl font-bold text-slate-800">تعديل المنتج</h1>
      <ProductEditor materials={materials} initial={initial} />
    </div>
  );
}
