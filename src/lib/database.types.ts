// Generated from Supabase GraphQL `__type(name: "inscripcion_estado")` on 2024-07-15.
// Keep this file in sync with Supabase or regenerate via `supabase gen types typescript --local`.
export type Database = {
  public: {
    Tables: {
      inscripciones: {
        Row: {
          id: string;
          created_at: string | null;
          voluntario_id: string;
          operativo_id: string;
          estado: Database["public"]["Enums"]["inscripcion_estado"] | null;
          tipo: "general" | "especifica" | null;
          origen: "postulacion" | "invitacion" | null;
          token_respuesta: string | null;
          respondido_en: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          voluntario_id: string;
          operativo_id?: string | null;
          estado?: Database["public"]["Enums"]["inscripcion_estado"] | null;
          tipo?: "general" | "especifica" | null;
          origen?: "postulacion" | "invitacion" | null;
          token_respuesta?: string | null;
          respondido_en?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string | null;
          voluntario_id?: string;
          operativo_id?: string | null;
          estado?: Database["public"]["Enums"]["inscripcion_estado"] | null;
          tipo?: "general" | "especifica" | null;
          origen?: "postulacion" | "invitacion" | null;
          token_respuesta?: string | null;
          respondido_en?: string | null;
        };
      };
      empresa_productos: {
        Row: {
          id: string;
          slug: string;
          nombre: string;
          categoria: Database["public"]["Enums"]["empresa_producto_categoria"];
          descripcion_corta: string | null;
          descripcion_larga: string | null;
          detalles_json: unknown;
          orden: number | null;
          activo: boolean;
          imagen_principal_url: string | null;
          video_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          nombre: string;
          categoria: Database["public"]["Enums"]["empresa_producto_categoria"];
          descripcion_corta?: string | null;
          descripcion_larga?: string | null;
          detalles_json?: unknown;
          orden?: number | null;
          activo?: boolean;
          imagen_principal_url?: string | null;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          nombre?: string;
          categoria?: Database["public"]["Enums"]["empresa_producto_categoria"];
          descripcion_corta?: string | null;
          descripcion_larga?: string | null;
          detalles_json?: unknown;
          orden?: number | null;
          activo?: boolean;
          imagen_principal_url?: string | null;
          video_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      empresa_pack_items: {
        Row: {
          id: string;
          pack_id: string;
          producto_id: string;
          cantidad: number;
        };
        Insert: {
          id?: string;
          pack_id: string;
          producto_id: string;
          cantidad?: number;
        };
        Update: {
          id?: string;
          pack_id?: string;
          producto_id?: string;
          cantidad?: number;
        };
      };
      empresa_solicitudes: {
        Row: {
          id: string;
          created_at: string;
          empresa_nombre: string;
          contacto_nombre: string;
          contacto_email: string;
          contacto_telefono: string | null;
          contacto_cargo: string | null;
          ciudad: string | null;
          comentario: string | null;
          desea_reunion: string | null;
          estado: Database["public"]["Enums"]["empresa_solicitud_estado"];
          origen: string | null;
          carrito_resumen: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          empresa_nombre: string;
          contacto_nombre: string;
          contacto_email: string;
          contacto_telefono?: string | null;
          contacto_cargo?: string | null;
          ciudad?: string | null;
          comentario?: string | null;
          desea_reunion?: string | null;
          estado?: Database["public"]["Enums"]["empresa_solicitud_estado"];
          origen?: string | null;
          carrito_resumen?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          empresa_nombre?: string;
          contacto_nombre?: string;
          contacto_email?: string;
          contacto_telefono?: string | null;
          contacto_cargo?: string | null;
          ciudad?: string | null;
          comentario?: string | null;
          desea_reunion?: string | null;
          estado?: Database["public"]["Enums"]["empresa_solicitud_estado"];
          origen?: string | null;
          carrito_resumen?: string | null;
        };
      };
      empresa_solicitud_items: {
        Row: {
          id: string;
          created_at: string;
          solicitud_id: string;
          producto_id: string;
          cantidad: number;
          nota: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          solicitud_id: string;
          producto_id: string;
          cantidad?: number;
          nota?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          solicitud_id?: string;
          producto_id?: string;
          cantidad?: number;
          nota?: string | null;
        };
      };
    };
    Enums: {
      inscripcion_estado:
        | "postulado"
        | "aprobado"
        | "rechazado"
        | "confirmado"
        | "asistio"
        | "no_asistio"
        | "pendiente";
      inscripcion_tipo: "general" | "especifica";
      empresa_producto_categoria:
        | "tunnel_educativo"
        | "operativo_especialidades"
        | "operativo_quirurgico"
        | "jornada_actualizacion"
        | "pack";
      empresa_solicitud_estado: "nueva" | "contactada" | "en_proceso" | "cerrada" | "descartada";
    };
  };
};
