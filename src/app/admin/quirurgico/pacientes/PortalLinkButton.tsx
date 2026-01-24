"use client";

export function PortalLinkButton() {
  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.alert("El portal del paciente estará disponible en una próxima versión.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-xs font-medium text-slate-500 underline transition hover:text-slate-700"
    >
      Portal del paciente (próximamente)
    </button>
  );
}
