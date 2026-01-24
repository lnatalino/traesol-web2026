import { redirect } from "next/navigation";
import { AdminPageHeader, StatTile, StatTileGrid } from "@/components/admin/ui";
import { getAdminSession } from "@/lib/adminSession";
import { getErrorMessage } from "@/lib/errors";
import { supabaseService } from "@/lib/supabaseService";
import { listMessagingRecipients, parseMessagingFilters, type MessagingRecipient } from "@/lib/mensajeriaRecipients";
import { Calendar, Mail, Users } from "lucide-react";
import MessagingForm, { type MensajeriaOperativoOption } from "./MessagingForm";

export const dynamic = "force-dynamic";

const PREVIEW_LIMIT = 25;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function fetchOperativos(): Promise<MensajeriaOperativoOption[]> {
  const { data, error } = await supabaseService
    .from("operativos")
    .select("id,titulo,fecha_inicio,lugar")
    .eq("estado", "publicado")
    .order("fecha_inicio", { ascending: false });

  if (error) throw error;
  return (data ?? []) as MensajeriaOperativoOption[];
}

export default async function MensajeriaPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const session = await getAdminSession();

  if (!session.allowed) {
    redirect("/login?next=/admin/mensajeria");
  }

  const filters = parseMessagingFilters(params);
  const successMessage = typeof params?.success === "string" ? params.success : "";
  const errorQueryParam = typeof params?.error === "string" ? params.error : "";

  let total = 0;
  let preview: MessagingRecipient[] = [];
  let operativos: MensajeriaOperativoOption[] = [];
  let recipients: MessagingRecipient[] = [];
  let errorMessage = errorQueryParam;

  try {
    const [operativosList, recipientsList] = await Promise.all([
      fetchOperativos(),
      listMessagingRecipients(filters),
    ]);

    operativos = operativosList;
    recipients = recipientsList;
    total = recipientsList.length;
    preview = recipientsList.slice(0, PREVIEW_LIMIT);
  } catch (error: unknown) {
    if (!errorMessage) {
      errorMessage = getErrorMessage(error, "No se pudo cargar la mensajería.");
    }
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        backHref="/admin"
        eyebrow="Mensajería"
        title="Mensajería masiva"
        description="Segmenta destinatarios por operativo y envía correos personalizados a voluntarios."
        successMessage={successMessage}
        errorMessage={errorMessage}
      />

      {/* Stats */}
      <StatTileGrid>
        <StatTile 
          icon={<Users className="h-4 w-4" />}
          label="Destinatarios disponibles"
          value={total}
          highlight={total > 0}
          highlightVariant="emerald"
        />
        <StatTile 
          icon={<Calendar className="h-4 w-4" />}
          label="Operativos disponibles"
          value={operativos.length}
        />
      </StatTileGrid>

      <MessagingForm
        filters={filters}
        operativos={operativos}
        total={total}
        recipients={recipients}
        preview={preview}
        successMessage={successMessage}
        errorMessage={errorMessage}
      />
    </div>
  );
}
