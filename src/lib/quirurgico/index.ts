// src/lib/quirurgico/index.ts
// Barrel export para el módulo quirúrgico

// Types
export * from "./types";

// Services
export {
  listPacientes,
  getPaciente,
  getPacienteDetail,
  createPaciente,
  updatePaciente,
  deletePaciente,
  listContactos,
  createContacto,
  updateContacto,
  deleteContacto,
  listRequerimientos,
  createRequerimiento,
  updateRequerimiento,
  deleteRequerimiento,
  listArchivos,
  createArchivoRecord,
  deleteArchivo,
} from "./pacientesService";

export {
  listOperativosQuirurgicos,
  listOperativosQuirurgicosPublic,
  getOperativoQuirurgico,
  getOperativoQuirurgicoBySlug,
  getOperativoQuirurgicoPublicBySlug,
  createOperativoQuirurgico,
  updateOperativoQuirurgico,
  deleteOperativoQuirurgico,
  listPostulacionesEquipo,
  getPostulacionEquipo,
  createPostulacionEquipo,
  updatePostulacionEquipoEstado,
  getOperativoStats,
} from "./operativosQuirurgicosService";

// Portal tokens
export {
  generateSecureToken,
  hashToken,
  verifyTokenHash,
  createPortalToken,
  verifyPortalToken,
  recordTokenUsage,
  revokePortalToken,
  getPortalTokenInfo,
} from "./portalTokens";

// NOTA: Portal session exports están comentados porque usan next/headers (server-only).
// Importar directamente: import { createPortalSession } from "@/lib/quirurgico/portalSession"
// export {
//   createPortalSession,
//   verifyPortalSession,
//   getPortalSessionData,
//   destroyPortalSession,
//   refreshPortalSessionIfNeeded,
// } from "./portalSession";

// NOTA: Los legacy types (QuirurgicoPaciente, normalizeRut, etc.) 
// están en ../quirurgico.ts y se acceden desde ahí directamente.
// No re-exportamos aquí para evitar dependencia circular.
