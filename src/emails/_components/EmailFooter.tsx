// src/emails/_components/EmailFooter.tsx
// Footer estándar para todos los emails de Traesol

import * as React from "react";

interface EmailFooterProps {
  note?: string;
}

const SUPPORT_EMAIL = "contacto@fundaciontraesol.cl";

export function EmailFooter({ note = "Este es un mensaje automático." }: EmailFooterProps) {
  const year = new Date().getFullYear();
  
  return (
    <tr>
      <td
        style={{
          padding: "20px 24px",
          background: "#f8fafc",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <p style={{ color: "#64748b", fontSize: "12px", margin: "0 0 8px", lineHeight: 1.5 }}>
          {note}
        </p>
        <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 4px" }}>
          ¿Dudas? Escríbenos a{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "#0b4dbf", textDecoration: "none" }}>
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p style={{ color: "#94a3b8", fontSize: "12px", margin: 0 }}>
          © {year} Fundación Traesol. Todos los derechos reservados.
        </p>
      </td>
    </tr>
  );
}
