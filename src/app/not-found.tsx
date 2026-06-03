import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="text-5xl font-extrabold text-brand-600">404</div>
      <p className="text-slate-500">الصفحة غير موجودة.</p>
      <Link href="/" className="btn-primary">
        العودة للرئيسية
      </Link>
    </main>
  );
}
