import * as React from "react";
import { TraesolEmailLayout } from "./TraesolEmailLayout";
import { EmailButton, EmailInfoBox } from "./_components";

type PortalPacienteEmailProps = {
  nombre: string;
  portalUrl: string;
  expirationDate: string;
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 16px",
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.6",
};

const listStyle: React.CSSProperties = {
  paddingLeft: "20px",
  margin: "0 0 20px",
  color: "#374151",
  fontSize: "15px",
  lineHeight: "1.8",
};

export function PortalPacienteEmail({
  nombre,
  portalUrl,
  expirationDate,
}: PortalPacienteEmailProps) {
  return (
    <TraesolEmailLayout
      title="Acceso al Portal del Paciente"
      subtitle="Complete su información para el operativo quirúrgico"
      preheader="Tiene un enlace privado para completar su información médica"
      footerNote="Este es un enlace personal e intransferible. No lo comparta."
    >
      <p style={paragraphStyle}>Estimado/a {nombre},</p>

      <p style={paragraphStyle}>
        Ha sido registrado como paciente en un operativo quirúrgico de la
        Fundación Traesol. Para completar su información y subir los documentos
        necesarios, haga clic en el siguiente botón:
      </p>

      <div style={{ textAlign: "center", margin: "28px 0" }}>
        <EmailButton href={portalUrl}>Acceder al Portal</EmailButton>
      </div>

      <EmailInfoBox variant="default" title="¿Qué puede hacer en el portal?">
        <ul style={listStyle}>
          <li>Verificar y actualizar sus datos personales</li>
          <li>Agregar contactos de emergencia</li>
          <li>Subir exámenes y documentos médicos requeridos</li>
        </ul>
      </EmailInfoBox>

      <EmailInfoBox variant="warning" title="Importante">
        <ul style={{ ...listStyle, marginBottom: 0 }}>
          <li>
            <strong>Este enlace es personal e intransferible.</strong> No lo
            comparta con terceros.
          </li>
          <li>
            El enlace expira el <strong>{expirationDate}</strong>.
          </li>
          <li>
            Si el enlace expira, contacte al equipo de coordinación para
            solicitar uno nuevo.
          </li>
        </ul>
      </EmailInfoBox>

      <p style={paragraphStyle}>
        Si tiene problemas para acceder, copie y pegue este enlace en su
        navegador:
      </p>

      <p
        style={{
          background: "#f1f5f9",
          padding: "12px 16px",
          borderRadius: "8px",
          fontSize: "13px",
          wordBreak: "break-all",
          color: "#475569",
          margin: "0 0 20px",
        }}
      >
        {portalUrl}
      </p>

      <p style={paragraphStyle}>
        Atentamente,
        <br />
        <strong>Fundación Traesol</strong>
      </p>
    </TraesolEmailLayout>
  );
}

// Exportar función para generar texto plano (para copiar/pegar)
export function getPortalPacienteEmailText(
  nombre: string,
  portalUrl: string,
  expirationDate: string
): string {
  return `Estimado/a ${nombre},

Ha sido registrado como paciente en un operativo quirúrgico de la Fundación Traesol.

Para completar su información y subir los documentos necesarios, ingrese al siguiente enlace:

${portalUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
¿Qué puede hacer en el portal?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Verificar y actualizar sus datos personales
• Agregar contactos de emergencia
• Subir exámenes y documentos médicos requeridos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ IMPORTANTE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Este enlace es PERSONAL E INTRANSFERIBLE. No lo comparta con terceros.
• El enlace expira el ${expirationDate}.
• Si el enlace expira, contacte al equipo de coordinación para solicitar uno nuevo.

Atentamente,
Fundación Traesol
https://fundaciontraesol.cl`;
}
