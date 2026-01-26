import * as React from "react";
import { EmailFooter } from "./_components/EmailFooter";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://fundaciontraesol.cl").replace(/\/+$/, "");
const LOGO_URL =
  process.env.NEXT_PUBLIC_LOGO_URL ||
  "https://alohwvivujbhlpqunad.supabase.co/storage/v1/object/public/public/logo-traesol.png";

// Gradiente como el de Bienvenida Admin
const HEADER_GRADIENT = "linear-gradient(135deg, #1d4ed8 0%, #0ea5e9 100%)";

type TraesolEmailLayoutProps = {
  title: string;
  subtitle?: string;
  preheader?: string;
  footerNote?: string;
  children: React.ReactNode;
};

export function TraesolEmailLayout({ 
  title, 
  subtitle, 
  preheader,
  footerNote,
  children 
}: TraesolEmailLayoutProps) {
  const homeUrl = SITE_URL || "https://fundaciontraesol.cl";

  return (
    <>
      {/* Preheader oculto para clientes de email */}
      {preheader && (
        <div
          style={{
            display: "none",
            maxHeight: 0,
            overflow: "hidden",
            opacity: 0,
            color: "transparent",
          }}
        >
          {preheader}
          {/* Espaciadores invisibles para llenar el preheader */}
          &nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
        </div>
      )}
      
      <div
        style={{
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
          background: "#f8fafc",
          padding: "24px",
        }}
      >
        <table
          width="100%"
          cellPadding={0}
          cellSpacing={0}
          role="presentation"
          style={{
            maxWidth: "600px",
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          }}
        >
          <tbody>
            {/* Header con gradiente */}
            <tr>
              <td
                style={{
                  background: HEADER_GRADIENT,
                  padding: "32px 24px",
                  textAlign: "center",
                }}
              >
                <a
                  href={homeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none" }}
                >
                  <img
                    src={LOGO_URL}
                    alt="Traesol"
                    width={120}
                    height={40}
                    style={{
                      display: "inline-block",
                      maxHeight: "40px",
                      width: "auto",
                      border: 0,
                      marginBottom: "12px",
                    }}
                  />
                </a>
                <h1
                  style={{
                    color: "#ffffff",
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: 700,
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p
                    style={{
                      color: "rgba(255, 255, 255, 0.85)",
                      margin: "8px 0 0",
                      fontSize: "14px",
                    }}
                  >
                    {subtitle}
                  </p>
                )}
              </td>
            </tr>

            {/* Contenido principal */}
            <tr>
              <td
                style={{
                  padding: "32px 24px",
                  color: "#334155",
                  fontSize: "16px",
                  lineHeight: 1.6,
                }}
              >
                {children}
              </td>
            </tr>

            {/* Footer */}
            <EmailFooter note={footerNote} />
          </tbody>
        </table>
      </div>
    </>
  );
}
