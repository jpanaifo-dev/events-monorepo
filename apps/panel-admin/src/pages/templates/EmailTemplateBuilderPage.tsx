import { useEffect, useState, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Smartphone,
  Monitor,
  Heading,
  Type,
  ImageIcon,
  Minus,
  Trash2,
  Sparkles,
  Palette,
  Save,
  ChevronLeft,
  Play,
  Share2,
  Code2,
  ShoppingBag,
  Menu,
  MousePointer,
  Send,
  Eye,
  Layers,
  Copy,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export interface EmailBlock {
  id: string
  type:
  | "heading"
  | "text"
  | "image"
  | "video"
  | "button"
  | "dynamic"
  | "logo"
  | "social"
  | "html"
  | "divider"
  | "product"
  | "navigation"
  label: string
  options?: Record<string, any>
}

export interface EmailTheme {
  bgColor: string
  cardBgColor: string
  primaryColor: string
  textColor: string
  fontFamily: string
  maxWidth: number
  borderRadius: string
}

const DEFAULT_THEME: EmailTheme = {
  bgColor: "#f8fafc",
  cardBgColor: "#ffffff",
  primaryColor: "#009245",
  textColor: "#1e293b",
  fontFamily: "Inter, sans-serif",
  maxWidth: 600,
  borderRadius: "8px",
}

export function EmailTemplateBuilderPage() {
  const { templateId } = useParams<{ templateId: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSavedTime, setLastSavedTime] = useState<string>("Reciente")

  // Template State
  const [templateName, setTemplateName] = useState("Nueva plantilla")
  const [subject, setSubject] = useState("")
  const [previewText, setPreviewText] = useState("")
  const [senderEmail, setSenderEmail] = useState("daylersan@gmail.com")
  const [senderName, setSenderName] = useState("IIAP")
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE" | "DRAFT">("DRAFT")

  // Canvas View Mode (Desktop vs Mobile, Image 5)
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop")

  // Left Sidebar Mode: "content" (blocks) | "style" (theme)
  const [sidebarMode, setSidebarMode] = useState<"content" | "style">("content")
  const [contentTab, setContentTab] = useState<"blocks" | "sections">("blocks")

  // Blocks & Selection State
  const [blocks, setBlocks] = useState<EmailBlock[]>([])
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [theme, setTheme] = useState<EmailTheme>(DEFAULT_THEME)

  // Undo / Redo History
  const [history, setHistory] = useState<EmailBlock[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // Preview & Test Modal
  const [openPreviewModal, setOpenPreviewModal] = useState(false)
  const [testEmail, setTestEmail] = useState("daylersan@gmail.com")

  // Push history on block changes
  const recordHistory = (newBlocks: EmailBlock[]) => {
    const updatedHistory = history.slice(0, historyIndex + 1)
    updatedHistory.push(newBlocks)
    setHistory(updatedHistory)
    setHistoryIndex(updatedHistory.length - 1)
  }

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex((prev) => prev - 1)
      setBlocks(history[historyIndex - 1])
    }
  }

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex((prev) => prev + 1)
      setBlocks(history[historyIndex + 1])
    }
  }

  // Load Template Data
  useEffect(() => {
    if (!templateId) return
    loadTemplate()
  }, [templateId])

  const loadTemplate = async () => {
    try {
      setLoading(true)
      const data = await api.emailTemplates.get(templateId!)
      setTemplateName(data.name || "Plantilla")
      setSubject(data.subject || "")
      setPreviewText(data.previewText || "")
      setSenderEmail(data.senderEmail || "daylersan@gmail.com")
      setSenderName(data.senderName || "IIAP")
      setStatus(data.status || "DRAFT")

      let initialBlocks: EmailBlock[] = []
      if (Array.isArray(data.content) && data.content.length > 0) {
        initialBlocks = data.content
      } else {
        // Default starter blocks matching Image 5
        initialBlocks = [
          {
            id: `logo-${Date.now()}`,
            type: "logo",
            label: "Logotipo",
            options: { text: "Logo", align: "center", width: 140 },
          },
          {
            id: `head-${Date.now()}`,
            type: "heading",
            label: "Este es el titular.",
            options: { text: "Este es el titular.", align: "center", level: 1, color: "#111827" },
          },
          {
            id: `prod-${Date.now()}`,
            type: "product",
            label: "Producto / Entrada",
            options: {
              title: "Pase General",
              price: "S/ 100.00",
              imageUrl: "",
              description: "Acceso a conferencias y talleres.",
            },
          },
        ]
      }

      setBlocks(initialBlocks)
      setHistory([initialBlocks])
      setHistoryIndex(0)
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      setLastSavedTime(timeStr)
    } catch (err: any) {
      toast.error(err?.message || "Error al cargar la plantilla.")
    } finally {
      setLoading(false)
    }
  }

  // Add block from palette
  const addBlock = (type: EmailBlock["type"], label: string) => {
    let defaultOptions: Record<string, any> = {}

    switch (type) {
      case "heading":
        defaultOptions = { text: "Nuevo Título Principal", align: "left", level: 1, color: "#0f172a" }
        break
      case "text":
        defaultOptions = {
          text: "Escribe aquí el contenido de tu correo. Puedes usar variables personalizadas como {{ contact.FIRSTNAME }}.",
          align: "left",
          color: "#334155",
        }
        break
      case "image":
        defaultOptions = {
          imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80",
          alt: "Banner",
          align: "center",
        }
        break
      case "video":
        defaultOptions = {
          videoUrl: "https://youtube.com",
          thumbnailUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80",
          title: "Ver Video Informativo",
        }
        break
      case "button":
        defaultOptions = {
          text: "Confirmar Asistencia",
          url: "https://ejemplo.com",
          align: "center",
          bgColor: theme.primaryColor,
          textColor: "#ffffff",
        }
        break
      case "dynamic":
        defaultOptions = { variable: "contact.FIRSTNAME", fallback: "Estimado/a asistente" }
        break
      case "logo":
        defaultOptions = { text: "Logo", align: "center", width: 140 }
        break
      case "social":
        defaultOptions = {
          align: "center",
          networks: [
            { name: "facebook", url: "https://facebook.com" },
            { name: "instagram", url: "https://instagram.com" },
            { name: "linkedin", url: "https://linkedin.com" },
            { name: "twitter", url: "https://x.com" },
          ],
        }
        break
      case "html":
        defaultOptions = { html: "<div style='padding: 10px; text-align: center;'>Código HTML personalizado</div>" }
        break
      case "divider":
        defaultOptions = { color: "#e2e8f0", height: 1, marginY: 20 }
        break
      case "product":
        defaultOptions = {
          title: "Entrada VIP - Acceso Total",
          price: "S/ 150.00",
          description: "Acceso preferencial a todas las sesiones y networking.",
        }
        break
      case "navigation":
        defaultOptions = {
          links: [
            { label: "Inicio", url: "#" },
            { label: "Agenda", url: "#" },
            { label: "Ponentes", url: "#" },
            { label: "Contacto", url: "#" },
          ],
        }
        break
    }

    const newBlock: EmailBlock = {
      id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type,
      label,
      options: defaultOptions,
    }

    const updated = [...blocks, newBlock]
    setBlocks(updated)
    setSelectedBlockId(newBlock.id)
    recordHistory(updated)
    toast.success(`Bloque "${label}" añadido`)
  }

  // Update selected block options
  const updateSelectedBlock = (updates: Partial<EmailBlock>) => {
    if (!selectedBlockId) return
    const updated = blocks.map((b) => (b.id === selectedBlockId ? { ...b, ...updates } : b))
    setBlocks(updated)
    recordHistory(updated)
  }

  // Duplicate block
  const duplicateBlock = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const index = blocks.findIndex((b) => b.id === id)
    if (index === -1) return
    const blockToClone = blocks[index]
    const cloned: EmailBlock = {
      ...blockToClone,
      id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      options: JSON.parse(JSON.stringify(blockToClone.options || {})),
    }
    const updated = [...blocks]
    updated.splice(index + 1, 0, cloned)
    setBlocks(updated)
    setSelectedBlockId(cloned.id)
    recordHistory(updated)
    toast.success("Bloque duplicado.")
  }

  // Delete block
  const deleteBlock = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const updated = blocks.filter((b) => b.id !== id)
    setBlocks(updated)
    if (selectedBlockId === id) setSelectedBlockId(null)
    recordHistory(updated)
    toast.info("Bloque eliminado.")
  }

  // Save changes
  const handleSave = async (exitAfter = false) => {
    if (!templateId) return
    try {
      setSaving(true)
      const payload = {
        name: templateName,
        subject,
        previewText,
        senderEmail,
        senderName,
        status,
        content: blocks,
      }

      await api.emailTemplates.update(templateId, payload)
      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      setLastSavedTime(timeStr)
      toast.success("Diseño de email guardado correctamente.")

      if (exitAfter) {
        navigate("/dashboard/templates")
      }
    } catch (err: any) {
      toast.error(err?.message || "Error al guardar el diseño.")
    } finally {
      setSaving(false)
    }
  }

  const selectedBlock = useMemo(
    () => blocks.find((b) => b.id === selectedBlockId),
    [blocks, selectedBlockId]
  )

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm font-medium text-muted-foreground">Cargando editor de email…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 dark:bg-zinc-950 select-none overflow-hidden font-sans">
      {/* ========================================================================= */}
      {/* TOP NAVBAR: Logo, Title, Undo/Redo, Autosave, Responsive, Actions (Img 5)  */}
      {/* ========================================================================= */}
      <header className="h-16 border-b border-border/80 bg-white dark:bg-zinc-900 px-5 flex items-center justify-between z-30 shrink-0 shadow-xs">
        {/* Left: Brand Icon + Editable Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/templates")}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
            title="Volver a plantillas"
          >
            <ArrowLeft className="size-4" />
          </button>

          <span className="text-sm font-bold text-foreground truncate max-w-[200px] sm:max-w-xs">
            {templateName}
          </span>
        </div>

        {/* Center: Undo/Redo + Autosave Timestamp + Desktop/Mobile Switcher */}
        <div className="flex items-center gap-5">
          {/* Undo / Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Deshacer"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <Undo2 className="size-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Rehacer"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <Redo2 className="size-4" />
            </button>
          </div>

          {/* Last Saved Status (Image 5) */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground">
            <Sparkles className="size-3.5 text-violet-500" />
            <span>Guardado por última vez el {lastSavedTime}</span>
          </div>

          {/* Desktop / Mobile Switcher (Image 5) */}
          <div className="flex items-center bg-slate-100 dark:bg-zinc-800 p-1 rounded-full border border-slate-200 dark:border-zinc-700">
            <button
              onClick={() => setViewMode("desktop")}
              title="Vista de escritorio"
              className={`p-1.5 rounded-full transition-all flex items-center justify-center ${viewMode === "desktop"
                ? "bg-white dark:bg-zinc-900 text-primary shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Monitor className="size-4" />
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              title="Vista móvil"
              className={`p-1.5 rounded-full transition-all flex items-center justify-center ${viewMode === "mobile"
                ? "bg-white dark:bg-zinc-900 text-primary shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground"
                }`}
            >
              <Smartphone className="size-4" />
            </button>
          </div>
        </div>

        {/* Right Actions: Preview and Save & Exit */}
        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenPreviewModal(true)}
            className="rounded-xl h-9 px-4 font-semibold text-xs border-border flex items-center gap-1.5"
          >
            <Eye className="size-3.5 text-muted-foreground" />
            <span>Vista previa y prueba</span>
          </Button>

          <Button
            size="sm"
            onClick={() => handleSave(true)}
            disabled={saving}
            className="rounded-xl h-9 px-5 font-semibold text-xs bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-primary dark:text-primary-foreground shadow-sm flex items-center gap-1.5"
          >
            <Save className="size-3.5" />
            <span>{saving ? "Guardando..." : "Guardar y salir"}</span>
          </Button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN BUILDER AREA: Left Sidebar + Center Canvas                           */}
      {/* ========================================================================= */}
      <div className="flex-1 flex overflow-hidden">
        {/* ======================================================================= */}
        {/* NARROW ICON BAR (Contenido | Estilo) (Image 5)                           */}
        {/* ======================================================================= */}
        <div className="w-16 border-r border-border/80 bg-white dark:bg-zinc-900 flex flex-col items-center py-4 space-y-4 shrink-0">
          <button
            onClick={() => {
              setSidebarMode("content")
              setSelectedBlockId(null)
            }}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold p-2 rounded-xl transition-all ${sidebarMode === "content"
              ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
          >
            <Layers className="size-5" />
            <span>Contenido</span>
          </button>

          <button
            onClick={() => setSidebarMode("style")}
            className={`flex flex-col items-center gap-1 text-[10px] font-semibold p-2 rounded-xl transition-all ${sidebarMode === "style"
              ? "text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
          >
            <Palette className="size-5" />
            <span>Estilo</span>
          </button>
        </div>

        {/* ======================================================================= */}
        {/* LEFT PALETTE / INSPECTOR SIDEBAR (Image 5)                              */}
        {/* ======================================================================= */}
        <aside className="w-80 border-r border-border/80 bg-white dark:bg-zinc-900 flex flex-col shrink-0 overflow-y-auto">
          {sidebarMode === "style" ? (
            /* Style Settings */
            <div className="p-5 space-y-5">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Palette className="size-4 text-primary" />
                Estilo Global del Email
              </h3>

              <div className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Color de Fondo Exterior</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.bgColor}
                      onChange={(e) => setTheme({ ...theme, bgColor: e.target.value })}
                      className="size-8 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={theme.bgColor}
                      onChange={(e) => setTheme({ ...theme, bgColor: e.target.value })}
                      className="h-8 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Color de Fondo del Contenedor</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.cardBgColor}
                      onChange={(e) => setTheme({ ...theme, cardBgColor: e.target.value })}
                      className="size-8 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={theme.cardBgColor}
                      onChange={(e) => setTheme({ ...theme, cardBgColor: e.target.value })}
                      className="h-8 text-xs font-mono uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Color Primario (Botones)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="size-8 rounded-lg border cursor-pointer"
                    />
                    <Input
                      value={theme.primaryColor}
                      onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value })}
                      className="h-8 text-xs font-mono uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : selectedBlock ? (
            /* Selected Block Inspector */
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <button
                  onClick={() => setSelectedBlockId(null)}
                  className="flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                  <span>Volver a bloques</span>
                </button>
                <button
                  onClick={(e) => deleteBlock(selectedBlock.id, e)}
                  title="Eliminar bloque"
                  className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Propiedades del Bloque ({selectedBlock.label})
              </h4>

              {/* Dynamic options based on block type */}
              <div className="space-y-4">
                {selectedBlock.type === "heading" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Texto del Titular</label>
                    <Input
                      value={selectedBlock.options?.text || ""}
                      onChange={(e) =>
                        updateSelectedBlock({ options: { ...selectedBlock.options, text: e.target.value } })
                      }
                      className="h-9 text-xs"
                    />
                    <div className="space-y-1 pt-2">
                      <label className="text-xs font-semibold text-foreground">Alineación</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["left", "center", "right"].map((align) => (
                          <Button
                            key={align}
                            size="sm"
                            variant={selectedBlock.options?.align === align ? "default" : "outline"}
                            onClick={() =>
                              updateSelectedBlock({ options: { ...selectedBlock.options, align } })
                            }
                            className="h-8 text-xs capitalize"
                          >
                            {align}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === "text" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Contenido del Texto</label>
                    <textarea
                      value={selectedBlock.options?.text || ""}
                      onChange={(e) =>
                        updateSelectedBlock({ options: { ...selectedBlock.options, text: e.target.value } })
                      }
                      rows={5}
                      className="w-full text-xs rounded-xl border border-border bg-background p-3 focus:outline-hidden focus:ring-2 focus:ring-primary resize-none"
                    />
                  </div>
                )}

                {selectedBlock.type === "image" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">URL de la Imagen</label>
                      <Input
                        value={selectedBlock.options?.imageUrl || ""}
                        onChange={(e) =>
                          updateSelectedBlock({ options: { ...selectedBlock.options, imageUrl: e.target.value } })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Texto Alternativo (Alt)</label>
                      <Input
                        value={selectedBlock.options?.alt || ""}
                        onChange={(e) =>
                          updateSelectedBlock({ options: { ...selectedBlock.options, alt: e.target.value } })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                  </div>
                )}

                {selectedBlock.type === "button" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Texto del Botón</label>
                      <Input
                        value={selectedBlock.options?.text || ""}
                        onChange={(e) =>
                          updateSelectedBlock({ options: { ...selectedBlock.options, text: e.target.value } })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Enlace de Destino (URL)</label>
                      <Input
                        value={selectedBlock.options?.url || ""}
                        onChange={(e) =>
                          updateSelectedBlock({ options: { ...selectedBlock.options, url: e.target.value } })
                        }
                        className="h-9 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Color del Botón</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={selectedBlock.options?.bgColor || theme.primaryColor}
                          onChange={(e) =>
                            updateSelectedBlock({
                              options: { ...selectedBlock.options, bgColor: e.target.value },
                            })
                          }
                          className="size-8 rounded-lg border cursor-pointer"
                        />
                        <Input
                          value={selectedBlock.options?.bgColor || theme.primaryColor}
                          onChange={(e) =>
                            updateSelectedBlock({
                              options: { ...selectedBlock.options, bgColor: e.target.value },
                            })
                          }
                          className="h-8 text-xs font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedBlock.type === "logo" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground">Texto o Nombre del Logo</label>
                    <Input
                      value={selectedBlock.options?.text || "Logo"}
                      onChange={(e) =>
                        updateSelectedBlock({ options: { ...selectedBlock.options, text: e.target.value } })
                      }
                      className="h-9 text-xs"
                    />
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Subtabs de bloques y secciones reutilizables */
            <div className="flex flex-col h-full">
              {/* Subtabs Header */}
              <div className="grid grid-cols-2 border-b border-border/80 text-center text-xs font-semibold bg-slate-50 dark:bg-zinc-800/40 shrink-0">
                <button
                  onClick={() => setContentTab("blocks")}
                  className={`py-3 border-b-2 transition-all ${contentTab === "blocks"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold bg-white dark:bg-zinc-900"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Bloques
                </button>
                <button
                  onClick={() => setContentTab("sections")}
                  className={`py-3 border-b-2 transition-all ${contentTab === "sections"
                    ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold bg-white dark:bg-zinc-900"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Secciones
                </button>
              </div>

              {/* 12 Emerald-bordered Blocks Grid (Exact Match with Image 5) */}
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2.5">
                  {/* 1. Título */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "heading")}
                    onClick={() => addBlock("heading", "Título")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Heading className="size-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Título</span>
                  </button>

                  {/* 2. Texto */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "text")}
                    onClick={() => addBlock("text", "Texto")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Type className="size-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Texto</span>
                  </button>

                  {/* 3. Imagen */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "image")}
                    onClick={() => addBlock("image", "Imagen")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <ImageIcon className="size-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Imagen</span>
                  </button>

                  {/* 4. Vídeo */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "video")}
                    onClick={() => addBlock("video", "Vídeo")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Play className="size-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Vídeo</span>
                  </button>

                  {/* 5. Botón */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "button")}
                    onClick={() => addBlock("button", "Botón")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <MousePointer className="size-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Botón</span>
                  </button>

                  {/* 6. Contenido dinámico */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "dynamic")}
                    onClick={() => addBlock("dynamic", "Contenido dinámico")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform font-mono text-sm font-bold">
                      {"{ }"}
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 text-center leading-tight">
                      Contenido dinámico
                    </span>
                  </button>

                  {/* 7. Logotipo */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "logo")}
                    onClick={() => addBlock("logo", "Logotipo")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform font-bold text-[9px]">
                      LOGO
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Logotipo</span>
                  </button>

                  {/* 8. Redes sociales */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "social")}
                    onClick={() => addBlock("social", "Redes sociales")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Share2 className="size-5" />
                    </div>
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200 text-center leading-tight">
                      Redes sociales
                    </span>
                  </button>

                  {/* 9. HTML */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "html")}
                    onClick={() => addBlock("html", "HTML")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Code2 className="size-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">HTML</span>
                  </button>

                  {/* 10. Divisor */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "divider")}
                    onClick={() => addBlock("divider", "Divisor")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Minus className="size-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Divisor</span>
                  </button>

                  {/* 11. Producto */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "product")}
                    onClick={() => addBlock("product", "Producto")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <ShoppingBag className="size-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Producto</span>
                  </button>

                  {/* 12. Navegación */}
                  <button draggable onDragStart={(event) => event.dataTransfer.setData("application/x-email-block", "navigation")}
                    onClick={() => addBlock("navigation", "Navegación")}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-zinc-800 hover:border-emerald-500 hover:bg-emerald-50/20 dark:hover:bg-emerald-950/20 transition-all group bg-white dark:bg-zinc-900 shadow-2xs"
                  >
                    <div className="size-9 rounded-xl border border-emerald-600 text-emerald-600 flex items-center justify-center mb-1.5 group-hover:scale-105 transition-transform">
                      <Menu className="size-5" />
                    </div>
                    <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Navegación</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* ======================================================================= */}
        {/* CENTER EMAIL CANVAS (Image 5)                                           */}
        {/* ======================================================================= */}
        <main
          className="flex-1 overflow-y-auto p-6 md:p-10 flex items-center justify-center transition-all bg-[#f1f5f9] dark:bg-zinc-950"
          style={{
            backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
          onClick={() => setSelectedBlockId(null)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const type = event.dataTransfer.getData("application/x-email-block") as EmailBlock["type"]
            if (!type) return
            const labels: Record<EmailBlock["type"], string> = {
              heading: "Título",
              text: "Texto",
              image: "Imagen",
              video: "Vídeo",
              button: "Botón",
              dynamic: "Contenido dinámico",
              logo: "Logotipo",
              social: "Redes sociales",
              html: "HTML",
              divider: "Divisor",
              product: "Producto",
              navigation: "Navegación",
            }
            if (labels[type]) {
              addBlock(type, labels[type])
            }
          }}
        >
          {/* Email Container (600px width on desktop / 360px on mobile) */}
          <div
            className={`transition-all bg-white dark:bg-zinc-900 shadow-xl border border-slate-200/80 dark:border-zinc-800 flex flex-col ${viewMode === "desktop" ? "w-full max-w-[600px] rounded-2xl p-6 sm:p-8 space-y-4" : "w-[360px] rounded-3xl p-5 space-y-3"
              }`}
            style={{
              backgroundColor: theme.cardBgColor,
              fontFamily: theme.fontFamily,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {blocks.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs">
                Haz clic en cualquiera de los 12 bloques de la izquierda para empezar a diseñar tu email.
              </div>
            ) : (
              blocks.map((block) => {
                const isSelected = selectedBlockId === block.id

                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => setDraggedBlockId(block.id)}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => {
                      if (!draggedBlockId || draggedBlockId === block.id) return
                      setBlocks((items) => { const next = [...items]; const from = next.findIndex((item) => item.id === draggedBlockId); const to = next.findIndex((item) => item.id === block.id); const [moved] = next.splice(from, 1); next.splice(to, 0, moved); return next })
                      setDraggedBlockId(null)
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedBlockId(block.id)
                    }}
                    className={`relative group transition-all cursor-pointer py-1.5 px-3 rounded-lg ${isSelected
                      ? "border-2 border-blue-500 bg-blue-50/10 shadow-xs"
                      : "border-2 border-transparent hover:border-slate-200 dark:hover:border-zinc-800"
                      }`}
                  >
                    {/* Active Block Top Left Tag Badge (Image 5) */}
                    {isSelected && (
                      <div className="absolute -top-3.5 left-2 px-2 py-0.5 rounded-md bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider shadow-xs z-10">
                        {block.type === "heading" ? "Headline" : block.label}
                      </div>
                    )}

                    {/* Floating Action Buttons: Duplicate & Delete */}
                    {isSelected && (
                      <div className="absolute -top-3 right-2 flex items-center gap-1 z-10">
                        <button
                          onClick={(e) => duplicateBlock(block.id, e)}
                          title="Duplicar"
                          className="size-6 rounded-full bg-slate-800 hover:bg-slate-900 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                        >
                          <Copy className="size-3" />
                        </button>
                        <button
                          onClick={(e) => deleteBlock(block.id, e)}
                          title="Eliminar"
                          className="size-6 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </div>
                    )}

                    {/* Block Render Output */}
                    {renderEmailCanvasBlock(block, theme)}
                  </div>
                )
              })
            )}
          </div>
        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: "Vista previa y prueba"                                           */}
      {/* ========================================================================= */}
      <Dialog open={openPreviewModal} onOpenChange={setOpenPreviewModal}>
        <DialogContent className="sm:max-w-[700px] p-6 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Eye className="size-5 text-primary" />
              Vista Previa y Envío de Prueba
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 pt-3">
            {/* Sender / Subject Summary */}
            <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-1 text-xs">
              <p>
                <strong className="text-foreground">De:</strong> {senderName} &lt;{senderEmail}&gt;
              </p>
              <p>
                <strong className="text-foreground">Asunto:</strong> {subject || "(Sin asunto)"}
              </p>
              {previewText && (
                <p>
                  <strong className="text-foreground">Preheader:</strong> {previewText}
                </p>
              )}
            </div>

            {/* Test Email Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-foreground">Enviar correo de prueba a:</label>
              <div className="flex items-center gap-2">
                <Input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="tu-correo@ejemplo.com"
                  className="h-10 text-xs rounded-xl"
                />
                <Button
                  onClick={() => {
                    toast.success(`Correo de prueba enviado con éxito a ${testEmail}`)
                    setOpenPreviewModal(false)
                  }}
                  className="h-10 px-5 font-semibold text-xs rounded-xl bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  <Send className="mr-1.5 size-3.5" />
                  Enviar prueba
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Render each block on the email preview canvas
function renderEmailCanvasBlock(block: EmailBlock, theme: EmailTheme) {
  const opt = block.options || {}

  switch (block.type) {
    case "logo":
      return (
        <div style={{ textAlign: opt.align || "center" }} className="py-2">
          <div className="inline-flex items-center justify-center px-6 py-2 rounded-xl bg-slate-700 text-white font-extrabold text-lg tracking-wider shadow-xs">
            {opt.text || "Logo"}
          </div>
        </div>
      )

    case "heading":
      return (
        <h2
          style={{
            textAlign: opt.align || "center",
            color: opt.color || "#0f172a",
          }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight"
        >
          {opt.text || "Este es el titular."}
        </h2>
      )

    case "text":
      return (
        <p
          style={{
            textAlign: opt.align || "left",
            color: opt.color || "#334155",
          }}
          className="text-xs sm:text-sm leading-relaxed"
        >
          {opt.text || "Contenido del párrafo..."}
        </p>
      )

    case "image":
      return (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 my-1">
          <img
            src={opt.imageUrl || "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=80"}
            alt={opt.alt || "Banner"}
            className="w-full h-44 sm:h-56 object-cover"
          />
        </div>
      )

    case "video":
      return (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-zinc-800 bg-slate-900 my-1 group">
          <img
            src={opt.thumbnailUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"}
            alt="Video"
            className="w-full h-44 object-cover opacity-80"
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-12 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Play className="size-6 fill-white ml-0.5" />
            </div>
          </div>
        </div>
      )

    case "button":
      return (
        <div style={{ textAlign: opt.align || "center" }} className="py-2">
          <button
            type="button"
            style={{
              backgroundColor: opt.bgColor || theme.primaryColor,
              color: opt.textColor || "#ffffff",
              borderRadius: theme.borderRadius,
            }}
            className="py-3 px-8 text-xs font-bold uppercase tracking-wider shadow-sm hover:opacity-90 transition-opacity cursor-default"
          >
            {opt.text || "Confirmar Asistencia"}
          </button>
        </div>
      )

    case "dynamic":
      return (
        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-700 dark:text-violet-300 font-mono text-xs text-center">
          {"{{ " + (opt.variable || "contact.FIRSTNAME") + " }}"}
        </div>
      )

    case "social":
      return (
        <div style={{ textAlign: opt.align || "center" }} className="py-2">
          <div className="inline-flex items-center gap-3 text-slate-500">
            <div className="size-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center hover:text-primary">
              <FacebookIcon className="size-4" />
            </div>
            <div className="size-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center hover:text-primary">
              <InstagramIcon className="size-4" />
            </div>
            <div className="size-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center hover:text-primary">
              <LinkedinIcon className="size-4" />
            </div>
            <div className="size-8 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center hover:text-primary">
              <TwitterIcon className="size-4" />
            </div>
          </div>
        </div>
      )

    case "product":
      return (
        <div className="rounded-2xl border border-slate-200 dark:border-zinc-800 p-4 bg-slate-50/50 dark:bg-zinc-800/30 flex items-center justify-between gap-4">
          <div className="space-y-1 text-left">
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              {opt.title || "Entrada General"}
            </h4>
            <p className="text-xs text-slate-500 line-clamp-1">{opt.description || "Pase al evento"}</p>
          </div>
          <div className="font-extrabold text-sm text-emerald-600 shrink-0">
            {opt.price || "S/ 100.00"}
          </div>
        </div>
      )

    case "navigation":
      return (
        <div className="flex items-center justify-center gap-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {(opt.links || [{ label: "Inicio" }, { label: "Agenda" }, { label: "Contacto" }]).map(
            (link: any, i: number) => (
              <span key={i} className="hover:text-primary transition-colors">
                {link.label}
              </span>
            )
          )}
        </div>
      )

    case "divider":
      return <hr className="border-t border-slate-200 dark:border-zinc-800 my-2" />

    case "html":
      return (
        <div
          dangerouslySetInnerHTML={{ __html: opt.html || "<div>HTML</div>" }}
          className="text-xs py-1"
        />
      )

    default:
      return <div className="text-xs text-muted-foreground py-2">Bloque {block.label}</div>
  }
}

function FacebookIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function InstagramIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  )
}

function LinkedinIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.2a1.66 1.66 0 0 0-1.66 1.66 1.66 1.66 0 0 0 1.66 1.66 1.66 1.66 0 0 0 1.66-1.66A1.66 1.66 0 0 0 7.83 6.2z" />
    </svg>
  )
}

function TwitterIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
