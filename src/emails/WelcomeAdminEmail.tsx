// src/emails/WelcomeAdminEmail.tsx
// Email de bienvenida para nuevos administradores con código para establecer contraseña

import * as React from "react";
import { TraesolEmailLayout } from "./TraesolEmailLayout";

type WelcomeAdminEmailProps = {
  firstName: string;
  code: string;
  resetUrl: string;
  expiryMinutes?: number;
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

const buttonStyle: React.CSSProperties = {
  display: "inline-block",
  backgroundColor: "#0ea5e9",
  color: "#ffffff",
  padding: "14px 32px",
  borderRadius: "12px",
  textDecoration: "none",
  fontWeight: 600,
  fontSize: "16px",
  marginTop: "16px",
};

const dividerStyle: React.CSSProperties = {
  borderTop: "1px solid #e5e7eb",
  margin: "24px 0",
};

export function WelcomeAdminEmail({
  firstName,
  code,
  resetUrl,
  expiryMinutes = 15,
}: WelcomeAdminEmailProps) {
  return (
    <TraesolEmailLayout
      title="¡Bienvenido al equipo!"
      subtitle="Acceso al Panel de Administración"
      preheader={`Hola ${firstName}, se te ha dado acceso al panel admin de Traesol`}
    >
      <p style={paragraphStyle}>
        <strong>Hola {firstName},</strong>
      </p>
      
      <p style={paragraphStyle}>
        Se te ha otorgado acceso al <strong>Panel de Administración</strong> de Fundación Traesol. 
        Para comenzar, necesitas establecer tu contraseña usando el código de verificación:
      </p>

      <div style={codeBoxStyle}>
        <p style={codeStyle}>{code}</p>
      </div>

      <div style={warningStyle}>
        <strong>⏰ Importante:</strong> Este código es válido por {expiryMinutes} minutos y solo puede usarse una vez.
      </div>

      <p style={paragraphStyle}>
        Haz clic en el siguiente botón para establecer tu contraseña:
      </p>

      <div style={{ textAlign: "center" as const }}>
        <a href={resetUrl} style={buttonStyle}>
          Establecer mi contraseña
        </a>
      </div>

      <div style={dividerStyle} />

      <p style={{ ...paragraphStyle, fontSize: "14px", color: "#6b7280" }}>
        <strong>¿Qué sigue?</strong>
      </p>
      <ul style={{ ...paragraphStyle, fontSize: "14px", color: "#6b7280", paddingLeft: "20px" }}>
        <li>Ingresa el código de 6 dígitos</li>
        <li>Crea una contraseña segura (mínimo 8 caracteres)</li>
        <li>Inicia sesión y accede al panel de administración</li>
      </ul>

      <p style={{ ...paragraphStyle, marginTop: "24px", fontSize: "14px", color: "#6b7280" }}>
        Si no esperabas este email o tienes preguntas, contacta a{" "}
        <a href="mailto:contacto@fundaciontraesol.cl" style={{ color: "#0369a1" }}>
          contacto@fundaciontraesol.cl
        </a>
      </p>
    </TraesolEmailLayout>
  );
}

export default WelcomeAdminEmail;
