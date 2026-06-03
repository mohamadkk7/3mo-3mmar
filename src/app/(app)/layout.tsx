import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import NavBar from "@/components/NavBar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 pb-28 pt-5 md:pb-10">
      <header className="mb-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-soft">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-6 w-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 3h6m-3 0v3m-4 0h8l1 4H6l1-4Zm-1 4 1.2 11.2A2 2 0 0 0 9.2 21h5.6a2 2 0 0 0 2-1.8L18 7"
              />
            </svg>
          </span>
          <span className="text-lg font-bold leading-tight text-slate-800">
            معمل المنظفات
          </span>
        </Link>
        <span className="hidden text-xs text-slate-400 sm:inline" dir="ltr">
          {user.email}
        </span>
      </header>

      <NavBar email={user.email} />

      <main className="mt-5 flex-1">{children}</main>
    </div>
  );
}
