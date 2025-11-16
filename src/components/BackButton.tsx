"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function BackButton({ fallback = "/" }: { fallback?: string }) {
  const router = useRouter();
  return (
    <div className="mb-4">
      <button
        type="button"
        onClick={() => {
          // intenta volver; si no hay historial, ve al fallback
          if (window.history.length > 1) router.back();
          else router.push(fallback);
        }}
        className="px-3 py-1.5 rounded-xl border shadow-sm hover:shadow transition text-sm"
      >
        ← Volver
      </button>
    </div>
  );
}
