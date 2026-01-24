// src/app/(dev)/email-preview/page.tsx
// Preview de templates de email - SOLO VISIBLE EN DESARROLLO

import { redirect } from "next/navigation";

// Bloquear en producción
export const dynamic = "force-dynamic";

export default function EmailPreviewPage() {
  // Bloquear acceso en producción
  if (process.env.NODE_ENV === "production") {
    redirect("/");
  }

  return (
    <div style={{ fontFamily: "system-ui, sans-serif", padding: "24px", background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <h1 style={{ fontSize: "24px", fontWeight: "700", color: "#0f172a", marginBottom: "8px" }}>
          📧 Preview de Emails - Traesol
        </h1>
        <p style={{ color: "#64748b", marginBottom: "32px" }}>
          Esta página solo está disponible en desarrollo (NODE_ENV !== production)
        </p>
        
        <div style={{ display: "grid", gap: "24px" }}>
          {/* Lista de previews disponibles */}
          <PreviewCard 
            title="Bienvenida Admin" 
            description="Email con credenciales de acceso para nuevo usuario admin"
            href="/email-preview/bienvenida-admin"
          />
          <PreviewCard 
            title="Código de Recuperación" 
            description="Email con código OTP para resetear contraseña"
            href="/email-preview/codigo-recuperacion"
          />
          <PreviewCard 
            title="Gracias Voluntario" 
            description="Email de agradecimiento por registro de voluntario"
            href="/email-preview/gracias-voluntario"
          />
          <PreviewCard 
            title="Postulación Operativo" 
            description="Email de confirmación de postulación a operativo"
            href="/email-preview/postulacion-operativo"
          />
          <PreviewCard 
            title="Invitación Operativo" 
            description="Email de invitación a un operativo con botones aceptar/rechazar"
            href="/email-preview/invitacion-operativo"
          />
          <PreviewCard 
            title="Inscripción Aceptada" 
            description="Email notificando que la postulación fue aprobada"
            href="/email-preview/inscripcion-aceptada"
          />
          <PreviewCard 
            title="Inscripción Rechazada" 
            description="Email notificando que la postulación no fue aceptada"
            href="/email-preview/inscripcion-rechazada"
          />
          <PreviewCard 
            title="Mensajería Masiva" 
            description="Template de mensajería masiva a voluntarios"
            href="/email-preview/mensajeria"
          />
          <PreviewCard 
            title="Contacto Empresas" 
            description="Email de confirmación de contacto de empresa"
            href="/email-preview/contacto-empresa"
          />
          <PreviewCard 
            title="Confirmación Quirúrgica" 
            description="Email de confirmación de cirugía para paciente"
            href="/email-preview/confirmacion-quirurgica"
          />
        </div>
      </div>
    </div>
  );
}

function PreviewCard({ title, description, href }: { title: string; description: string; href: string }) {
  return (
    <a 
      href={href}
      style={{ 
        display: "block",
        padding: "20px", 
        background: "white", 
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        textDecoration: "none",
        transition: "box-shadow 0.2s",
      }}
    >
      <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#0f172a", margin: "0 0 4px" }}>
        {title}
      </h3>
      <p style={{ fontSize: "14px", color: "#64748b", margin: 0 }}>
        {description}
      </p>
    </a>
  );
}
