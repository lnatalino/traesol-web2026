import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminSession";
import { supabaseService } from "@/lib/supabaseService";
import { listMessagingRecipients, parseMessagingFilters, type MessagingRecipient } from "@/lib/mensajeriaRecipients";
import MessagingForm, { type MensajeriaOperativoOption } from "./MessagingForm";

export const dynamic = "force-dynamic";

const PREVIEW_LIMIT = 25;

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

async function fetchOperativos(): Promise<MensajeriaOperativoOption[]> {
  const { data, error } = await supabaseService
    .from("operativos")
    .select("id,titulo,fecha_inicio,lugar")
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
  let errorMessage = errorQueryParam;

  try {
    const [operativosList, recipients] = await Promise.all([
      fetchOperativos(),
      listMessagingRecipients(filters),
    ]);

    operativos = operativosList;
    total = recipients.length;
    preview = recipients.slice(0, PREVIEW_LIMIT);
  } catch (err: any) {
    if (!errorMessage) {
      errorMessage = err?.message ? String(err.message) : "No se pudo cargar la mensajería.";
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Mensajería masiva</h1>
          <p className="text-sm text-slate-500">
            Filtra voluntarios y envía un email masivo usando Resend.
          </p>
        </div>
      </div>

      <MessagingForm
        filters={filters}
        operativos={operativos}
        total={total}
        preview={preview}
        successMessage={successMessage}
        errorMessage={errorMessage}
      />
    </div>
  );
}
