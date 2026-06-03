import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ProductEditor from "../ProductEditor";

export default async function NewProductPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const materials = await prisma.material.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, unit: true, pricePerUnit: true },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/products" className="text-brand-600 hover:underline">
          المنتجات
        </Link>
        <span className="text-slate-300">/</span>
        <span className="text-slate-500">منتج جديد</span>
      </div>
      <h1 className="text-xl font-bold text-slate-800">إنشاء منتج جديد</h1>
      <ProductEditor materials={materials} />
    </div>
  );
}
