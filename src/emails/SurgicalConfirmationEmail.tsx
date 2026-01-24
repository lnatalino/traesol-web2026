import * as React from "react";
import { TraesolEmailLayout } from "./TraesolEmailLayout";

type SurgicalConfirmationEmailProps = {
  nombre: string;
  diagnostico?: string | null;
  cirugia_planificada?: string | null;
  fecha_cirugia?: string | null;
  hora_cirugia?: string | null;
  ciudad_origen?: string | null;
  fecha_llegada_ciudad?: string | null;
  fecha_regreso_ciudad?: string | null;
  requiere_vuelo?: boolean | null;
  requiere_hospedaje?: boolean | null;
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
  alta_hospitalaria_estimada?: string | null;
  visita_enfermera_fecha?: string | null;
  primera_kine_fecha?: string | null;
  segunda_kine_fecha?: string | null;
  curacion_fecha?: string | null;
  dias_estimados_santiago?: number | null;
};

const listStyle: React.CSSProperties = {
  paddingLeft: "18px",
  margin: "0 0 16px",
  color: "#1f2937",
};

const paragraphStyle: React.CSSProperties = {
  margin: "0 0 12px",
};

const sectionTitleStyle: React.CSSProperties = {
  margin: "8px 0 6px",
  fontWeight: 600,
  color: "#111827",
};

