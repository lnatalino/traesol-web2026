/**
 * Helpers para manejo robusto de respuestas fetch
 * Previene crashes por respuestas vacías o no-JSON
 */

type ApiResponse<T = any> = {
  ok: boolean;
  data?: T;
  error?: string;
};

/**
 * Parse JSON de forma segura, manejando respuestas vacías o texto
 */
export async function safeJsonParse<T = any>(response: Response): Promise<ApiResponse<T>> {
  try {
    // Leer como texto primero
    const text = await response.text();
    
    // Si está vacío, retornar error
    if (!text || text.trim() === "") {
      return {
        ok: false,
        error: "El servidor respondió sin contenido",
      };
    }
    
    // Intentar parsear JSON
    try {
      const json = JSON.parse(text);
      return {
        ok: response.ok,
        ...json,
      };
    } catch (parseError) {
      // Si no es JSON válido, retornar el texto como error
      return {
        ok: false,
        error: text.substring(0, 200), // Limitar longitud
      };
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error desconocido al leer respuesta",
    };
  }
}

/**
 * Wrapper de fetch que garantiza respuesta JSON
 * Uso: const result = await safeFetch('/api/endpoint', { method: 'POST', body: ... })
 */
export async function safeFetch<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(url, options);
    return await safeJsonParse<T>(response);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error de red",
    };
  }
}
