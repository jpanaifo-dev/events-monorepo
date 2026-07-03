import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import QRCode from "qrcode"
import { useCertificateStore } from "@/store/certificate.store"
import { useSEO } from "@/hooks/use-seo"
import { PageHeader } from "@/components/page-header"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { CertificateDesignEditor } from "@/components/CertificateDesignEditor"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Award,
  Plus,
  Settings2,
  Trash2,
  FileCheck,
  FileDown,
  ShieldAlert,
  Info,
} from "lucide-react"
import { toast } from "sonner"

function drawTextWithWrap(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ")
  let line = ""
  const lines = []

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " "
    const metrics = ctx.measureText(testLine)
    const testWidth = metrics.width
    if (testWidth > maxWidth && n > 0) {
      lines.push(line.trim())
      line = words[n] + " "
    } else {
      line = testLine
    }
  }
  lines.push(line.trim())

  const totalHeight = (lines.length - 1) * lineHeight
  let currentY = y - totalHeight / 2

  for (let i = 0; i < lines.length; i++) {
    ctx.fillText(lines[i], x, currentY)
    currentY += lineHeight
  }
}

function drawProfessionalQR(
  ctx: CanvasRenderingContext2D,
  xPx: number,
  yPx: number,
  qrSize: number,
  color: string,
  qrValue: string,
  label: string
) {
  try {
    const qr = QRCode.create(qrValue, { errorCorrectionLevel: "M" })
    const gridCount = qr.modules.size
    const qrData = qr.modules.data
    const moduleSize = qrSize / gridCount

    const qrX = xPx - qrSize / 2
    const qrY = yPx - qrSize / 2

    // Draw background white box
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(qrX, qrY, qrSize, qrSize)

    // Draw dark modules
    ctx.fillStyle = color
    for (let r = 0; r < gridCount; r++) {
      for (let c = 0; c < gridCount; c++) {
        const isDark = qrData[r * gridCount + c] === 1
        if (isDark) {
          ctx.fillRect(
            Math.round(qrX + c * moduleSize),
            Math.round(qrY + r * moduleSize),
            Math.ceil(moduleSize),
            Math.ceil(moduleSize)
          )
        }
      }
    }

    // Draw validation code underneath the QR code
    ctx.font = `12px monospace`
    ctx.fillStyle = color
    ctx.textAlign = "center"
    ctx.fillText(label, xPx, qrY + qrSize + 18)
  } catch (err) {
    console.error("Error generating scannable QR: ", err)
  }
}

function CertificatesSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      {/* Search / Filter Controls bar skeleton */}
      <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-xs items-center justify-between">
        <Skeleton className="h-9 w-full sm:w-64 rounded-lg" />
        <Skeleton className="h-9 w-full sm:w-48 rounded-lg" />
      </div>

      {/* Simulated Table header and rows */}
      <div className="border border-border/60 rounded-xl bg-card overflow-hidden shadow-xs">
        {/* Table header row */}
        <div className="border-b border-border/60 bg-muted/30 px-6 py-4 flex items-center justify-between gap-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>

        {/* Table body rows */}
        <div className="divide-y divide-border/50">
          {[1, 2, 3, 4, 5].map((idx) => (
            <div key={idx} className="px-6 py-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl shrink-0" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-32 hidden md:block" />
              <Skeleton className="h-4 w-28 hidden sm:block" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function EventCertificatesSection() {
  const { id: eventId } = useParams<{ id: string }>()
  const { events, editions, attendees, speakers } = useEventStore()
  const {
    templates,
    certificates,
    logs,
    isLoading,
    loadTemplatesForEditions,
    loadCertificatesForParticipants,
    loadLogsForCertificates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    issueCertificates,
    toggleRevocation,
    incrementDownloads
  } = useCertificateStore()

  // SEO
  const event = events.find((e) => e.id === eventId)
  useSEO({
    title: event ? `${event.name} - Certificados` : "Certificados",
    description: "Gestión de diplomas, emisión automática a asistentes y ponentes, revocación y auditoría de descargas."
  })

  // State
  const [activeTab, setActiveTab] = useState<"templates" | "issue" | "logs">("templates")
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editorTemplateId, setEditorTemplateId] = useState<string | null>(null)
  const [downloadModalData, setDownloadModalData] = useState<{ cert: any; name: string } | null>(null)

  // Form State for new template
  const [newTemplateName, setNewTemplateName] = useState("")
  const [newTemplateDescription, setNewTemplateDescription] = useState("")
  const [newTemplateEditionId, setNewTemplateEditionId] = useState("")
  const [newTemplateIsActive, setNewTemplateIsActive] = useState(true)

  // Filter editions belonging to this event
  const eventEditions = editions.filter((ed) => ed.mainEventId === eventId)
  const editionIds = eventEditions.map((ed) => ed.id)

  // Load templates on mount or when editions load
  useEffect(() => {
    if (editionIds.length > 0) {
      loadTemplatesForEditions(editionIds)
    }
  }, [JSON.stringify(editionIds)])

  // Filter participants (attendees & speakers) belonging to the event
  const eventAttendees = attendees.filter((at) => at.eventId === eventId)
  const eventSpeakers = speakers.filter((sp) => sp.eventId === eventId)

  // Combine them into generic participants
  const participants = [
    ...eventAttendees.map((at) => ({
      id: at.id,
      name: at.fullName,
      email: at.email,
      editionId: at.editionId,
      type: "Participante",
      checkedIn: at.checkedIn
    })),
    ...eventSpeakers.map((sp) => ({
      id: sp.id,
      name: sp.name,
      email: sp.email,
      editionId: sp.editionId,
      type: "Ponente",
      checkedIn: !!sp.checkedIn
    }))
  ]

  // Load certificates and logs once templates & participants are loaded
  const participantIds = participants.map((p) => p.id)
  useEffect(() => {
    if (participantIds.length > 0) {
      loadCertificatesForParticipants(participantIds)
    }
  }, [JSON.stringify(participantIds)])

  // Load logs once certificates are loaded
  const certificateIds = certificates.map((c) => c.id)
  useEffect(() => {
    if (certificateIds.length > 0) {
      loadLogsForCertificates(certificateIds)
    }
  }, [JSON.stringify(certificateIds)])

  // Automatically select first template if none is selected
  useEffect(() => {
    if (templates.length > 0 && !selectedTemplateId) {
      setSelectedTemplateId(templates[0].id)
    }
  }, [templates, selectedTemplateId])

  // Get active template details
  const activeTemplate = templates.find((t) => t.id === selectedTemplateId)

  // Filter participants of the edition matching the active template
  const filteredParticipants = participants.filter((p) => {
    if (!activeTemplate) return false
    return p.editionId === activeTemplate.edition_id
  })

  // Handle template creation
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTemplateName.trim()) {
      toast.error("El nombre de la plantilla es obligatorio.")
      return
    }
    if (!newTemplateEditionId) {
      toast.error("Debes seleccionar una edición del evento.")
      return
    }

    try {
      await addTemplate({
        name: newTemplateName,
        description: newTemplateDescription,
        edition_id: newTemplateEditionId,
        background_image_url: "", // Start empty, visual designer will fill it
        design_schema: {},
        is_active: newTemplateIsActive,
        is_published: false
      })
      toast.success("Plantilla creada correctamente. Ahora abre el Diseñador Visual para agregar el fondo y textos.")
      setIsCreateModalOpen(false)
      // Reset form
      setNewTemplateName("")
      setNewTemplateDescription("")
      setNewTemplateIsActive(true)
    } catch (err) {
      toast.error("Error al crear la plantilla.")
    }
  }

  // Handle visual designer save
  const handleSaveDesign = async (design: { backgroundImageUrl: string; designSchema: Record<string, any> }) => {
    if (!editorTemplateId) return
    try {
      await updateTemplate(editorTemplateId, {
        background_image_url: design.backgroundImageUrl,
        design_schema: design.designSchema
      })
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  // Single issue action
  const handleIssueSingle = async (participantId: string, name: string) => {
    if (!selectedTemplateId) return
    toast.loading("Generando certificado...", { id: "issue-cert" })
    try {
      const { successCount, errors } = await issueCertificates(selectedTemplateId, [{ id: participantId, name }])
      if (successCount > 0) {
        toast.success(`Certificado emitido con éxito a ${name}.`, { id: "issue-cert" })
      } else {
        toast.error(errors[0] || "No se pudo emitir el certificado.", { id: "issue-cert" })
      }
    } catch (err) {
      toast.error("Error en la base de datos.", { id: "issue-cert" })
    }
  }

  // Bulk issue action
  const handleIssueBulk = async () => {
    if (!selectedTemplateId) return

    // Find all filtered participants who DO NOT have a certificate for this template
    const toIssue = filteredParticipants.filter((p) => {
      const hasCert = certificates.some((c) => c.participant_id === p.id && c.template_id === selectedTemplateId)
      return !hasCert
    })

    if (toIssue.length === 0) {
      toast.info("Todos los participantes en esta edición ya cuentan con su certificado.")
      return
    }

    toast.loading(`Emitiendo ${toIssue.length} certificados en lote...`, { id: "bulk-issue" })
    try {
      const participantsData = toIssue.map((p) => ({ id: p.id, name: p.name }))
      const { successCount, errors } = await issueCertificates(selectedTemplateId, participantsData)
      toast.success(`Se emitieron ${successCount} certificados correctamente.`, { id: "bulk-issue" })
      if (errors.length > 0) {
        console.warn("Some certificates failed:", errors)
      }
    } catch (err) {
      toast.error("Ocurrió un error al emitir en lote.", { id: "bulk-issue" })
    }
  }

  // Client-side download rendering for specific participant
  const handleDownloadCertificate = (cert: any, participantName: string, format: "png" | "pdf") => {
    const template = templates.find((t) => t.id === cert.template_id)
    if (!template || !template.background_image_url) {
      toast.error("La plantilla no tiene una imagen de fondo o diseño válido configurado.")
      return
    }

    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = template.background_image_url
    toast.loading("Procesando descarga de certificado...", { id: "render-download" })

    img.onload = async () => {
      const canvas = document.createElement("canvas")
      const schema = template.design_schema || {}
      const width = schema.width || 1414
      const height = schema.height || 1000
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        toast.dismiss("render-download")
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Draw all elements
      const elements = schema.elements || []
      elements.forEach((el: any) => {
        if (el.id === "qr" && !el.showQr) return

        const xPx = (el.x / 100) * width
        const yPx = (el.y / 100) * height

        if (el.id === "qr" && el.showQr) {
          const qrSize = el.qrSize || 120
          const validationCode = cert.validation_code
          const validationUrl = `${window.location.origin}/validar/${validationCode}`
          drawProfessionalQR(ctx, xPx, yPx, qrSize, el.color || "#000000", validationUrl, validationCode)
          return
        }

        const weight = el.fontWeight === "bold" ? "bold" : "normal"
        ctx.font = `${weight} ${el.fontSize}px "${el.fontFamily || "sans-serif"}"`
        ctx.fillStyle = el.color
        ctx.textAlign = el.align

        let text = el.text
        if (text.includes("{{name}}")) {
          text = text.replace("{{name}}", participantName.toUpperCase())
        }
        if (text.includes("{{date}}")) {
          text = text.replace("{{date}}", new Date(cert.issued_at || Date.now()).toLocaleDateString("es-ES"))
        }

        const isAuto = el.autoWidth ?? true
        if (isAuto) {
          ctx.fillText(text, xPx, yPx)
        } else {
          const elMaxWidth = ((el.maxWidth || 80) / 100) * width
          const lineHeight = el.fontSize * 1.25
          drawTextWithWrap(ctx, text, xPx, yPx, elMaxWidth, lineHeight)
        }
      })

      // Download
      if (format === "png") {
        const dataUrl = canvas.toDataURL("image/png")
        const link = document.createElement("a")
        link.download = `CERTIFICADO-${cert.validation_code}.png`
        link.href = dataUrl
        link.click()
      } else {
        const { jsPDF } = await import("jspdf")
        const pageSize = schema.pageSize || "a4"
        const doc = new jsPDF({
          orientation: "landscape",
          unit: "mm",
          format: pageSize
        })
        const imgData = canvas.toDataURL("image/png")
        const pdfWidth = pageSize === "a5" ? 210 : 297
        const pdfHeight = pageSize === "a5" ? 148.5 : 210
        doc.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight)
        doc.save(`CERTIFICADO-${cert.validation_code}.pdf`)
      }

      // Track download in database
      await incrementDownloads(cert.id, {
        ipAddress: "127.0.0.1",
        userAgent: navigator.userAgent
      })
      toast.success(`Certificado descargado como ${format.toUpperCase()}.`, { id: "render-download" })
    }

    img.onerror = () => {
      toast.error("Error al renderizar el certificado. Revisa la imagen de la plantilla.", { id: "render-download" })
    }
  }

  // Columns definition for Template tab
  const templateColumns: ColumnDef<any>[] = [
    {
      header: "Plantilla",
      className: "p-3",
      cell: (row) => (
        <div className="flex items-center gap-3">
          <div className="size-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
            <Award className="size-4.5" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-foreground">{row.name}</h4>
            <p className="text-xs text-muted-foreground max-w-xs truncate">{row.description || "Sin descripción"}</p>
          </div>
        </div>
      )
    },
    {
      header: "Edición Vinculada",
      className: "p-3 text-xs",
      cell: (row) => {
        const ed = eventEditions.find((e) => e.id === row.edition_id)
        return <span className="font-medium text-foreground">{ed ? ed.name : "-"}</span>
      }
    },
    {
      header: "Estado",
      className: "p-3",
      cell: (row) => (
        <div className="flex gap-2">
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
              }`}
          >
            {row.is_active ? "Activo" : "Inactivo"}
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.is_published ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}
          >
            {row.is_published ? "Publicado" : "Borrador"}
          </span>
        </div>
      )
    },
    {
      header: "Acciones",
      className: "p-3 text-right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="text-xs gap-1 h-8 cursor-pointer"
            onClick={() => setEditorTemplateId(row.id)}
          >
            <Settings2 className="size-3.5" />
            Diseñar
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="size-8 p-0 text-destructive hover:bg-destructive/10 cursor-pointer"
            onClick={async () => {
              if (confirm("¿Estás seguro de eliminar esta plantilla? Todos los certificados asociados se verán afectados.")) {
                try {
                  await deleteTemplate(row.id)
                  toast.success("Plantilla eliminada.")
                } catch (err) {
                  toast.error("Error al eliminar la plantilla.")
                }
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      )
    }
  ]

  // Columns definition for Issue tab
  const issueColumns: ColumnDef<any>[] = [
    {
      header: "Participante",
      className: "p-3",
      cell: (row) => (
        <div>
          <h4 className="font-bold text-sm text-foreground">{row.name}</h4>
          <p className="text-xs text-muted-foreground">{row.email || "Sin correo"}</p>
        </div>
      )
    },
    {
      header: "Rol",
      className: "p-3 text-xs",
      cell: (row) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${row.type === "Ponente" ? "bg-indigo-500/10 text-indigo-600" : "bg-muted text-muted-foreground"
            }`}
        >
          {row.type}
        </span>
      )
    },
    {
      header: "Check-In",
      className: "p-3 text-center",
      cell: (row) => (
        <span
          className={`text-[10px] font-semibold ${row.checkedIn ? "text-emerald-500" : "text-muted-foreground/60"
            }`}
        >
          {row.checkedIn ? "Sí" : "No"}
        </span>
      )
    },
    {
      header: "Estado Certificado",
      className: "p-3",
      cell: (row) => {
        const cert = certificates.find((c) => c.participant_id === row.id && c.template_id === selectedTemplateId)
        if (!cert) {
          return <span className="text-[10px] font-bold text-muted-foreground/75 italic">No Emitido</span>
        }
        if (cert.is_revoked) {
          return (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-3" />
              Revocado
            </span>
          )
        }
        return (
          <div>
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary">
              Emitido
            </span>
            <span className="block font-mono text-[9px] text-muted-foreground mt-0.5">
              {cert.validation_code}
            </span>
          </div>
        )
      }
    },
    {
      header: "Acciones",
      className: "p-3 text-right",
      cell: (row) => {
        const cert = certificates.find((c) => c.participant_id === row.id && c.template_id === selectedTemplateId)

        if (!cert) {
          return (
            <Button
              size="sm"
              variant="outline"
              className="text-xs h-8 cursor-pointer"
              onClick={() => handleIssueSingle(row.id, row.name)}
            >
              Emitir
            </Button>
          )
        }

        return (
          <div className="flex justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="size-8 p-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Descargar Certificado"
              onClick={() => setDownloadModalData({ cert, name: row.name })}
            >
              <FileDown className="size-4" />
            </Button>

            <Button
              size="sm"
              variant={cert.is_revoked ? "outline" : "destructive"}
              className="text-xs h-8 px-2.5 cursor-pointer"
              onClick={async () => {
                const action = cert.is_revoked ? "restaurar" : "revocar"
                try {
                  await toggleRevocation(cert.id, !cert.is_revoked)
                  toast.success(`Certificado ${action}do correctamente.`)
                } catch (err) {
                  toast.error(`Error al ${action} el certificado.`)
                }
              }}
            >
              {cert.is_revoked ? "Restaurar" : "Revocar"}
            </Button>
          </div>
        )
      }
    }
  ]

  // Columns definition for Logs
  const logColumns: ColumnDef<any>[] = [
    {
      header: "Código Certificado",
      className: "p-3 font-mono text-xs font-bold text-foreground",
      cell: (row) => {
        const cert = certificates.find((c) => c.id === row.certificate_id)
        return <span>{cert ? cert.validation_code : "Desconocido"}</span>
      }
    },
    {
      header: "Acción",
      className: "p-3",
      cell: (row) => (
        <span
          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${row.action_type === "download"
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
      header: "IP",
      className: "p-3 font-mono text-xs text-muted-foreground",
      cell: (row) => <span>{row.ip_address || "127.0.0.1"}</span>
    },
    {
      header: "Dispositivo (UA)",
      className: "p-3 text-xs text-muted-foreground max-w-xs truncate",
      cell: (row) => <span title={row.user_agent}>{row.user_agent}</span>
    },
    {
      header: "Fecha",
      className: "p-3 text-xs text-muted-foreground",
      cell: (row) => <span>{row.created_at ? new Date(row.created_at).toLocaleString() : "-"}</span>
    }
  ]

  const editorTemplate = templates.find((t) => t.id === editorTemplateId)

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Certificados del Evento"
        description="Configura plantillas, emite diplomas automáticos y gestiona el sistema antifraude y descargas."
        actionButton={
          <Button onClick={() => setIsCreateModalOpen(true)} className="text-xs px-3 py-1.5 h-8 gap-1.5 cursor-pointer">
            <Plus className="size-4" />
            Nueva Plantilla
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-border/60 gap-4">
        <button
          onClick={() => setActiveTab("templates")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "templates"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          Plantillas ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab("issue")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "issue"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          Emisión de Certificados
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeTab === "logs"
            ? "border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
        >
          Historial (Logs)
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <CertificatesSkeleton />
      ) : activeTab === "templates" ? (
        templates.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
            No hay plantillas de certificados configuradas para este evento. Crea una para comenzar.
          </div>
        ) : (
          <DataTable columns={templateColumns} data={templates} containerClassName="border border-border/60 bg-card rounded-xl shadow-xs" />
        )
      ) : activeTab === "issue" ? (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row gap-3 bg-card p-4 rounded-xl border border-border/60 shadow-xs items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Label htmlFor="issueTemplateSelect" className="text-xs font-bold text-muted-foreground uppercase shrink-0">Plantilla Activa</Label>
              <select
                id="issueTemplateSelect"
                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring w-full sm:w-64"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({eventEditions.find((ed) => ed.id === t.edition_id)?.name})
                  </option>
                ))}
              </select>
            </div>

            {selectedTemplateId && (
              <Button size="sm" onClick={handleIssueBulk} className="text-xs gap-1.5 w-full sm:w-auto cursor-pointer">
                <FileCheck className="size-4" />
                Emitir a todos en esta Edición
              </Button>
            )}
          </div>

          {!selectedTemplateId ? (
            <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
              Crea y configura al menos una plantilla de certificado para poder realizar emisiones.
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl flex flex-col items-center gap-2">
              <Info className="size-8 text-muted-foreground/60" />
              <span>No hay participantes inscritos en la edición vinculada a esta plantilla.</span>
            </div>
          ) : (
            <DataTable columns={issueColumns} data={filteredParticipants} containerClassName="border border-border/60 bg-card rounded-xl shadow-xs" />
          )}
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl">
          Aún no se registran descargas o validaciones para los certificados de este evento.
        </div>
      ) : (
        <DataTable columns={logColumns} data={logs} containerClassName="border border-border/60 bg-card rounded-xl shadow-xs" />
      )}

      {/* Create Template Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleCreateTemplate}>
            <DialogHeader>
              <DialogTitle>Crear Plantilla de Certificado</DialogTitle>
              <DialogDescription>
                Añade una plantilla básica. Luego podrás subir el fondo y ajustar las tipografías y posiciones visualmente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="templateName">Nombre de la Plantilla</Label>
                <Input
                  id="templateName"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="Ej: Certificado de Asistencia 2026, Diploma Ponente"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="templateDesc">Descripción (Opcional)</Label>
                <Input
                  id="templateDesc"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  placeholder="Descripción de uso interno..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="templateEdition">Edición del Evento</Label>
                <select
                  id="templateEdition"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
                  value={newTemplateEditionId}
                  onChange={(e) => setNewTemplateEditionId(e.target.value)}
                  required
                >
                  <option value="">Selecciona una Edición...</option>
                  {eventEditions.map((ed) => (
                    <option key={ed.id} value={ed.id}>
                      {ed.name} ({ed.year})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="templateActive"
                  checked={newTemplateIsActive}
                  onCheckedChange={setNewTemplateIsActive}
                />
                <Label htmlFor="templateActive">Plantilla Activa</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className="cursor-pointer">
                Cancelar
              </Button>
              <Button type="submit" className="cursor-pointer">Crear Plantilla</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Visual Design Editor Render */}
      {editorTemplateId && editorTemplate && (
        <CertificateDesignEditor
          templateName={editorTemplate.name}
          backgroundImageUrl={editorTemplate.background_image_url}
          designSchema={editorTemplate.design_schema}
          onSave={handleSaveDesign}
          onClose={() => setEditorTemplateId(null)}
        />
      )}
      {/* Format Selection Dialog for Participants */}
      <Dialog open={!!downloadModalData} onOpenChange={(open) => !open && setDownloadModalData(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Descargar Certificado</DialogTitle>
            <DialogDescription>
              Elige el formato en el que deseas descargar el certificado de <strong>{downloadModalData?.name}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <Button
              variant="outline"
              className="flex flex-col items-center gap-3 py-6 h-auto cursor-pointer border-border hover:border-primary hover:bg-primary/5 transition-all duration-300"
              onClick={() => {
                if (downloadModalData) {
                  handleDownloadCertificate(downloadModalData.cert, downloadModalData.name, "png")
                  setDownloadModalData(null)
                }
              }}
            >
              <Award className="size-8 text-primary" />
              <div className="text-center">
                <div className="font-bold text-xs">Descargar Imagen</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Formato PNG en alta resolución</div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="flex flex-col items-center gap-3 py-6 h-auto cursor-pointer border-border hover:border-indigo-550 hover:bg-indigo-500/5 transition-all duration-300"
              onClick={() => {
                if (downloadModalData) {
                  handleDownloadCertificate(downloadModalData.cert, downloadModalData.name, "pdf")
                  setDownloadModalData(null)
                }
              }}
            >
              <FileDown className="size-8 text-indigo-550" />
              <div className="text-center">
                <div className="font-bold text-xs">Descargar PDF</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">Documento vectorial listo para imprimir</div>
              </div>
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDownloadModalData(null)} className="text-xs cursor-pointer">
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
export default EventCertificatesSection;
