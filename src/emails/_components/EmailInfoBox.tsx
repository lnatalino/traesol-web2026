// src/emails/_components/EmailInfoBox.tsx
// Caja de información destacada para emails (credenciales, códigos, datos)

import * as React from "react";

interface EmailInfoBoxProps {
  title?: string;
  children: React.ReactNode;
  variant?: "default" | "warning" | "success" | "code";
}

const VARIANT_STYLES = {
  default: {
    background: "#f1f5f9",
    borderLeft: "none",
    borderRadius: "12px",
  },
  warning: {
    background: "#fef3c7",
    borderLeft: "4px solid #f59e0b",
    borderRadius: "0 8px 8px 0",
  },
  success: {
    background: "#dcfce7",
    borderLeft: "4px solid #22c55e",
    borderRadius: "0 8px 8px 0",
  },
  code: {
    background: "#f8fafc",
    borderLeft: "none",
    borderRadius: "12px",
    textAlign: "center" as const,
  },
};

export function EmailInfoBox({ 
  title, 
  children, 
  variant = "default" 
}: EmailInfoBoxProps) {
  const styles = VARIANT_STYLES[variant];
  
  return (
    <div
      style={{
        padding: "20px",
        marginBottom: "24px",
        ...styles,
      }}
    >
      {title && (
        <p
          style={{
            color: "#64748b",
            fontSize: "12px",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            margin: "0 0 12px",
            fontWeight: 600,
          }}
        >
          {title}
        </p>
      )}
      {children}
    </div>
  );
}

interface EmailInfoRowProps {
  label: string;
  value: string;
  mono?: boolean;
}

export function EmailInfoRow({ label, value, mono = false }: EmailInfoRowProps) {
  return (
    <tr>
      <td style={{ color: "#64748b", padding: "6px 0", fontSize: "14px", verticalAlign: "top" }}>
        {label}:
      </td>
      <td
        style={{
          color: "#0f172a",
          fontWeight: 600,
          fontSize: "14px",
          paddingLeft: "12px",
          fontFamily: mono ? "monospace" : "inherit",
          letterSpacing: mono ? "0.1em" : "normal",
        }}
      >
        {value}
      </td>
    </tr>
  );
}

export function EmailCodeDisplay({ code }: { code: string }) {
  return (
    <div
      style={{
        background: "#f1f5f9",
        borderRadius: "12px",
        padding: "24px",
        textAlign: "center",
        marginBottom: "24px",
      }}
    >
      <span
        style={{
          fontSize: "36px",
          fontWeight: 700,
          letterSpacing: "8px",
          color: "#0f172a",
          fontFamily: "monospace",
        }}
      >
        {code}
      </span>
    </div>
  );
}
