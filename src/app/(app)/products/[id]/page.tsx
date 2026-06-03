import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import {
  costPerUnit,
  formatMoney,
  formatQty,
  totalCost,
  unitLabel,
} from "@/lib/format";
import DeleteProductButton from "./DeleteProductButton";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const product = await prisma.product.findFirst({
    where: { id, userId: user.id },
    include: {
      ingredients: { include: { material: true }, orderBy: { id: "asc" } },
    },
  });
  if (!product) notFound();

  const total = totalCost(product.ingredients);
  const perKg = costPerUnit(product.ingredients, product.outputQuantity);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/products" className="text-brand-600 hover:underline">
          المنتجات
        </Link>
        <span className="text-slate-300">/</span>
        <span className="truncate text-slate-500">{product.name}</span>
      </div>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">{product.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            ينتج {formatQty(product.outputQuantity)} كيلو من{" "}
            {product.ingredients.length} مادة.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            href={`/products/${product.id}/edit`}
            className="btn-ghost !px-3"
          >
            تعديل
          </Link>
          <DeleteProductButton id={product.id} name={product.name} />
        </div>
      </div>

      {/* بطاقة النتيجة */}
      <div className="card bg-gradient-to-l from-brand-600 to-leaf-500 text-white">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="text-[11px] opacity-80">رأس المال (الإجمالي)</div>
            <div className="text-lg font-bold" dir="ltr">
              {formatMoney(total)}
            </div>
          </div>
          <div>
            <div className="text-[11px] opacity-80">الكمية المنتجة</div>
            <div className="text-lg font-bold" dir="ltr">
              {formatQty(product.outputQuantity)} كغ
            </div>
          </div>
          <div>
            <div className="text-[11px] opacity-80">سعر الكيلو</div>
            <div className="text-xl font-extrabold" dir="ltr">
              {formatMoney(perKg)}
            </div>
          </div>
        </div>
      </div>

      {/* جدول المكونات */}
      <div className="card !p-0 overflow-hidden">
        <div className="border-b border-slate-100 px-4 py-3 text-sm font-bold text-slate-700">
          مكونات الخلطة
        </div>
        {product.ingredients.length === 0 ? (
          <div className="px-4 py-6 text-center text-sm text-slate-400">
            لا توجد مكونات.
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {product.ingredients.map((ing) => (
              <li
                key={ing.id}
                className="flex items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-800">
                    {ing.material.name}
                  </div>
                  <div className="text-xs text-slate-400" dir="ltr">
                    {formatQty(ing.quantity)} {unitLabel(ing.material.unit)} ×{" "}
                    {formatMoney(ing.material.pricePerUnit)}
                  </div>
                </div>
                <div className="font-semibold text-brand-700" dir="ltr">
                  {formatMoney(ing.quantity * ing.material.pricePerUnit)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <p className="text-center text-xs text-slate-400">
        عند تغيير سعر أي مادة من تبويب «المواد الأولية»، تتحدّث هذه الأرقام
        تلقائياً.
      </p>
    </div>
  );
}
