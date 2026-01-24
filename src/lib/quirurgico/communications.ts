type PreviewSource = {
  html?: string | null;
  plainText?: string | null;
  limit?: number;
};

function stripHtml(input: string): string {
  return input
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|div)>/gi, "\n\n")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

export function buildEmailBodyPreview({ html, plainText, limit = 200 }: PreviewSource): string {
  const base = plainText && plainText.trim().length ? plainText : html ? stripHtml(html) : "";
  if (!base) {
    return "";
  }
  return base.replace(/\s+/g, " ").trim().slice(0, limit);
}
