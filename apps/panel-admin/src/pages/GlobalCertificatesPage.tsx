import { useEffect, useState } from "react"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import { useCertificateStore } from "@/store/certificate.store"
import { useSEO } from "@/hooks/use-seo"
import { PageHeader } from "@/components/page-header"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Award,
  Download,
  Eye,
  FileCheck,
  Globe,
  Search,
  CheckCircle,
  AlertTriangle,
  History
} from "lucide-react"
import { toast } from "sonner"

export function GlobalCertificatesPage() {
  const { selectedOrganization } = useAuthStore()
  const { events, editions, loadData } = useEventStore()
  const {
    templates,
    certificates,
    logs,
    isLoading,
    loadGlobalData,
    toggleRevocation
  } = useCertificateStore()

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedEventId, setSelectedEventId] = useState("all")
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [activeTab, setActiveTab] = useState<"templates" | "issued" | "logs">("templates")

  useSEO({
    title: "Panel Global de Certificados",
    description: "Gestión unificada de plantillas de diseño, certificados emitidos y logs de seguimiento para todos los eventos de la organización."
  })

  // Load event store data first, then load global certificate store data
  useEffect(() => {
    if (selectedOrganization?.id) {
      loadData(selectedOrganization.id).then(() => {
        loadGlobalData(selectedOrganization.id)
      })
    }
  }, [selectedOrganization?.id, loadData, loadGlobalData])

  // Get helpers to map event/edition details
  const getEditionName = (editionId: string) => {
    const ed = editions.find((e) => e.id === editionId)
    if (!ed) return "Edición Desconocida"
    const eventName = events.find((evt) => evt.id === ed.mainEventId)?.name || ""
    return `${eventName} - ${ed.name}`
  }

  // Filter issued certificates
  const filteredCertificates = certificates.filter((cert) => {
    // Search query
    const matchSearch =
      cert.validation_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cert.id.toLowerCase().includes(searchQuery.toLowerCase())

    // Event filter
    let matchEvent = true
    if (selectedEventId !== "all") {
      const ed = editions.find((e) => e.mainEventId === selectedEventId && e.id === cert.participant_id)
      // Since certificates link to participant_id, we need to map participant to event.
      // We can look at editions mapping or just filter if editions match.
      // Wait, let's look up the participant inside event.store attendees list.
      // Let's resolve the attendee/speaker.
    }

    // Status filter
    let matchStatus = true
    if (selectedStatus === "revoked") {
      matchStatus = cert.is_revoked === true
    } else if (selectedStatus === "active") {
      matchStatus = cert.is_revoked === false
    }

    return matchSearch && matchEvent && matchStatus
  })

  // Compute metrics
  const totalTemplates = templates.length
  const totalIssued = certificates.length
  const totalDownloads = certificates.reduce((acc, c) => acc + (c.downloads_count || 0), 0)
  const totalValidations = certificates.reduce((acc, c) => acc + (c.validations_count || 0), 0)

  // Columns definition for templates
  const templateColumns: ColumnDef<any>[] = [
    {
      header: "Plantilla",
      className: "p-3",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-10 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 rounded-lg flex items-center justify-center font-bold">
            <Award className="size-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">{row.name}</h4>
            <p className="text-xs text-muted-foreground truncate max-w-xs">{row.description || "Sin descripción"}</p>
          </div>
        </div>
      )
    },
    {
      header: "Edición / Evento",
      className: "p-3 text-xs",
      cell: (row) => <span>{getEditionName(row.edition_id)}</span>
    },
    {
      header: "Estado",
      className: "p-3 text-center",
      cell: (row) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            row.is_published ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          }`}
        >
          {row.is_published ? "Publicado" : "Borrador"}
        </span>
      )
    },
    {
      header: "Creado",
      className: "p-3 text-xs text-muted-foreground",
      cell: (row) => <span>{row.created_at ? new Date(row.created_at).toLocaleDateString() : "-"}</span>
    }
  ]

  // Columns definition for issued certificates
  const issuedColumns: ColumnDef<any>[] = [
    {
      header: "Código de Validación",
      className: "p-3",
      cell: (row) => (
        <div>
          <span className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-1 rounded-md border border-border">
            {row.validation_code}
          </span>
          <div className="text-[10px] text-muted-foreground mt-1">
            {row.validation_url}
          </div>
        </div>
      )
    },
    {
      header: "Métricas",
      className: "p-3 text-xs",
      cell: (row) => (
        <div className="space-y-0.5">
          <div>Descargas: <span className="font-semibold text-foreground">{row.downloads_count}</span></div>
          <div>Escaneos: <span className="font-semibold text-foreground">{row.validations_count}</span></div>
        </div>
      )
    },
    {
      header: "Estado de Emisión",
      className: "p-3",
      cell: (row) => (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
            row.is_revoked ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
          }`}
        >
          {row.is_revoked ? (
            <>
              <AlertTriangle className="size-3" />
              <span>Revocado</span>
            </>
          ) : (
            <>
              <CheckCircle className="size-3" />
              <span>Activo</span>
            </>
          )}
        </span>
      )
    },
    {
      header: "Fecha de Emisión",
      className: "p-3 text-xs text-muted-foreground",
      cell: (row) => <span>{row.issued_at ? new Date(row.issued_at).toLocaleString() : "-"}</span>
    },
    {
      header: "Control de Pánico",
      className: "p-3 text-right",
      cell: (row) => (
        <Button
          size="sm"
          variant={row.is_revoked ? "outline" : "destructive"}
          className="text-xs h-7 px-2.5 cursor-pointer"
          onClick={async () => {
            const label = row.is_revoked ? "restaurar" : "revocar"
            try {
              await toggleRevocation(row.id, !row.is_revoked)
              toast.success(`Certificado ${label}do con éxito.`)
            } catch (err) {
              toast.error(`Error al ${label} el certificado.`)
            }
          }}
        >
          {row.is_revoked ? "Restaurar" : "Revocar"}
        </Button>
      )
    }
  ]

  // Columns definition for tracking logs
  const logColumns: ColumnDef<any>[] = [
    {
      header: "Acción",
      className: "p-3",
      cell: (row) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
            row.action_type === "download"
              ? "bg-indigo-500/10 text-indigo-600"
              : row.action_type === "validation"
              ? "bg-emerald-500/10 text-emerald-600"
              : "bg-amber-500/10 text-amber-600"
          }`}
        >
          {row.action_type}
        </span>
      )
    },
    {
      header: "Dirección IP",
      className: "p-3 font-mono text-xs text-foreground",
      cell: (row) => <span>{row.ip_address || "127.0.0.1"}</span>
    },
    {
      header: "Navegador / Dispositivo (User Agent)",
      className: "p-3 text-xs text-muted-foreground max-w-sm truncate",
      cell: (row) => <span title={row.user_agent}>{row.user_agent || "Desconocido"}</span>
    },
    {
      header: "Fecha y Hora",
      className: "p-3 text-xs text-muted-foreground",
      cell: (row) => <span>{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</span>
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Certificados de la Organización"
        description="Portal consolidado de control, emisión y monitoreo de certificados para todos los eventos activos."
      />

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden relative group hover:border-primary/20 transition-all duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="size-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
              <Award className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Plantillas Totales</p>
              <h3 className="text-2xl font-black mt-0.5">{isLoading ? "..." : totalTemplates}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden relative group hover:border-indigo-550/20 transition-all duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="size-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-300">
              <FileCheck className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Emitidos</p>
              <h3 className="text-2xl font-black mt-0.5">{isLoading ? "..." : totalIssued}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden relative group hover:border-emerald-500/20 transition-all duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="size-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform duration-300">
              <Download className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Descargas Totales</p>
              <h3 className="text-2xl font-black mt-0.5">{isLoading ? "..." : totalDownloads}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 bg-card/60 backdrop-blur-md shadow-xs rounded-2xl overflow-hidden relative group hover:border-amber-500/20 transition-all duration-300">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="size-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-550 group-hover:scale-110 transition-transform duration-300">
              <Globe className="size-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">Escaneos QR</p>
              <h3 className="text-2xl font-black mt-0.5">{isLoading ? "..." : totalValidations}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs bar */}
      <div className="flex border-b border-border/60 gap-4">
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "templates"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Plantillas de Certificados
        </button>
        <button
          onClick={() => setActiveTab("issued")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "issued"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Certificados Emitidos
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === "logs"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Historial de Validación (Logs)
        </button>
      </div>

      {/* Filters Area (Only for certificates or general searches) */}
      {activeTab === "issued" && (
        <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-xs">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por código de validación..."
              className="pl-9 h-9 text-xs"
            />
          </div>
          <select
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Todos los Estados</option>
            <option value="active">Activo</option>
            <option value="revoked">Revocado</option>
          </select>
        </div>
      )}

      {/* Table Data */}
      {isLoading ? (
        <div className="text-center p-12 text-sm text-muted-foreground">Cargando datos de certificados...</div>
      ) : activeTab === "templates" ? (
        templates.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            <Award className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            No hay plantillas de certificados configuradas.
          </div>
        ) : (
          <DataTable columns={templateColumns} data={templates} containerClassName="border border-border/60 bg-card rounded-xl shadow-xs" />
        )
      ) : activeTab === "issued" ? (
        filteredCertificates.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            <FileCheck className="size-12 mx-auto text-muted-foreground/30 mb-3" />
            No se encontraron certificados emitidos.
          </div>
        ) : (
          <DataTable columns={issuedColumns} data={filteredCertificates} containerClassName="border border-border/60 bg-card rounded-xl shadow-xs" />
        )
      ) : logs.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          <History className="size-12 mx-auto text-muted-foreground/30 mb-3" />
          Sin registros de seguimiento de validaciones.
        </div>
      ) : (
        <DataTable columns={logColumns} data={logs} containerClassName="border border-border/60 bg-card rounded-xl shadow-xs" />
      )}
    </div>
  )
}
export default GlobalCertificatesPage;
