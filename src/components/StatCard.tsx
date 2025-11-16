import type { ReactNode } from "react";
import Link from "next/link";

export default function StatCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: ReactNode; // <- sin tipos de lucide
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border bg-[var(--brand-50)] p-6 shadow-sm hover:shadow-md transition-all flex items-center justify-between"
    >
      <div>
        <h3 className="text-2xl font-semibold text-[var(--brand-800)]">
          {title}
        </h3>
        <p className="mt-1 text-[15px] text-[var(--brand-700)]/80">
          {description}
        </p>
      </div>
      <span
        aria-hidden
        className="ml-6 shrink-0 text-[var(--brand-700)] group-hover:translate-x-0.5 transition-transform"
      >
        {icon}
      </span>
    </Link>
  );
}
