"use client";

import { MessageSquare, ShoppingBag } from "lucide-react";

export type EmpresasPath = "contacto" | "solicitud";

interface EmpresasPathSelectorProps {
  selected: EmpresasPath;
  onSelect: (path: EmpresasPath) => void;
}

const PATHS = [
  {
    id: "contacto" as const,
    icon: MessageSquare,
    title: "Quiero que me contacten",
    description: "Cuéntanos qué necesitas y te escribimos para orientarte.",
    cta: "Llenar formulario",
  },
  {
    id: "solicitud" as const,
    icon: ShoppingBag,
    title: "Explorar servicios",
    description: "Revisa el catálogo y arma una solicitud personalizada.",
    cta: "Ver catálogo",
  },
];

export function EmpresasPathSelector({ selected, onSelect }: EmpresasPathSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {PATHS.map((path) => {
        const isActive = selected === path.id;
        const Icon = path.icon;
        return (
          <button
            key={path.id}
            type="button"
            onClick={() => onSelect(path.id)}
            className={`group relative flex flex-col items-start rounded-3xl border-2 p-6 text-left transition-all duration-200 ${
              isActive
                ? "border-blue-600 bg-blue-50/80 shadow-md"
                : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-sm"
            }`}
          >
            <div
              className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-600"
              }`}
            >
              <Icon size={24} />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{path.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{path.description}</p>
            <span
              className={`mt-4 inline-flex items-center gap-1 text-sm font-semibold transition ${
                isActive ? "text-blue-700" : "text-slate-500 group-hover:text-blue-600"
              }`}
            >
              {path.cta}
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </span>
            {isActive && (
              <div className="absolute right-4 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
