// src/emails/_components/EmailButton.tsx
// Botón CTA reutilizable para emails

import * as React from "react";

const BRAND_COLOR = "#0b4dbf";

interface EmailButtonProps {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  fullWidth?: boolean;
}

const VARIANT_STYLES = {
  primary: {
    background: BRAND_COLOR,
    color: "#ffffff",
    border: "none",
  },
  secondary: {
    background: "#f1f5f9",
    color: "#1e293b",
    border: "1px solid #e2e8f0",
  },
  danger: {
    background: "#e11d48",
    color: "#ffffff",
    border: "none",
  },
};

export function EmailButton({ 
  href, 
  children, 
  variant = "primary",
  fullWidth = false,
}: EmailButtonProps) {
  const styles = VARIANT_STYLES[variant];
  
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block",
        padding: "14px 28px",
        borderRadius: "12px",
        fontWeight: 600,
        fontSize: "15px",
        textDecoration: "none",
        textAlign: "center",
        width: fullWidth ? "100%" : "auto",
        boxSizing: "border-box",
        ...styles,
      }}
    >
      {children}
    </a>
  );
}
