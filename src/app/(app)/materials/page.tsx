import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import MaterialsClient from "./MaterialsClient";
import { listMaterialsWithUsage } from "@/lib/store";

export default async function MaterialsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const data = await listMaterialsWithUsage();

  return <MaterialsClient materials={data} />;
}
