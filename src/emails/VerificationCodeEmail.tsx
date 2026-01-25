// src/emails/VerificationCodeEmail.tsx
// Email con código OTP de 6 dígitos para verificación

import * as React from "react";
import { TraesolEmailLayout } from "./TraesolEmailLayout";

type VerificationCodeEmailProps = {
  code: string;
  expiryMinutes?: number;
  purpose?: "verify_email" | "reset_password";
};

const codeBoxStyle: React.CSSProperties = {
  backgroundColor: "#f0f9ff",
  border: "2px dashed #0ea5e9",
  borderRadius: "12px",
  padding: "24px 32px",
  textAlign: "center" as const,
  margin: "24px 0",
};

const codeStyle: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: 700,
  letterSpacing: "8px",
  color: "#0369a1",
  fontFamily: "monospace",
  margin: 0,
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 12px",
  color: "#374151",
  lineHeight: "1.6",
};

const warningStyle: React.CSSProperties = {
  backgroundColor: "#fef3c7",
  border: "1px solid #f59e0b",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "16px 0",
  fontSize: "14px",
  color: "#92400e",
};

export function VerificationCodeEmail({
  code,
  expiryMinutes = 15,
  purpose = "verify_email",
}: VerificationCodeEmailProps) {
  const title = purpose === "verify_email" 
    ? "Verifica tu correo electrónico" 
    : "Código de recuperación";
  
  const subtitle = purpose === "verify_email"
    ? "Completa tu registro en Fundación Traesol"
    : "Restablece tu contraseña";

  const preheader = purpose === "verify_email"
    ? `Tu código de verificación es: ${code}`
    : `Tu código de recuperación es: ${code}`;

  return (
    <TraesolEmailLayout
      title={title}
      subtitle={subtitle}
      preheader={preheader}
    >
      <p style={paragraphStyle}>
        {purpose === "verify_email" 
          ? "¡Gracias por registrarte en Fundación Traesol! Para completar tu registro, ingresa el siguiente código:"
          : "Has solicitado restablecer tu contraseña. Ingresa el siguiente código:"
        }
      </p>

      <div style={codeBoxStyle}>
        <p style={codeStyle}>{code}</p>
      </div>

      <div style={warningStyle}>
        <strong>⏰ Importante:</strong> Este código es válido por {expiryMinutes} minutos y solo puede usarse una vez.
      </div>

      <p style={paragraphStyle}>
        Si no solicitaste este código, puedes ignorar este mensaje de forma segura.
      </p>

      <p style={{ ...paragraphStyle, marginTop: "24px", fontSize: "14px", color: "#6b7280" }}>
        Si tienes problemas, escríbenos a{" "}
        <a href="mailto:contacto@fundaciontraesol.cl" style={{ color: "#0369a1" }}>
          contacto@fundaciontraesol.cl
        </a>
      </p>
    </TraesolEmailLayout>
  );
}

export default VerificationCodeEmail;
