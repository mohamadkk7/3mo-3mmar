"use server";

import { redirect } from "next/navigation";
import {
  createSession,
  destroySession,
  verifyCredentials,
} from "@/lib/auth";

export type LoginState = { error?: string };

export async function loginAction(
  _prev: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "الرجاء إدخال البريد وكلمة السر." };
  }

  const user = await verifyCredentials(email, password);
  if (!user) {
    return { error: "البريد الإلكتروني أو كلمة السر غير صحيحة." };
  }

  await createSession({ userId: user.id, email: user.email });
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
