import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { costPerUnit, formatMoney, formatQty, totalCost } from "@/lib/format";

export default async function ProductsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const products = await prisma.product.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { ingredients: { include: { material: true } } },
  });

  const materialsCount = await prisma.material.count({
    where: { userId: user.id },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">المنتجات</h1>
          <p className="mt-1 text-sm text-slate-500">
            كل منتج هو خلطة من مواد أولية، مع حساب تكلفة الكيلو تلقائياً.
          </p>
        </div>
        <Link href="/products/new" className="btn-primary shrink-0">
          + منتج
        </Link>
      </div>

      {materialsCount === 0 && (
        <div className="card bg-amber-50/80 text-sm text-amber-700 ring-1 ring-amber-100">
          لم تُعرّف أي مواد أولية بعد. أضف المواد أولاً من تبويب «المواد الأولية»
          لتتمكن من تكوين الخلطات.
        </div>
      )}

      {products.length === 0 ? (
        <div className="card text-center text-sm text-slate-500">
          لا توجد منتجات بعد.
          <div className="mt-3">
            <Link href="/products/new" className="btn-primary">
              إنشاء أول منتج
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {products.map((p) => {
            const cost = totalCost(p.ingredients);
            const perKg = costPerUnit(p.ingredients, p.outputQuantity);
            return (
              <Link
                key={p.id}
                href={`/products/${p.id}`}
                className="card flex items-center justify-between gap-3 transition hover:border-brand-200 hover:shadow-lg"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-slate-800">
                    {p.name}
                  </div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {p.ingredients.length} مادة • ينتج{" "}
                    {formatQty(p.outputQuantity)} كيلو
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-[11px] text-slate-400">سعر الكيلو</div>
                  <div className="text-lg font-bold text-leaf-600" dir="ltr">
                    {formatMoney(perKg)}
                  </div>
                  <div className="text-[11px] text-slate-400" dir="ltr">
                    إجمالي {formatMoney(cost)}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
