import { useState } from "react"
import {
  ArrowLeft,
  Share2,
  Download,
  HelpCircle,
  Users,
  Send,
  PlusCircle,
  FileSpreadsheet,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Campaign } from "../types"

interface CampaignReportViewProps {
  campaign: Campaign
  onBack: () => void
}

type ReportSubTab = "overview" | "deliverability" | "opens" | "clicks" | "unsubscribes"

export function CampaignReportView({ campaign, onBack }: CampaignReportViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<ReportSubTab>("overview")
  const [inspectModalTitle, setInspectModalTitle] = useState<string | null>(null)
  const [inspectFilter, setInspectFilter] = useState<"delivered" | "opens" | "clicks" | "unsubscribes">("delivered")

  const stats = campaign.stats || {
    delivered: 88,
    deliveredRate: 97.78,
    opens: 55,
    openRate: 62.5,
    clicks: 12,
    clickRate: 13.64,
    unsubscribes: 0,
    unsubscribeRate: 0,
  }

  // Mock recipient event logs
  const recipientsLog = [
    { email: "maria.torres@unap.edu.pe", name: "Dra. María Torres", status: "Entregado", opened: "19 sept 20:42", clicked: "19 sept 20:45", device: "Desktop (Chrome)" },
    { email: "carlos.mendoza@iiap.gob.pe", name: "Ing. Carlos Mendoza", status: "Entregado", opened: "19 sept 20:50", clicked: "19 sept 20:52", device: "Móvil (Safari)" },
    { email: "lucia.valdez@gmail.com", name: "Lic. Lucía Valdez", status: "Entregado", opened: "19 sept 21:15", clicked: "—", device: "Desktop (Firefox)" },
    { email: "juan.perez@concytec.gob.pe", name: "Dr. Juan Pérez", status: "Entregado", opened: "19 sept 21:30", clicked: "19 sept 21:34", device: "Desktop (Edge)" },
    { email: "ana.rios@amazonas.pe", name: "Mg. Ana Ríos", status: "Entregado", opened: "20 sept 08:12", clicked: "—", device: "Móvil (Android)" },
    { email: "ricardo.solis@uni.edu.pe", name: "Ing. Ricardo Solís", status: "Entregado", opened: "20 sept 09:05", clicked: "20 sept 09:07", device: "Desktop (Chrome)" },
    { email: "patricia.vega@unmsm.edu.pe", name: "Dra. Patricia Vega", status: "Entregado", opened: "20 sept 10:20", clicked: "—", device: "Móvil (iOS)" },
    { email: "david.herrera@minam.gob.pe", name: "David Herrera", status: "Entregado", opened: "20 sept 11:45", clicked: "20 sept 11:50", device: "Desktop (Chrome)" },
  ]

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    toast.success(`Exportando informe de "${campaign.name}" en formato ${format.toUpperCase()}...`)
  }

  const openRecipientsInspect = (type: "delivered" | "opens" | "clicks" | "unsubscribes", title: string) => {
    setInspectFilter(type)
    setInspectModalTitle(title)
  }

  const filteredLogs = recipientsLog.filter((item) => {
    if (inspectFilter === "opens") return item.opened !== "—"
    if (inspectFilter === "clicks") return item.clicked !== "—"
    if (inspectFilter === "unsubscribes") return false
    return true
  })

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Header matching Reference Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2 border border-border rounded-xl bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors mt-1"
            title="Volver a la lista"
          >
            <ArrowLeft className="size-4" />
          </button>

          {/* Email Thumbnail preview */}
          <div className="size-20 sm:size-24 rounded-2xl bg-gradient-to-br from-violet-600 via-indigo-700 to-slate-900 p-2 flex flex-col justify-between text-white shrink-0 shadow-sm border border-border/40">
            <div className="text-[9px] font-black tracking-widest uppercase opacity-80">CONIAP</div>
            <div className="text-center">
              <span className="text-[10px] font-bold block leading-tight">CONIAP 2024</span>
              <span className="text-[8px] opacity-70 block">III Congreso Int.</span>
            </div>
            <div className="text-[8px] text-center bg-black/40 py-0.5 rounded text-amber-300 font-semibold">
              AMPLIACIÓN
            </div>
          </div>

          {/* Title & Sent Date */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground uppercase">
              {campaign.name}
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              #{campaign.campaignNumber || 15} • {campaign.sentAt ? `Enviada el ${new Date(campaign.sentAt).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })} a las ${new Date(campaign.sentAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}` : "Enviada el 19 sept 2024 20:38"}
            </p>
          </div>
        </div>

        {/* Share & Export Report Dropdown */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              navigator.clipboard?.writeText(window.location.href)
              toast.success("Enlace del informe copiado al portapapeles")
            }}
            className="rounded-xl size-10 border-border text-foreground hover:bg-muted"
            title="Compartir informe"
          >
            <Share2 className="size-4" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="rounded-xl h-10 px-4 font-semibold border-border text-foreground hover:bg-muted text-xs flex items-center gap-1.5"
              >
                <Download className="size-4 text-muted-foreground" />
                <span>Exportar informe</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl w-44">
              <DropdownMenuItem onClick={() => handleExport("pdf")} className="text-xs cursor-pointer">
                <FileText className="mr-2 size-4 text-red-500" />
                Descargar PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("excel")} className="text-xs cursor-pointer">
                <FileSpreadsheet className="mr-2 size-4 text-emerald-500" />
                Exportar Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport("csv")} className="text-xs cursor-pointer">
                <FileSpreadsheet className="mr-2 size-4 text-blue-500" />
                Exportar CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Meta info card (Asunto, De, Responder a) - Matches Image 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl border border-border/80 bg-card text-xs">
        <div>
          <span className="text-muted-foreground block mb-1">Asunto</span>
          <span className="font-bold text-foreground text-sm">{campaign.subject || "CONIAP"}</span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">De</span>
          <span className="font-semibold text-foreground">
            {campaign.senderName || "IIAP"} &lt;{campaign.senderEmail || "daylersan@gmail.com"}&gt;
          </span>
        </div>
        <div>
          <span className="text-muted-foreground block mb-1">Responder a</span>
          <span className="font-semibold text-foreground">
            {campaign.replyTo || campaign.senderEmail || "daylersan@gmail.com"}
          </span>
        </div>
      </div>

      {/* Subtabs matching Reference Image 2 */}
      <div className="flex items-center gap-6 border-b border-border text-xs sm:text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("overview")}
          className={`pb-3 border-b-2 transition-all shrink-0 ${activeSubTab === "overview"
            ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          Descripción general
        </button>

        <button
          onClick={() => setActiveSubTab("deliverability")}
          className={`pb-3 border-b-2 transition-all shrink-0 ${activeSubTab === "deliverability"
            ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          Entregabilidad
        </button>

        <button
          onClick={() => setActiveSubTab("opens")}
          className={`pb-3 border-b-2 transition-all shrink-0 ${activeSubTab === "opens"
            ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          Aperturas
        </button>

        <button
          onClick={() => setActiveSubTab("clicks")}
          className={`pb-3 border-b-2 transition-all shrink-0 ${activeSubTab === "clicks"
            ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          Clics
        </button>

        <button
          onClick={() => setActiveSubTab("unsubscribes")}
          className={`pb-3 border-b-2 transition-all shrink-0 ${activeSubTab === "unsubscribes"
            ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          Cancelaciones de susc...
        </button>
      </div>

      {/* SUBTAB 1: DESCRIPCIÓN GENERAL (Image 2) */}
      {activeSubTab === "overview" && (
        <div className="space-y-8">
          {/* SECTION 1: Rendimiento de campaña */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground">
                Rendimiento de campaña
              </h2>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="size-1.5 rounded-full bg-slate-400 inline-block" />
                <span>Aperturas automatizadas y clics incluidas.</span>
                <HelpCircle className="size-3 text-muted-foreground" />
              </div>
            </div>

            {/* 4 Metric Highlight Cards (Exact match with Image 2) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl border border-border/80 bg-card divide-y sm:divide-y-0 sm:divide-x divide-border/60 overflow-hidden shadow-2xs">
              {/* Box 1: Entregados */}
              <div className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Entregados</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">
                      {stats.delivered}
                    </span>
                    <button
                      onClick={() => openRecipientsInspect("delivered", "Contactos Entregados (88)")}
                      className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                    >
                      <Users className="size-3" />
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground block text-[11px]">Índice de entrega</span>
                  <span className="font-bold text-foreground text-sm">{stats.deliveredRate}%</span>
                </div>
              </div>

              {/* Box 2: Aperturas */}
              <div className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <span>Aperturas</span>
                    <HelpCircle className="size-3" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">
                      {stats.opens}
                    </span>
                    <button
                      onClick={() => openRecipientsInspect("opens", "Contactos que Abrieron el Email (55)")}
                      className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                    >
                      <Users className="size-3" />
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground block text-[11px]">Índice de apertura</span>
                  <span className="font-bold text-foreground text-sm">{stats.openRate}%</span>
                </div>
              </div>

              {/* Box 3: Clics */}
              <div className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <span>Clics</span>
                    <HelpCircle className="size-3" />
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">
                      {stats.clicks}
                    </span>
                    <button
                      onClick={() => openRecipientsInspect("clicks", "Contactos con Clics Registrados (12)")}
                      className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                    >
                      <Users className="size-3" />
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground block text-[11px]">Click-through rate (CTR)</span>
                  <span className="font-bold text-foreground text-sm">{stats.clickRate}%</span>
                </div>
              </div>

              {/* Box 4: Cancelaciones de suscripción */}
              <div className="p-5 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>Cancelaciones de suscripción</span>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-foreground tracking-tight">
                      {stats.unsubscribes}
                    </span>
                    <button
                      onClick={() => openRecipientsInspect("unsubscribes", "Cancelaciones de suscripción (0)")}
                      className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                    >
                      <Users className="size-3" />
                      <span>Ver</span>
                    </button>
                  </div>
                </div>
                <div className="pt-3 border-t border-border/40 text-xs">
                  <span className="text-muted-foreground block text-[11px]">Tasa de cancelaciones de suscripción</span>
                  <span className="font-bold text-foreground text-sm">{stats.unsubscribeRate}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: Audiencia de campaña */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground">
              Audiencia de campaña
            </h2>

            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <PlusCircle className="size-4 text-muted-foreground" />
                <span>Listas incluidas</span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="rounded-full px-3 py-1 font-semibold text-xs border-border bg-muted/40">
                    #8 {campaign.segmentNames?.[0] || "Participantes CONIAP 2024"}
                  </Badge>
                </div>

                <button
                  onClick={() => openRecipientsInspect("delivered", "Lista #8 - Destinatarios")}
                  className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1"
                >
                  <Users className="size-3.5" />
                  <span>Ver contactos</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: Cronología */}
          <div className="space-y-3">
            <h2 className="text-base font-bold text-foreground">
              Cronología
            </h2>

            <div className="rounded-2xl border border-border/80 bg-card p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Send className="size-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">
                    Envío completada
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                    [#{campaign.campaignNumber || 15}] {campaign.name} se ha enviado satisfactoriamente a {stats.delivered} destinatarios el 19 sept 2024 20:38.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2, 3, 4, 5: Detailed Breakdown Tables */}
      {activeSubTab !== "overview" && (
        <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-foreground text-sm capitalize">
              Detalles de {activeSubTab === "deliverability" ? "Entregabilidad" : activeSubTab === "opens" ? "Aperturas" : activeSubTab === "clicks" ? "Clics en enlaces" : "Bajas y cancelaciones"}
            </h3>
            <span className="text-xs text-muted-foreground font-medium">
              {filteredLogs.length} registros encontrados
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-xs">
              <thead className="bg-muted/50 text-left font-semibold text-muted-foreground border-b border-border">
                <tr>
                  <th className="p-3">Destinatario</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3">Primera apertura</th>
                  <th className="p-3">Clics registrados</th>
                  <th className="p-3">Dispositivo / Cliente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((row, idx) => (
                  <tr key={idx} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-foreground">{row.name}</div>
                      <div className="text-[11px] text-muted-foreground">{row.email}</div>
                    </td>
                    <td className="p-3">
                      <Badge className="bg-emerald-500/10 text-emerald-600 border-0 text-[10px] font-semibold">
                        {row.status}
                      </Badge>
                    </td>
                    <td className="p-3 text-muted-foreground">{row.opened}</td>
                    <td className="p-3">
                      {row.clicked !== "—" ? (
                        <span className="font-semibold text-violet-600 dark:text-violet-400">{row.clicked}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-3 text-muted-foreground">{row.device}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recipient Inspect Dialog */}
      <Dialog open={!!inspectModalTitle} onOpenChange={() => setInspectModalTitle(null)}>
        <DialogContent className="sm:max-w-[650px] p-6 rounded-3xl border-border bg-card max-h-[85vh] flex flex-col">
          <DialogHeader className="pb-2 border-b border-border/40">
            <DialogTitle className="text-lg font-bold text-foreground">
              {inspectModalTitle}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pt-3">
            <div className="space-y-2">
              {filteredLogs.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border/60 bg-muted/20 text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{item.name}</span>
                    <span className="text-muted-foreground text-[11px]">{item.email}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-violet-600 dark:text-violet-400 font-semibold block">{item.device}</span>
                    <span className="text-[10px] text-muted-foreground">{item.opened}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
