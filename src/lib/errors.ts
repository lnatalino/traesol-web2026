export function getErrorMessage(error: unknown, fallback = "Ocurrió un error inesperado."): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  if (typeof error === "string" && error.trim()) {
    return error.trim();
  }
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message;
    if (typeof message === "string" && message.trim()) {
      return message.trim();
    }
  }
  return fallback;
}
