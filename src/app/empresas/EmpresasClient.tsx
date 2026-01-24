"use client";

import { useState } from "react";
import { EmpresasPathSelector, type EmpresasPath } from "./EmpresasPathSelector";
import { EmpresasContactForm } from "./EmpresasContactForm";
import EmpresasForm from "./EmpresasForm";
import type { EmpresaProductoWithPackItems } from "@/lib/empresas";

interface EmpresasClientProps {
  productos: EmpresaProductoWithPackItems[];
}

export function EmpresasClient({ productos }: EmpresasClientProps) {
  const [selectedPath, setSelectedPath] = useState<EmpresasPath>("contacto");

  return (
    <div className="space-y-10">
      {/* Selector de caminos */}
      <section className="space-y-4">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-blue-600">¿Cómo quieres empezar?</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">Elige la opción que mejor se adapte a ti</h2>
        </div>
        <EmpresasPathSelector selected={selectedPath} onSelect={setSelectedPath} />
      </section>

      {/* Contenido según camino seleccionado */}
      {selectedPath === "contacto" ? (
        <EmpresasContactForm />
      ) : (
        <EmpresasForm productos={productos} />
      )}
    </div>
  );
}
