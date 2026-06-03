"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/app/login/actions";

const tabs = [
  {
    href: "/",
    label: "لوحة التحكم",
    icon: (
      <path d="M3 12 12 4l9 8M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" />
    ),
  },
  {
    href: "/materials",
    label: "المواد الأولية",
    icon: (
      <path d="M5 8h14M5 8a2 2 0 0 1-2-2V5h18v1a2 2 0 0 1-2 2M6 8v11a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V8" />
    ),
  },
  {
    href: "/products",
    label: "المنتجات",
    icon: (
      <path d="M21 8 12 3 3 8l9 5 9-5Zm0 0v8l-9 5-9-5V8" />
    ),
  },
];

export default function NavBar({ email }: { email: string }) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* تنقل علوي للشاشات الكبيرة */}
      <nav className="hidden items-center gap-1 rounded-2xl border border-white/70 bg-white/70 p-1.5 shadow-soft backdrop-blur md:flex">
        {tabs.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              isActive(t.href)
                ? "bg-brand-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white"
            }`}
          >
            <Icon>{t.icon}</Icon>
            {t.label}
          </Link>
        ))}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-rose-50 hover:text-rose-600"
          >
            <Icon>
              <path d="M15 12H3m0 0 4-4m-4 4 4 4M21 4v16" />
            </Icon>
            خروج
          </button>
        </form>
      </nav>

      {/* تنقل سفلي للموبايل */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/70 bg-white/90 px-2 pb-[env(safe-area-inset-bottom)] pt-1.5 shadow-[0_-8px_30px_-12px_rgba(8,145,178,0.25)] backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-3xl items-stretch justify-around">
          {tabs.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold transition ${
                isActive(t.href) ? "text-brand-600" : "text-slate-400"
              }`}
            >
              <Icon>{t.icon}</Icon>
              {t.label}
            </Link>
          ))}
          <form action={logoutAction} className="flex flex-1">
            <button
              type="submit"
              className="flex flex-1 flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-semibold text-slate-400 transition hover:text-rose-600"
            >
              <Icon>
                <path d="M15 12H3m0 0 4-4m-4 4 4 4M21 4v16" />
              </Icon>
              خروج
            </button>
          </form>
        </div>
      </nav>
    </>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {children}
    </svg>
  );
}
