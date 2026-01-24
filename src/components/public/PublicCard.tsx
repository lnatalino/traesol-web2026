// src/components/public/PublicCard.tsx
import Link from "next/link";
import { ReactNode } from "react";

type Props = {
  href?: string;
  children: ReactNode;
  className?: string;
  hover?: boolean;
};

export function PublicCard({ href, children, className = "", hover = true }: Props) {
  const baseClasses = `overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${
    hover ? "transition hover:-translate-y-0.5 hover:shadow-lg" : ""
  } ${className}`;

  if (href) {
    return (
      <Link href={href} className={`block ${baseClasses}`}>
        {children}
      </Link>
    );
  }

  return <div className={baseClasses}>{children}</div>;
}

type CardImageProps = {
  src: string;
  alt: string;
  aspectRatio?: "video" | "square" | "wide";
};

const aspectClasses = {
  video: "aspect-video",
  square: "aspect-square",
  wide: "aspect-[2/1]",
};

export function PublicCardImage({ src, alt, aspectRatio = "video" }: CardImageProps) {
  return (
    <div className={`w-full bg-slate-100 ${aspectClasses[aspectRatio]}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="h-full w-full object-cover" />
    </div>
  );
}

type CardBodyProps = {
  children: ReactNode;
  className?: string;
};

export function PublicCardBody({ children, className = "" }: CardBodyProps) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

type CardEyebrowProps = {
  children: ReactNode;
  color?: "blue" | "slate";
};

export function PublicCardEyebrow({ children, color = "blue" }: CardEyebrowProps) {
  const colorClass = color === "blue" ? "text-blue-600" : "text-slate-500";
  return (
    <p className={`text-xs font-semibold uppercase tracking-[0.3em] ${colorClass}`}>
      {children}
    </p>
  );
}
