import { useState } from "react"
import {
  X,
  Search,
  ChevronDown,
  Eye,
  LayoutTemplate,
  Send,
  Sparkles,
  Layers,
  ShoppingBag,
  FileText,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"

interface TemplatePickerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectTemplate: (templateData: any) => void
  savedTemplates?: any[]
}

export function TemplatePickerModal({
  open,
  onOpenChange,
  onSelectTemplate,
  savedTemplates = [],
}: TemplatePickerModalProps) {
  const [activeCategory, setActiveCategory] = useState<"BASIC" | "SAVED" | "READY">("BASIC")
  const [search, setSearch] = useState("")
  const [, setPreviewTemplate] = useState<any | null>(null)

  const starterTemplates = [
    {
      id: "starter-default",
      name: "Plantilla predeterminada",
      category: "BASIC",
      tagline: "Estructura estándar de titular, banner y botón",
      description: "Ideal para comunicados generales, avisos corporativos y actualizaciones importantes.",
      thumbnailSvg: (
        <div className="w-full h-full bg-slate-50 dark:bg-zinc-900 p-4 flex flex-col items-center justify-between text-center">
          <div className="w-16 h-4 rounded bg-slate-700 text-white text-[8px] font-bold flex items-center justify-center">
            Logo
          </div>
          <div className="w-28 h-2 rounded bg-slate-800 dark:bg-slate-200 mt-2" />
          <div className="w-20 h-16 rounded-xl border border-slate-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center my-2 shadow-2xs">
            <ShoppingBag className="size-6 text-slate-400" />
          </div>
          <div className="w-24 h-4 rounded bg-emerald-600 text-white text-[8px] font-semibold flex items-center justify-center">
            Botón CTA
          </div>
        </div>
      ),
    },
    {
      id: "starter-product",
      name: "Vender un producto o ticket",
      category: "BASIC",
      tagline: "Equipamiento esencial para cada aventura",
      description: "Diseñada para promocionar entradas de eventos, pases especiales o venta de cursos.",
      thumbnailSvg: (
        <div className="w-full h-full bg-slate-50 dark:bg-zinc-900 p-4 flex flex-col items-center justify-between text-center">
          <div className="w-20 h-5 rounded bg-slate-700 text-white text-[9px] font-bold flex items-center justify-center">
            Logo
          </div>
          <div className="w-32 h-2.5 rounded bg-slate-800 dark:bg-slate-200 mt-1" />
          <div className="w-full h-14 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 p-2 flex items-center justify-between my-2">
            <div className="space-y-1 text-left">
              <div className="w-16 h-2 rounded bg-emerald-700" />
              <div className="w-10 h-1.5 rounded bg-emerald-500" />
            </div>
            <div className="w-10 h-5 rounded bg-emerald-600 text-white text-[8px] font-bold flex items-center justify-center">
              S/ 150
            </div>
          </div>
          <div className="w-24 h-4 rounded bg-slate-900 dark:bg-primary text-white text-[8px] font-semibold flex items-center justify-center">
            Comprar
          </div>
        </div>
      ),
    },
    {
      id: "starter-story",
      name: "Contar una historia",
      category: "BASIC",
      tagline: "Newsletter editorial con saludo personalizado",
      description: "Enfocada en lectura fluida, historias de éxito, cartas del director o resúmenes semanales.",
      thumbnailSvg: (
        <div className="w-full h-full bg-slate-50 dark:bg-zinc-900 p-4 flex flex-col items-start justify-between text-left">
          <div className="w-14 h-4 rounded bg-slate-700 text-white text-[8px] font-bold flex items-center justify-center">
            Logo
          </div>
          <div className="w-32 h-2 rounded bg-slate-800 dark:bg-slate-200 mt-2" />
          <div className="w-full space-y-1 my-2">
            <div className="w-full h-1.5 rounded bg-slate-300 dark:bg-zinc-700" />
            <div className="w-5/6 h-1.5 rounded bg-slate-300 dark:bg-zinc-700" />
            <div className="w-4/6 h-1.5 rounded bg-slate-300 dark:bg-zinc-700" />
          </div>
          <div className="w-20 h-4 rounded bg-blue-600 text-white text-[8px] font-semibold flex items-center justify-center self-center">
            Leer más
          </div>
        </div>
      ),
    },
  ]

  const displayList =
    activeCategory === "BASIC"
      ? starterTemplates
      : activeCategory === "SAVED"
        ? savedTemplates
        : starterTemplates

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1100px] h-[85vh] p-0 rounded-3xl border-border bg-background overflow-hidden flex flex-col">
        {/* Top Header matching Brevo/Admin (Image 3) */}
        <div className="h-16 px-6 border-b border-border/80 flex items-center justify-between bg-card shrink-0">
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            Crear un email
          </h2>
          <button
            onClick={() => onOpenChange(false)}
            className="size-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Body Layout: Left Sidebar + Center Gallery */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar Menu (Images 3 & 4) */}
          <aside className="w-64 border-r border-border/80 bg-card/50 p-5 flex flex-col justify-between shrink-0 space-y-6">
            <div className="space-y-6">
              {/* Primary Action Button */}
              <Button
                onClick={() => {
                  onSelectTemplate({ starterId: "starter-default", name: "Plantilla en blanco" })
                  onOpenChange(false)
                }}
                className="w-full rounded-2xl h-11 font-bold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-primary dark:text-primary-foreground shadow-sm flex items-center justify-between px-4"
              >
                <span>Crear desde cero</span>
                <ChevronDown className="size-4" />
              </Button>

              {/* Navigation Menu Categories */}
              <div className="space-y-5">
                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    Tus emails
                  </p>
                  <button
                    onClick={() => setActiveCategory("SAVED")}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
                  >
                    <Send className="size-4 text-slate-500" />
                    <span>Campañas de email</span>
                  </button>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">
                    Plantillas
                  </p>
                  <div className="space-y-1">
                    <button
                      onClick={() => setActiveCategory("SAVED")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${activeCategory === "SAVED"
                          ? "bg-violet-600/10 text-violet-700 dark:text-violet-400 font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                      <LayoutTemplate className="size-4" />
                      <span>Tus plantillas</span>
                    </button>

                    <button
                      onClick={() => setActiveCategory("BASIC")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${activeCategory === "BASIC"
                          ? "bg-violet-600/10 text-violet-700 dark:text-violet-400 font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                      <Layers className="size-4" />
                      <span>Plantillas básicas</span>
                    </button>

                    <button
                      onClick={() => setActiveCategory("READY")}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${activeCategory === "READY"
                          ? "bg-violet-600/10 text-violet-700 dark:text-violet-400 font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        }`}
                    >
                      <Sparkles className="size-4" />
                      <span>Listo para usar</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Center Gallery Area (Images 3 & 4) */}
          <main className="flex-1 p-8 overflow-y-auto space-y-6">
            {/* Header Description */}
            <div>
              <h3 className="text-xl font-bold text-foreground">
                {activeCategory === "BASIC"
                  ? "Todas las plantillas básicas"
                  : activeCategory === "SAVED"
                    ? "Todas las plantillas guardadas"
                    : "Plantillas listas para usar"}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
                Las plantillas básicas te brindan una base flexible para tus emails. Personaliza estas estructuras para diseñar correos que se adapten a tu marca y objetivos.
              </p>
            </div>

            {/* Search & Sort Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9 text-xs rounded-xl bg-background"
                />
              </div>

              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 px-3 py-2 rounded-xl border border-border bg-card">
                  <span>Ordenar por: Recientes</span>
                  <ChevronDown className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {displayList.map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="group rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs hover:shadow-md hover:border-violet-500/50 transition-all flex flex-col justify-between"
                >
                  {/* Card Thumbnail Area with eye icon */}
                  <div className="relative h-56 w-full border-b border-border/60 bg-slate-50 dark:bg-zinc-900/60 flex items-center justify-center p-3">
                    {tmpl.thumbnailSvg || (
                      <div className="p-6 text-center space-y-2">
                        <FileText className="size-10 text-muted-foreground mx-auto" />
                        <p className="text-xs font-semibold text-foreground">{tmpl.name}</p>
                      </div>
                    )}

                    {/* Preview Eye Button */}
                    <button
                      onClick={() => setPreviewTemplate(tmpl)}
                      title="Vista previa de plantilla"
                      className="absolute top-3 right-3 size-8 rounded-full bg-white/90 dark:bg-zinc-800/90 text-slate-700 dark:text-slate-200 flex items-center justify-center shadow-sm hover:scale-105 transition-transform"
                    >
                      <Eye className="size-4" />
                    </button>
                  </div>

                  {/* Card Info & Button */}
                  <div className="p-4 space-y-3">
                    <h4 className="font-bold text-sm text-foreground line-clamp-1">
                      {tmpl.name}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {tmpl.tagline || tmpl.description || tmpl.subject || "Plantilla lista para usar"}
                    </p>

                    <Button
                      onClick={() => {
                        onSelectTemplate(tmpl)
                        onOpenChange(false)
                      }}
                      variant="outline"
                      className="w-full rounded-xl h-9 text-xs font-semibold border-slate-300 dark:border-zinc-700 hover:bg-neutral-900 hover:text-white dark:hover:bg-primary transition-all"
                    >
                      Usar plantilla
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  )
}
