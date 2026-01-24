// Generated from Supabase GraphQL `__type(name: "inscripcion_estado")` on 2024-07-15.
// Keep this file in sync with Supabase or regenerate via `supabase gen types typescript --local`.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json }
  | Json[];

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
          resumen_corto: string | null;
          descripcion_larga: string | null;
          detalles_json: Record<string, any>;
          orden: number | null;
          activo: boolean;
          imagen_principal_url: string | null;
          portada_url: string | null;
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
          resumen_corto?: string | null;
          descripcion_larga?: string | null;
          detalles_json?: Record<string, any>;
          orden?: number | null;
          activo?: boolean;
          imagen_principal_url?: string | null;
          portada_url?: string | null;
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
          resumen_corto?: string | null;
          descripcion_larga?: string | null;
          detalles_json?: Record<string, any>;
          orden?: number | null;
          activo?: boolean;
          imagen_principal_url?: string | null;
          portada_url?: string | null;
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
          cantidad: number;
        };
        Update: {
          id?: string;
          pack_id?: string;
          producto_id?: string;
          cantidad?: number;
        };
      };
      empresa_metrics: {
        Row: {
          id: string;
          operativos_con_empresas: number;
          colaboradores_movilizados: number;
          regiones_impactadas: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          operativos_con_empresas: number;
          colaboradores_movilizados: number;
          regiones_impactadas: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          operativos_con_empresas?: number;
          colaboradores_movilizados?: number;
          regiones_impactadas?: number;
          updated_at?: string;
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
          config: Json | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          solicitud_id: string;
          producto_id: string;
          cantidad?: number;
          nota?: string | null;
          config?: Json | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          solicitud_id?: string;
          producto_id?: string;
          cantidad?: number;
          nota?: string | null;
          config?: Json | null;
        };
      };
      inventario_categorias: {
        Row: {
          id: string;
          nombre: string;
          slug: string;
          descripcion: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          slug: string;
          descripcion?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nombre?: string;
          slug?: string;
          descripcion?: string | null;
          created_at?: string | null;
        };
      };
      inventario_items: {
        Row: {
          id: string;
          categoria_id: string | null;
          nombre: string;
          slug: string;
          descripcion: string | null;
          foto_url: string | null;
          cantidad_actual: number;
          unidad: string | null;
          valor_unitario: number | null;
          uso: string | null;
          tipo_regla: string | null;
          activo: boolean;
          created_at: string | null;
          lanyard_type_id: string | null;
          variante: string | null;
          stock_reservado: number;
          umbral_reorden: number | null;
        };
        Insert: {
          id?: string;
          categoria_id?: string | null;
          nombre: string;
          slug: string;
          descripcion?: string | null;
          foto_url?: string | null;
          cantidad_actual?: number;
          unidad?: string | null;
          valor_unitario?: number | null;
          uso?: string | null;
          tipo_regla?: string | null;
          activo?: boolean;
          created_at?: string | null;
          lanyard_type_id?: string | null;
          variante?: string | null;
          stock_reservado?: number;
          umbral_reorden?: number | null;
        };
        Update: {
          id?: string;
          categoria_id?: string | null;
          nombre?: string;
          slug?: string;
          descripcion?: string | null;
          foto_url?: string | null;
          cantidad_actual?: number;
          unidad?: string | null;
          valor_unitario?: number | null;
          uso?: string | null;
          tipo_regla?: string | null;
          activo?: boolean;
          created_at?: string | null;
          lanyard_type_id?: string | null;
          variante?: string | null;
          stock_reservado?: number;
          umbral_reorden?: number | null;
        };
      };
      lanyard_types: {
        Row: {
          id: string;
          name: string;
          slug: string;
          ribbon_color_name: string;
          ribbon_hex: string | null;
          description: string | null;
          is_active: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          ribbon_color_name: string;
          ribbon_hex?: string | null;
          description?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          ribbon_color_name?: string;
          ribbon_hex?: string | null;
          description?: string | null;
          is_active?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      volunteer_gear_status: {
        Row: {
          volunteer_id: string;
          has_lanyard: boolean;
          has_id_card: boolean;
          lanyard_type_id: string | null;
          uniform_cycles_since_issue: number;
          uniform_last_issued_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          volunteer_id: string;
          has_lanyard?: boolean;
          has_id_card?: boolean;
          lanyard_type_id?: string | null;
          uniform_cycles_since_issue?: number;
          uniform_last_issued_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          volunteer_id?: string;
          has_lanyard?: boolean;
          has_id_card?: boolean;
          lanyard_type_id?: string | null;
          uniform_cycles_since_issue?: number;
          uniform_last_issued_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      inventory_deliveries: {
        Row: {
          id: string;
          volunteer_id: string;
          operativo_id: string | null;
          item_id: string;
          quantity: number;
          notes: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          volunteer_id: string;
          operativo_id?: string | null;
          item_id: string;
          quantity?: number;
          notes?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          volunteer_id?: string;
          operativo_id?: string | null;
          item_id?: string;
          quantity?: number;
          notes?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
      };
      operativos_quirurgicos: {
        Row: {
          id: string;
          slug: string;
          titulo: string;
          descripcion: string | null;
          fecha_inicio: string | null;
          fecha_fin: string | null;
          ciudad: string | null;
          lugar: string | null;
          estado: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          titulo: string;
          descripcion?: string | null;
          fecha_inicio?: string | null;
          fecha_fin?: string | null;
          ciudad?: string | null;
          lugar?: string | null;
          estado?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          titulo?: string;
          descripcion?: string | null;
          fecha_inicio?: string | null;
          fecha_fin?: string | null;
          ciudad?: string | null;
          lugar?: string | null;
          estado?: string;
          created_at?: string;
        };
      };
      quirurgico_pacientes: {
        Row: {
          id: string;
          operativo_quirurgico_id: string | null;
          nombre_completo: string;
          rut: string | null;
          email: string | null;
          telefono: string | null;
          telefono_emergencia: string | null;
          nombre_contacto_emergencia: string | null;
          ciudad_origen: string | null;
          requiere_vuelo: boolean;
          requiere_hospedaje: boolean;
          diagnostico: string | null;
          cirugia_planificada: string | null;
          fecha_cirugia: string | null;
          hora_cirugia: string | null;
          fecha_llegada_ciudad: string | null;
          fecha_regreso_ciudad: string | null;
          alta_hospitalaria_estimada: string | null;
          vuelo_ida_fecha: string | null;
          vuelo_ida_numero: string | null;
          vuelo_ida_hora_salida: string | null;
          vuelo_ida_hora_llegada: string | null;
          vuelo_regreso_fecha: string | null;
          vuelo_regreso_hora_salida: string | null;
          vuelo_regreso_hora_llegada: string | null;
          hotel_nombre: string | null;
          hotel_direccion: string | null;
          hotel_checkin_inicial: string | null;
          hotel_checkout_inicial: string | null;
          hotel_checkin_post_cirugia: string | null;
          hotel_checkout_final: string | null;
          visita_enfermera_fecha: string | null;
          primera_kine_fecha: string | null;
          segunda_kine_fecha: string | null;
          curacion_fecha: string | null;
          dias_estimados_santiago: number | null;
          portal_token: string | null;
          rut_ultimos4: string | null;
          portal_last_access_at: string | null;
          portal_is_active: boolean;
          comentarios_paciente: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          operativo_quirurgico_id?: string | null;
          nombre_completo: string;
          rut?: string | null;
          email?: string | null;
          telefono?: string | null;
          telefono_emergencia?: string | null;
          nombre_contacto_emergencia?: string | null;
          ciudad_origen?: string | null;
          requiere_vuelo?: boolean;
          requiere_hospedaje?: boolean;
          diagnostico?: string | null;
          cirugia_planificada?: string | null;
          fecha_cirugia?: string | null;
          hora_cirugia?: string | null;
          fecha_llegada_ciudad?: string | null;
          fecha_regreso_ciudad?: string | null;
          alta_hospitalaria_estimada?: string | null;
          vuelo_ida_fecha?: string | null;
          vuelo_ida_numero?: string | null;
          vuelo_ida_hora_salida?: string | null;
          vuelo_ida_hora_llegada?: string | null;
          vuelo_regreso_fecha?: string | null;
          vuelo_regreso_hora_salida?: string | null;
          vuelo_regreso_hora_llegada?: string | null;
          hotel_nombre?: string | null;
          hotel_direccion?: string | null;
          hotel_checkin_inicial?: string | null;
          hotel_checkout_inicial?: string | null;
          hotel_checkin_post_cirugia?: string | null;
          hotel_checkout_final?: string | null;
          visita_enfermera_fecha?: string | null;
          primera_kine_fecha?: string | null;
          segunda_kine_fecha?: string | null;
          curacion_fecha?: string | null;
          dias_estimados_santiago?: number | null;
          portal_token?: string | null;
          rut_ultimos4?: string | null;
          portal_last_access_at?: string | null;
          portal_is_active?: boolean;
          comentarios_paciente?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          operativo_quirurgico_id?: string | null;
          nombre_completo?: string;
          rut?: string | null;
          email?: string | null;
          telefono?: string | null;
          telefono_emergencia?: string | null;
          nombre_contacto_emergencia?: string | null;
          ciudad_origen?: string | null;
          requiere_vuelo?: boolean;
          requiere_hospedaje?: boolean;
          diagnostico?: string | null;
          cirugia_planificada?: string | null;
          fecha_cirugia?: string | null;
          hora_cirugia?: string | null;
          fecha_llegada_ciudad?: string | null;
          fecha_regreso_ciudad?: string | null;
          alta_hospitalaria_estimada?: string | null;
          vuelo_ida_fecha?: string | null;
          vuelo_ida_numero?: string | null;
          vuelo_ida_hora_salida?: string | null;
          vuelo_ida_hora_llegada?: string | null;
          vuelo_regreso_fecha?: string | null;
          vuelo_regreso_hora_salida?: string | null;
          vuelo_regreso_hora_llegada?: string | null;
          hotel_nombre?: string | null;
          hotel_direccion?: string | null;
          hotel_checkin_inicial?: string | null;
          hotel_checkout_inicial?: string | null;
          hotel_checkin_post_cirugia?: string | null;
          hotel_checkout_final?: string | null;
          visita_enfermera_fecha?: string | null;
          primera_kine_fecha?: string | null;
          segunda_kine_fecha?: string | null;
          curacion_fecha?: string | null;
          dias_estimados_santiago?: number | null;
          portal_token?: string | null;
          rut_ultimos4?: string | null;
          portal_last_access_at?: string | null;
          portal_is_active?: boolean;
          comentarios_paciente?: string | null;
          created_at?: string;
        };
      };
      quirurgico_comunicaciones: {
        Row: {
          id: string;
          paciente_id: string;
          tipo: string;
          to_email: string;
          subject: string;
          body_preview: string | null;
          enviado_at: string;
          metadata: Json | null;
        };
        Insert: {
          id?: string;
          paciente_id: string;
          tipo: string;
          to_email: string;
          subject: string;
          body_preview?: string | null;
          enviado_at?: string;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          paciente_id?: string;
          tipo?: string;
          to_email?: string;
          subject?: string;
          body_preview?: string | null;
          enviado_at?: string;
          metadata?: Json | null;
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
