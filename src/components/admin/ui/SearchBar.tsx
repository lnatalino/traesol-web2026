import { Search, X } from "lucide-react";

type SearchBarProps = {
  /** Placeholder del input */
  placeholder?: string;
  /** Valor actual */
  value: string;
  /** Handler de cambio */
  onChange: (value: string) => void;
  /** Texto de ayuda debajo del input */
  hint?: string;
  /** Tamaño del componente */
  size?: "sm" | "md";
};

/**
 * Barra de búsqueda unificada con botón de limpiar.
 */
export function SearchBar({
  placeholder = "Buscar...",
  value,
  onChange,
  hint,
  size = "md",
}: SearchBarProps) {
  const sizeClasses = {
    sm: "h-9 text-sm pl-9 pr-8",
    md: "h-10 text-sm pl-10 pr-9",
  };

  const iconSizes = {
    sm: "h-4 w-4 left-2.5",
    md: "h-4 w-4 left-3",
  };

  return (
    <div className="w-full">
      <div className="relative">
        <Search
          className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${iconSizes[size]}`}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-lg border border-slate-200 bg-white transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 ${sizeClasses[size]}`}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {hint && (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
