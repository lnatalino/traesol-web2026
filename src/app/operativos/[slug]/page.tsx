// src/app/operativos/[slug]/page.tsx
import { notFound } from "next/navigation";
import OperativoDetailClient from "./_client";

export const dynamic = "force-dynamic";

// En Next 16, params es una Promise: hay que await
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const nice = (slug ?? "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
  return { title: `${nice} · Operativo · Traesol` };
}

export default async function OperativoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = (slug ?? "").trim().toLowerCase();
  if (!s) return notFound();
  return <OperativoDetailClient slug={s} />;
}
