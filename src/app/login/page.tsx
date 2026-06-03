import { redirect } from "next/navigation";
import { getConfiguredLogin, getSession } from "@/lib/auth";
import LoginForm from "./LoginForm";

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect("/");

  const login = getConfiguredLogin();

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-8 w-8"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 3h6m-3 0v3m-4 0h8l1 4H6l1-4Zm-1 4 1.2 11.2A2 2 0 0 0 9.2 21h5.6a2 2 0 0 0 2-1.8L18 7"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">معمل المنظفات</h1>
          <p className="mt-1 text-sm text-slate-500">
            حاسبة تكاليف المواد وأسعار المنتجات
          </p>
        </div>

        <div className="card">
          <LoginForm />
        </div>

        <p className="mt-4 text-center text-xs text-slate-400">
          الحساب الحالي: {login.email} / {login.password}
        </p>
      </div>
    </main>
  );
}
