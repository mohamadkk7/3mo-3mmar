import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { costPerUnit, formatMoney, formatQty } from "@/lib/format";
import { countMaterials, listProductsExpanded } from "@/lib/store";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [materialsCount, products] = await Promise.all([
    countMaterials(),
    listProductsExpanded({ order: "updatedDesc" }),
  ]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-800">لوحة التحكم</h1>
        <p className="mt-1 text-sm text-slate-500">
          نظرة سريعة على المواد والمنتجات وأسعار الكيلو.
        </p>
      </div>

      {/* بطاقات الإحصاء */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/materials" className="card transition hover:shadow-lg">
          <div className="text-3xl font-extrabold text-brand-700">
            {materialsCount}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-500">
            مادة أولية
          </div>
        </Link>
        <Link href="/products" className="card transition hover:shadow-lg">
          <div className="text-3xl font-extrabold text-leaf-600">
            {products.length}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-500">منتج</div>
        </Link>
      </div>

      {/* إجراءات سريعة */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/materials" className="btn-ghost justify-center">
          إدارة المواد
        </Link>
        <Link href="/products/new" className="btn-primary justify-center">
          + منتج جديد
        </Link>
      </div>

      {/* آخر المنتجات */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-700">أحدث المنتجات</h2>
          {products.length > 0 && (
            <Link
              href="/products"
              className="text-xs font-medium text-brand-600 hover:underline"
            >
              عرض الكل
            </Link>
          )}
        </div>

        {products.length === 0 ? (
          <div className="card text-center text-sm text-slate-500">
            ابدأ بإضافة المواد الأولية ثم أنشئ أول منتج.
          </div>
        ) : (
          <div className="space-y-2.5">
            {products.slice(0, 5).map((p) => {
              const perKg = costPerUnit(p.ingredients, p.outputQuantity);
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="card flex items-center justify-between gap-3 !p-4 transition hover:shadow-lg"
                >
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-slate-800">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      ينتج {formatQty(p.outputQuantity)} كيلو
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] text-slate-400">سعر الكيلو</div>
                    <div className="font-bold text-leaf-600" dir="ltr">
                      {formatMoney(perKg)}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
