import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import MaterialsClient from "./MaterialsClient";

export default async function MaterialsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const materials = await prisma.material.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { ingredients: true } } },
  });

  const data = materials.map((m) => ({
    id: m.id,
    name: m.name,
    unit: m.unit,
    pricePerUnit: m.pricePerUnit,
    usedIn: m._count.ingredients,
  }));

  return <MaterialsClient materials={data} />;
}
