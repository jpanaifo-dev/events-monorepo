import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Edit2,
  Eye,
  SlidersHorizontal,
  Save,
  HelpCircle,
  AlertCircle,
  Smile,
  Code2,
  Sparkles,
  Check,
  CheckCircle2,
  LayoutTemplate,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api/client"
import { useAuthStore } from "@/store/auth.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TemplatePickerModal } from "./TemplatePickerModal"

export function TemplateConfigPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()
  const { selectedOrganization } = useAuthStore()

  const isNew = !templateId || templateId === "new"

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  // Template Data
  const [name, setName] = useState("Nueva plantilla")
  const [isEditingName, setIsEditingName] = useState(false)
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "DRAFT">("INACTIVE")
  const [senderEmail, setSenderEmail] = useState("daylersan@gmail.com")
  const [senderName, setSenderName] = useState(selectedOrganization?.name || "IIAP")
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [content, setContent] = useState<any[] | null>(null)
  const [category, setCategory] = useState("CUSTOM")

  // Modal Gallery
  const [openPicker, setOpenPicker] = useState(false)

  useEffect(() => {
    if (!isNew && templateId) {
      loadTemplate(templateId)
    }
  }, [templateId, isNew])

  const loadTemplate = async (id: string) => {
    try {
      setLoading(true)
      const data = await api.emailTemplates.get(id)
      setName(data.name || "Plantilla")
      setStatus(data.status || "INACTIVE")
      setSenderEmail(data.senderEmail || "daylersan@gmail.com")
      setSenderName(data.senderName || selectedOrganization?.name || "IIAP")
      setSubject(data.subject || "")
      setPreviewText(data.previewText || "")
      setContent(data.content || null)
      setCategory(data.category || "CUSTOM")
    } catch (err: any) {
      toast.error(err?.message || "Error al cargar la plantilla.")
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (redirectAndDesign = false) => {
    if (!selectedOrganization?.id) return
    if (!name.trim()) {
      return toast.error("El nombre de la plantilla es obligatorio.")
    }
    if (!senderEmail.trim()) {
      return toast.error("El email del remitente es obligatorio.")
    }

    try {
      setSaving(true)
      const payload = {
        name: name.trim(),
        status,
        senderEmail: senderEmail.trim(),
        senderName: senderName.trim(),
        subject: subject.trim(),
        previewText: previewText.trim(),
        content: content || undefined,
        category,
      }

      let savedId = templateId

      if (isNew) {
        const created = await api.emailTemplates.create(selectedOrganization.id, payload)
        savedId = created.id
        toast.success("Plantilla creada exitosamente.")
      } else {
        await api.emailTemplates.update(templateId!, payload)
        toast.success("Plantilla guardada correctamente.")
      }

      if (redirectAndDesign && savedId) {
        navigate(`/dashboard/templates/${savedId}/builder`)
      } else if (isNew && savedId) {
        navigate(`/dashboard/templates/${savedId}/edit`, { replace: true })
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar la plantilla.")
    } finally {
      setSaving(false)
    }
  }

  const handleSelectFromPicker = (starterOrTmpl: any) => {
    if (starterOrTmpl.content) {
      setContent(starterOrTmpl.content)
      if (!subject && starterOrTmpl.subject) setSubject(starterOrTmpl.subject)
      if (!previewText && starterOrTmpl.previewText) setPreviewText(starterOrTmpl.previewText)
      if (starterOrTmpl.name && name === "Nueva plantilla") setName(starterOrTmpl.name)
    }
    setOpenPicker(false)
    toast.success(`Plantilla "${starterOrTmpl.name}" cargada en el editor.`)
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Top Navbar Header matching Image 2 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/60">
        {/* Left: Back + Template Name + Status Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/templates")}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-9 text-lg font-bold w-64"
                    autoFocus
                    onBlur={() => setIsEditingName(false)}
                    onKeyDown={(e) => e.key === "Enter" && setIsEditingName(false)}
                  />
                  <Button size="sm" onClick={() => setIsEditingName(false)} className="h-9 px-3">
                    <Check className="size-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                  <h1 className="text-xl font-bold text-foreground">{name}</h1>
                  <Edit2 className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              )}
            </div>

            {/* Status Switcher Toggle */}
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={() => setStatus(status === "ACTIVE" ? "INACTIVE" : "ACTIVE")}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
                  status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                    : "bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300"
                }`}
              >
                <span className={`size-2 rounded-full ${status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-400"}`} />
                <span>{status === "ACTIVE" ? "Activa" : "Inactiva"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Actions: Preview and Save Dropdown */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => {
              if (isNew) {
                toast.info("Guarda primero la plantilla para ver la vista previa en vivo.")
              } else {
                navigate(`/dashboard/templates/${templateId}/builder`)
              }
            }}
            className="rounded-xl h-10 px-4 font-semibold text-xs border-border flex items-center gap-2"
          >
            <Eye className="size-4 text-muted-foreground" />
            <span>Vista previa y prueba</span>
          </Button>

          <Button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="rounded-xl h-10 px-6 font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-primary dark:text-primary-foreground shadow-sm flex items-center gap-2"
          >
            <Save className="size-4" />
            <span>{saving ? "Guardando..." : "Guardar"}</span>
          </Button>
        </div>
      </div>

      {/* Main Grid Form matching Image 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: Contenido Box (Image 2)                                      */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 rounded-3xl border border-border bg-card p-6 shadow-xs space-y-6">
          <h3 className="text-base font-bold text-foreground">Contenido</h3>

          {/* Illustrated Design Card (Image 2) */}
          <div className="rounded-2xl border border-border/80 bg-slate-50 dark:bg-zinc-900/60 p-6 flex flex-col items-center text-center space-y-4">
            {/* Vector Graphic: Designer working on email canvas */}
            <div className="w-48 h-40 relative flex items-center justify-center">
              <div className="w-32 h-36 rounded-xl border border-slate-700 bg-white shadow-md p-2 flex flex-col justify-between">
                {/* Envelope Top Header */}
                <div className="h-6 rounded bg-[#009245] flex items-center justify-between px-2">
                  <div className="size-2 rounded-full bg-white/70" />
                  <div className="w-12 h-1.5 rounded-full bg-white/70" />
                </div>
                {/* Body elements */}
                <div className="space-y-1.5 p-1">
                  <div className="h-2 w-16 bg-slate-200 rounded" />
                  <div className="h-8 rounded bg-emerald-50 border border-emerald-300 flex items-center justify-center">
                    <Sparkles className="size-4 text-emerald-600" />
                  </div>
                </div>
                <div className="h-3 w-10 bg-[#009245] rounded mx-auto" />
              </div>

              {/* Sparkles Decoration */}
              <Sparkles className="absolute top-2 right-4 size-4 text-emerald-500 animate-pulse" />
              <Sparkles className="absolute bottom-4 left-4 size-3 text-slate-400" />
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Añade contenido y diseña desde cero utilizando el editor o una plantilla existente.
            </p>

            <div className="w-full space-y-2 pt-2">
              <Button
                onClick={() => setOpenPicker(true)}
                variant="outline"
                className="w-full rounded-2xl h-11 font-semibold text-xs border-border flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <LayoutTemplate className="size-4 text-primary" />
                <span>Elegir plantilla base</span>
              </Button>

              <Button
                onClick={() => handleSave(true)}
                className="w-full rounded-2xl h-11 font-semibold text-xs bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-primary dark:text-primary-foreground flex items-center justify-center gap-2 shadow-xs"
              >
                <SlidersHorizontal className="size-4" />
                <span>Añadir contenido (Editor)</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: Sender, Subject, Preview Text Fields (Image 2)             */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Email de remitente * */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Email de remitente <span className="text-rose-500">*</span>
              <HelpCircle className="size-3.5 text-muted-foreground cursor-pointer" />
            </label>
            <Input
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="ejemplo@tuorganizacion.com"
              className="h-11 rounded-xl bg-background border-border text-xs px-4"
            />
            {/* Domain authentication notice (Image 2) */}
            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-[11px] leading-tight">
              <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
              <span>
                Tu dominio no está autenticado con DKIM/SPF. Para garantizar la entrega sin caer en spam, el envío se procesa mediante los servidores seguros configurados.
              </span>
            </div>
          </div>

          {/* Nombre de remitente * */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Nombre de remitente <span className="text-rose-500">*</span>
              <HelpCircle className="size-3.5 text-muted-foreground cursor-pointer" />
            </label>
            <Input
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Ej. IIAP, Nombre del Evento"
              className="h-11 rounded-xl bg-background border-border text-xs px-4"
            />
          </div>

          {/* Asunto * */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Asunto <span className="text-rose-500">*</span>
              <HelpCircle className="size-3.5 text-muted-foreground cursor-pointer" />
            </label>
            <div className="relative rounded-2xl border border-border bg-background focus-within:ring-2 focus-within:ring-violet-600 transition-all p-3 space-y-3">
              <textarea
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Escribe un asunto atractivo para tus destinatarios..."
                rows={3}
                className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden resize-none"
              />

              <div className="flex items-center justify-between pt-2 border-t border-border/40 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSubject((s) => s + " 🎉 ")}
                    title="Insertar emoji"
                    className="p-1 hover:text-foreground rounded-md transition-colors"
                  >
                    <Smile className="size-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubject((s) => s + "{{ contact.FIRSTNAME }}")}
                    title="Insertar variable de contacto"
                    className="p-1 hover:text-foreground rounded-md text-xs font-mono transition-colors"
                  >
                    {"{ }"}
                  </button>
                </div>

                <span className="text-[10px]">{subject.length}/100 caracteres</span>
              </div>
            </div>
          </div>

          {/* Texto de vista previa (Preheader) */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              Texto de vista previa
              <HelpCircle className="size-3.5 text-muted-foreground cursor-pointer" />
            </label>
            <Input
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              placeholder="Breve resumen visible en la bandeja de entrada..."
              className="h-11 rounded-xl bg-background border-border text-xs px-4"
            />
          </div>
        </div>
      </div>

      {/* Template Picker Modal (Images 3 & 4) */}
      <TemplatePickerModal
        open={openPicker}
        onOpenChange={setOpenPicker}
        onSelectTemplate={handleSelectFromPicker}
      />
    </div>
  )
}
