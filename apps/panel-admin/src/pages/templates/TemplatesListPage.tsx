import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Mail,
  Plus,
  Search,
  FolderPlus,
  Copy,
  Trash2,
  Edit,
  SlidersHorizontal,
  Sparkles,
  MessageSquare,
  Crown,
  CheckCircle2,
  Layers,
  MoreVertical,
} from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api/client"
import { useAuthStore } from "@/store/auth.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function TemplatesListPage() {
  const navigate = useNavigate()
  const { selectedOrganization } = useAuthStore()

  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [activeTab, setActiveTab] = useState<"EMAIL" | "WHATSAPP">("EMAIL")

  // Modal "¿Qué plantilla quieres crear?"
  const [openTypeModal, setOpenTypeModal] = useState(false)
  const [selectedType, setSelectedType] = useState<"EMAIL" | "WHATSAPP">("EMAIL")

  // Delete dialog
  const [templateToDelete, setTemplateToDelete] = useState<any | null>(null)

  const loadTemplates = async () => {
    if (!selectedOrganization?.id) return
    try {
      setLoading(true)
      const data = await api.emailTemplates.list(selectedOrganization.id, search)
      setTemplates(data)
    } catch (err: any) {
      toast.error(err?.message || "Error al cargar las plantillas.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadTemplates()
  }, [selectedOrganization?.id, search])

  const handleSelectTemplateType = () => {
    if (selectedType === "WHATSAPP") {
      toast.info("Plantillas de WhatsApp estarán disponibles próximamente.")
      return
    }
    setOpenTypeModal(false)
    navigate("/dashboard/templates/new")
  }

  const handleDuplicate = async (id: string) => {
    try {
      await api.emailTemplates.duplicate(id)
      toast.success("Plantilla duplicada con éxito.")
      loadTemplates()
    } catch (err: any) {
      toast.error(err?.message || "No se pudo duplicar la plantilla.")
    }
  }

  const handleDelete = async () => {
    if (!templateToDelete) return
    try {
      await api.emailTemplates.remove(templateToDelete.id)
      toast.success("Plantilla eliminada correctamente.")
      setTemplateToDelete(null)
      loadTemplates()
    } catch (err: any) {
      toast.error(err?.message || "Error al eliminar la plantilla.")
    }
  }

  const filteredTemplates = templates.filter((t) =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.subject?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 container mx-auto">
      {/* Top Header matching Brevo/Admin style (Image 1) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Plantillas
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Crea, personaliza y gestiona las plantillas de correo para tus campañas y notificaciones.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            onClick={() => toast.info("Organización de carpetas disponible en la versión Pro.")}
            className="rounded-xl h-10 px-4 font-medium border-border text-foreground hover:bg-muted text-xs flex items-center gap-1.5"
          >
            <FolderPlus className="size-4 text-muted-foreground" />
            <span>Crear carpeta</span>
          </Button>

          <Button
            onClick={() => setOpenTypeModal(true)}
            className="rounded-xl h-10 px-5 font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-primary dark:text-primary-foreground shadow-sm flex items-center gap-2"
          >
            <Plus className="size-4" />
            <span>Crear plantilla</span>
          </Button>
        </div>
      </div>

      {/* Tabs: Email (Active) | WhatsApp (Pro/Coming soon) */}
      <div className="flex items-center gap-8 border-b border-border/80 text-sm font-semibold">
        <button
          onClick={() => setActiveTab("EMAIL")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "EMAIL"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Mail className="size-4" />
          <span>Email</span>
        </button>

        <button
          onClick={() => setActiveTab("WHATSAPP")}
          className={`pb-3 border-b-2 transition-all flex items-center gap-2 ${
            activeTab === "WHATSAPP"
              ? "border-violet-600 text-violet-600 dark:text-violet-400 font-bold"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="size-4 text-emerald-600" />
          <span>WhatsApp</span>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-1.5 py-0.5 rounded-full font-medium">
            Próximamente
          </span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar una plantilla..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background rounded-xl h-10 border-border text-xs"
          />
        </div>

        <div className="text-xs text-muted-foreground font-medium">
          {filteredTemplates.length} {filteredTemplates.length === 1 ? "plantilla" : "plantillas"}
        </div>
      </div>

      {/* Templates List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 rounded-2xl border bg-card/50 animate-pulse p-6 space-y-4" />
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border/80 bg-card/40 p-12 text-center max-w-xl mx-auto space-y-4 my-6">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Sparkles className="size-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">No tienes plantillas de email guardadas</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              Crea tu primera plantilla de correo electrónico profesional o elige una de nuestras plantillas básicas.
            </p>
          </div>
          <Button
            onClick={() => setOpenTypeModal(true)}
            className="rounded-xl font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-primary dark:text-primary-foreground"
          >
            <Plus className="mr-2 size-4" />
            Crear primera plantilla
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTemplates.map((template) => {
            const isActive = template.status === "ACTIVE"
            const isDraft = template.status === "DRAFT"

            return (
              <div
                key={template.id}
                className="group relative rounded-2xl border border-border bg-background p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between hover:border-primary/40"
              >
                <div>
                  {/* Top Status & Dropdown */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : isDraft
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                          : "bg-slate-500/10 text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          isActive ? "bg-emerald-500" : isDraft ? "bg-amber-500" : "bg-slate-400"
                        }`}
                      />
                      {isActive ? "Activa" : isDraft ? "Borrador" : "Inactiva"}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted">
                          <MoreVertical className="size-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl w-40">
                        <DropdownMenuItem
                          onClick={() => navigate(`/dashboard/templates/${template.id}/edit`)}
                          className="cursor-pointer text-xs flex items-center gap-2"
                        >
                          <Edit className="size-3.5" />
                          <span>Editar datos</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => navigate(`/dashboard/templates/${template.id}/builder`)}
                          className="cursor-pointer text-xs flex items-center gap-2"
                        >
                          <SlidersHorizontal className="size-3.5" />
                          <span>Diseñar email</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDuplicate(template.id)}
                          className="cursor-pointer text-xs flex items-center gap-2"
                        >
                          <Copy className="size-3.5" />
                          <span>Duplicar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTemplateToDelete(template)}
                          className="cursor-pointer text-xs text-destructive flex items-center gap-2"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Title & Subject */}
                  <h3
                    onClick={() => navigate(`/dashboard/templates/${template.id}/edit`)}
                    className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-1 cursor-pointer"
                  >
                    {template.name}
                  </h3>

                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                    {template.subject || "Sin asunto definido"}
                  </p>

                  {template.senderEmail && (
                    <div className="mt-3">
                      <Badge variant="outline" className="text-[11px] font-normal border-primary/20 text-primary">
                        De: {template.senderName || "Remitente"} &lt;{template.senderEmail}&gt;
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-border/40 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    Modificado: {new Date(template.updatedAt).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/dashboard/templates/${template.id}/edit`)}
                      className="rounded-lg h-8 text-xs font-medium"
                    >
                      <Edit className="mr-1 size-3.5" />
                      Configurar
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => navigate(`/dashboard/templates/${template.id}/builder`)}
                      className="rounded-lg h-8 text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-primary dark:text-primary-foreground"
                    >
                      <SlidersHorizontal className="mr-1.5 size-3.5" />
                      Diseñar
                    </Button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: "¿Qué plantilla quieres crear?" (Exact match with Image 1)         */}
      {/* ========================================================================= */}
      <Dialog open={openTypeModal} onOpenChange={setOpenTypeModal}>
        <DialogContent className="sm:max-w-[620px] p-8 rounded-3xl border-border bg-card">
          <DialogHeader className="space-y-1.5 text-left pb-1">
            <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
              ¿Qué plantilla quieres crear?
            </DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Elige el tipo de plantilla que deseas crear desde cero y reutilízala siempre que la necesites.
            </p>
          </DialogHeader>

          <div className="space-y-6 pt-3">
            {/* 2 Options Cards (Image 1) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Plantilla de email */}
              <div
                onClick={() => setSelectedType("EMAIL")}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex items-center gap-3.5 ${
                  selectedType === "EMAIL"
                    ? "border-violet-600 bg-violet-50/20 shadow-xs ring-1 ring-violet-600/30"
                    : "border-border/80 hover:border-border bg-card/60 hover:bg-card"
                }`}
              >
                <div className="size-11 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center shrink-0">
                  <Mail className="size-5" />
                </div>
                <div>
                  <h4 className="font-bold text-foreground text-sm">Plantilla de email</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">Diseño visual para campañas y avisos</p>
                </div>
              </div>

              {/* Option 2: Plantillas de WhatsApp */}
              <div
                onClick={() => setSelectedType("WHATSAPP")}
                className={`cursor-pointer rounded-2xl p-5 border-2 transition-all flex items-center gap-3.5 opacity-80 hover:opacity-100 ${
                  selectedType === "WHATSAPP"
                    ? "border-emerald-600 bg-emerald-50/20 shadow-xs ring-1 ring-emerald-600/30"
                    : "border-border/80 hover:border-border bg-card/60 hover:bg-card"
                }`}
              >
                <div className="size-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="size-5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-foreground text-sm">Plantillas de WhatsApp</h4>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Mensajes interactivos (Próximamente)</p>
                </div>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenTypeModal(false)}
                className="rounded-full px-6 h-10 font-semibold border-border text-foreground hover:bg-muted"
              >
                Cancelar
              </Button>

              <Button
                type="button"
                onClick={handleSelectTemplateType}
                className="rounded-full px-7 h-10 font-semibold bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm dark:bg-primary dark:text-primary-foreground"
              >
                Continuar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!templateToDelete} onOpenChange={() => setTemplateToDelete(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar plantilla de email?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la plantilla "{templateToDelete?.name}" y todo su contenido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