export function SurgicalConfirmationEmail(props: SurgicalConfirmationEmailProps) {
  const {
    nombre,
    diagnostico,
    cirugia_planificada,
    fecha_cirugia,
    hora_cirugia,
    ciudad_origen,
    fecha_llegada_ciudad,
    fecha_regreso_ciudad,
    requiere_vuelo,
    requiere_hospedaje,
    vuelo_ida_fecha,
    vuelo_ida_numero,
    vuelo_ida_hora_salida,
    vuelo_ida_hora_llegada,
    vuelo_regreso_fecha,
    vuelo_regreso_hora_salida,
    vuelo_regreso_hora_llegada,
    hotel_nombre,
    hotel_direccion,
    hotel_checkin_inicial,
    hotel_checkout_inicial,
    hotel_checkin_post_cirugia,
    hotel_checkout_final,
    alta_hospitalaria_estimada,
    visita_enfermera_fecha,
    primera_kine_fecha,
    segunda_kine_fecha,
    curacion_fecha,
    dias_estimados_santiago,
  } = props;

  const formatValue = (value?: string | null, fallback = "Por confirmar") =>
    value && value.trim().length ? value : fallback;

  const formatDateValue = (value?: string | null) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatTimeValue = (value?: string | null) => {
    if (!value) return undefined;
    return value.slice(0, 5);
  };

  const formatNumberValue = (value?: number | null) =>
    typeof value === "number" ? String(value) : undefined;

  const renderListItem = (label: string, value?: string | null) => (
    <li style={{ marginBottom: "6px" }}>
      <strong>{label}: </strong>
      {formatValue(value)}
    </li>
  );

  const renderFormattedItem = (
    label: string,
    value?: string | null,
    formatter?: (value?: string | null) => string | undefined,
    options?: { alwaysShow?: boolean },
  ) => {
    const formatted = formatter ? formatter(value) : undefined;
    if (!options?.alwaysShow && !value && !formatted) {
      return null;
    }
    return (
      <li style={{ marginBottom: "6px" }}>
        <strong>{label}: </strong>
        {formatted ?? formatValue(value)}
      </li>
    );
  };

  const renderNumberItem = (label: string, value?: number | null) => {
    const formatted = formatNumberValue(value);
    if (!formatted) return null;
    return (
      <li style={{ marginBottom: "6px" }}>
        <strong>{label}: </strong>
        {formatted}
      </li>
    );
  };

  const buildFlightSummary = (
    title: string,
    dateValue?: string | null,
    numberValue?: string | null,
    departureTime?: string | null,
    arrivalTime?: string | null,
  ) => {
    const parts = [
      formatDateValue(dateValue) && `Fecha ${formatDateValue(dateValue)}`,
      numberValue && `Nº ${numberValue}`,
      formatTimeValue(departureTime) && `Sale ${formatTimeValue(departureTime)} hrs`,
      formatTimeValue(arrivalTime) && `Llega ${formatTimeValue(arrivalTime)} hrs`,
    ].filter(Boolean) as string[];

    if (!parts.length) return null;

    return (
      <li style={{ marginBottom: "6px" }}>
        <strong>{title}: </strong>
        {parts.join(" • ")}
      </li>
    );
  };

  const hasFlightInfo = Boolean(
    requiere_vuelo ||
      ciudad_origen ||
      fecha_llegada_ciudad ||
      fecha_regreso_ciudad ||
      vuelo_ida_fecha ||
      vuelo_ida_numero ||
      vuelo_ida_hora_salida ||
      vuelo_ida_hora_llegada ||
      vuelo_regreso_fecha ||
      vuelo_regreso_hora_salida ||
      vuelo_regreso_hora_llegada,
  );

  const hasHotelInfo = Boolean(
    requiere_hospedaje ||
      hotel_nombre ||
      hotel_direccion ||
      hotel_checkin_inicial ||
      hotel_checkout_inicial ||
      hotel_checkin_post_cirugia ||
      hotel_checkout_final,
  );

  const hasRecoveryInfo = Boolean(
    alta_hospitalaria_estimada ||
      visita_enfermera_fecha ||
      primera_kine_fecha ||
      segunda_kine_fecha ||
      curacion_fecha ||
      typeof dias_estimados_santiago === "number",
  );

  const travelItems = [
    ciudad_origen ? (
      <li key="ciudad" style={{ marginBottom: "6px" }}>
        <strong>Ciudad de origen: </strong>
        {ciudad_origen}
      </li>
    ) : null,
    fecha_llegada_ciudad ? (
      <li key="llegada" style={{ marginBottom: "6px" }}>
        <strong>Fecha de llegada: </strong>
        {fecha_llegada_ciudad}
      </li>
    ) : null,
    fecha_regreso_ciudad ? (
      <li key="regreso" style={{ marginBottom: "6px" }}>
        <strong>Fecha de regreso: </strong>
        {fecha_regreso_ciudad}
      </li>
    ) : null,
  ].filter(Boolean);

  return (
    <TraesolEmailLayout
      title="Confirmación de operativo médico-quirúrgico"
      subtitle="Detalles de tu cirugía y coordinación logística"
      footerNote="Si no solicitaste esta información, ignora este mensaje o contáctanos."
    >
      <p style={paragraphStyle}>
        Estimado/a <strong>{nombre || "paciente"}</strong>,
      </p>
      <p style={paragraphStyle}>
        Te confirmamos que formas parte del operativo médico-quirúrgico organizado por Fundación Traesol.
        A continuación, te compartimos la información más relevante para esta etapa:
      </p>

      <p style={sectionTitleStyle}>Datos de tu cirugía</p>
      <ul style={listStyle}>
        {renderListItem("Diagnóstico", diagnostico)}
        {renderListItem("Cirugía planificada", cirugia_planificada)}
        {renderFormattedItem("Fecha de cirugía", fecha_cirugia, formatDateValue, { alwaysShow: true })}
        {renderFormattedItem("Hora de cirugía", hora_cirugia, formatTimeValue, { alwaysShow: true })}
      </ul>

      {hasFlightInfo ? (
        <>
          <p style={sectionTitleStyle}>Información de vuelos</p>
          <ul style={listStyle}>
            {typeof requiere_vuelo === "boolean" ? (
              <li style={{ marginBottom: "6px" }}>
                {requiere_vuelo
                  ? "Coordinaremos tus vuelos y te enviaremos los comprobantes en cuanto estén listos."
                  : "No es necesario coordinar vuelos adicionales para este operativo."}
              </li>
            ) : null}
            {renderFormattedItem("Ciudad de origen", ciudad_origen)}
            {renderFormattedItem("Fecha de llegada a Santiago", fecha_llegada_ciudad, formatDateValue)}
            {renderFormattedItem("Fecha de regreso", fecha_regreso_ciudad, formatDateValue)}
            {buildFlightSummary(
              "Vuelo de ida",
              vuelo_ida_fecha,
              vuelo_ida_numero,
              vuelo_ida_hora_salida,
              vuelo_ida_hora_llegada,
            )}
            {buildFlightSummary(
              "Vuelo de regreso",
              vuelo_regreso_fecha,
              undefined,
              vuelo_regreso_hora_salida,
              vuelo_regreso_hora_llegada,
            )}
          </ul>
        </>
      ) : null}

      {hasHotelInfo ? (
        <>
          <p style={sectionTitleStyle}>Información del hotel</p>
          <ul style={listStyle}>
            {typeof requiere_hospedaje === "boolean" ? (
              <li style={{ marginBottom: "6px" }}>
                {requiere_hospedaje
                  ? "Traesol gestionará tu hospedaje y te compartirá los comprobantes apenas estén confirmados."
                  : "No se requiere hospedaje adicional para este operativo."}
              </li>
            ) : null}
            {renderFormattedItem("Hotel", hotel_nombre)}
            {renderFormattedItem("Dirección", hotel_direccion)}
            {renderFormattedItem("Check-in inicial", hotel_checkin_inicial, formatDateValue)}
            {renderFormattedItem("Check-out inicial", hotel_checkout_inicial, formatDateValue)}
            {renderFormattedItem("Check-in post cirugía", hotel_checkin_post_cirugia, formatDateValue)}
            {renderFormattedItem("Check-out final", hotel_checkout_final, formatDateValue)}
          </ul>
        </>
      ) : null}

      {hasRecoveryInfo ? (
        <>
          <p style={sectionTitleStyle}>Plan de recuperación</p>
          <ul style={listStyle}>
            {renderFormattedItem(
              "Alta hospitalaria estimada",
              alta_hospitalaria_estimada,
              formatDateValue,
            )}
            {renderFormattedItem("Visita de enfermera", visita_enfermera_fecha, formatDateValue)}
            {renderFormattedItem("1ª sesión con kinesióloga", primera_kine_fecha, formatDateValue)}
            {renderFormattedItem("2ª sesión con kinesióloga", segunda_kine_fecha, formatDateValue)}
            {renderFormattedItem("Curación", curacion_fecha, formatDateValue)}
            {renderNumberItem("Días estimados en Santiago", dias_estimados_santiago)}
          </ul>
        </>
      ) : null}

      {!hasFlightInfo && !hasHotelInfo ? (
        <>
          <p style={sectionTitleStyle}>Traslado y logística</p>
          <ul style={listStyle}>{travelItems}</ul>
        </>
      ) : null}

      <p style={paragraphStyle}>
        Nuestro equipo se comunicará contigo si surge alguna actualización. Si tienes dudas o necesitas modificar
        algún dato, responde este correo o escríbenos a
        {" "}
        <a href="mailto:quirurgicos@fundaciontraesol.cl" style={{ color: "#0b4dbf", textDecoration: "none" }}>
          quirurgicos@fundaciontraesol.cl
        </a>
        .
      </p>
      <p style={{ margin: "0 0 12px" }}>Un abrazo,<br />Equipo Traesol</p>
    </TraesolEmailLayout>
  );
}
