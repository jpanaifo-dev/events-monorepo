import { useState } from "react"
import {
  Sparkles,
  Zap,
  Plus,
  Play,
  Pause,
  ArrowRight,
  RefreshCw,
  Edit3,
  Bell,
  Award,
  UserCheck,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Automation, Segment } from "../types"

interface AutomationsTabProps {
  automations: Automation[]
  segments: Segment[]
  onCreateAutomation: (data: any) => void
}

export function AutomationsTab({
  automations,
  segments,
  onCreateAutomation,
}: AutomationsTabProps) {
  const [openCreateModal, setOpenCreateModal] = useState(false)
  const [name, setName] = useState("")
  const [trigger, setTrigger] = useState<Automation["trigger"]>("REGISTRATION")
  const [channel, setChannel] = useState<Automation["channel"]>("EMAIL")
  const [selectedSegmentIds, setSelectedSegmentIds] = useState<string[]>([])

  // AI Prompt builder inside tab
  const [aiMode, setAiMode] = useState<"guided" | "custom">("guided")
  const [promptVerb, setPromptVerb] = useState("envíe")
  const [promptChannel, setPromptChannel] = useState("Email")
  const [promptEvent, setPromptEvent] = useState("se registre a un evento")
  const [customText, setCustomText] = useState("")

  const getTriggerDetails = (t: string) => {
    switch (t) {
      case "REGISTRATION":
        return { label: "Al registrarse", icon: UserCheck, color: "text-blue-500 bg-blue-500/10" }
      case "EVENT_REMINDER":
        return { label: "Recordatorio 24h antes", icon: Bell, color: "text-amber-500 bg-amber-500/10" }
      case "EVENT_ATTENDED":
        return { label: "Asistencia confirmada", icon: Calendar, color: "text-emerald-500 bg-emerald-500/10" }
      case "CERTIFICATE_ISSUED":
        return { label: "Certificado emitido", icon: Award, color: "text-violet-500 bg-violet-500/10" }
      default:
        return { label: "Evento personalizado", icon: Zap, color: "text-purple-500 bg-purple-500/10" }
    }
  }

  const handleCreateNew = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    onCreateAutomation({
      name: name.trim(),
      trigger,
      channel,
      segmentIds: selectedSegmentIds,
      active: true,
    })

    setName("")
    setSelectedSegmentIds([])
    setOpenCreateModal(false)
    toast.success("Automatización creada y activada")
  }

  const handleAiGenerate = () => {
    const generatedName =
      aiMode === "guided"
        ? `Auto-${promptChannel}: ${promptEvent}`
        : customText || "Automatización con IA"

    onCreateAutomation({
      name: generatedName,
      trigger:
        promptEvent.includes("registre")
          ? "REGISTRATION"
          : promptEvent.includes("certificado")
            ? "CERTIFICATE_ISSUED"
            : "EVENT_REMINDER",
      channel: promptChannel.toUpperCase() as any,
      segmentIds: segments.map((s) => s.id),
      active: true,
    })

    setCustomText("")
    toast.success("Automatización generada y configurada")
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / AI Generator Card (Matches Reference Image 3) */}
      <div className="rounded-3xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-background to-background p-6 sm:p-8 space-y-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-bold">
              <Sparkles className="size-3.5" />
              <span>Flujos de Marketing Inteligentes</span>
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">
              Empieza con una frase y crearemos tu automatización
            </h2>
            <p className="text-xs text-muted-foreground">
              Desencadena correos de bienvenida, recordatorios y entrega de certificados sin intervención manual.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAiMode("guided")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${aiMode === "guided"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              <RefreshCw className="size-3" />
              <span>Modo guiado</span>
            </button>

            <button
              onClick={() => setAiMode("custom")}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${aiMode === "custom"
                  ? "bg-violet-600 text-white shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
            >
              <Edit3 className="size-3" />
              <span>Escribir el tuyo</span>
            </button>
          </div>
        </div>

        {aiMode === "guided" ? (
          <div className="rounded-2xl border border-border/80 bg-card p-5 text-xs sm:text-sm text-center leading-relaxed shadow-2xs">
            <span className="text-muted-foreground">Crear una automatización que </span>
            <button
              onClick={() =>
                setPromptVerb(promptVerb === "envíe" ? "programe" : "envíe")
              }
              className="inline-flex items-center gap-1 px-2.5 py-1 mx-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold hover:bg-violet-500/20 transition-colors"
            >
              <span>{promptVerb}</span>
              <RefreshCw className="size-3" />
            </button>
            <span className="text-muted-foreground">un mensaje a través del </span>
            <select
              value={promptChannel}
              onChange={(e) => setPromptChannel(e.target.value)}
              className="inline-block px-2.5 py-1 mx-1 rounded-lg bg-muted border border-border font-semibold text-foreground text-xs focus:outline-none cursor-pointer"
            >
              <option value="Email">canal de Email</option>
              <option value="SMS">canal de SMS</option>
              <option value="WhatsApp">canal de WhatsApp</option>
            </select>
            <span className="text-muted-foreground">cuando </span>
            <select
              value={promptEvent}
              onChange={(e) => setPromptEvent(e.target.value)}
              className="inline-block px-2.5 py-1 mx-1 rounded-lg bg-muted border border-border font-semibold text-foreground text-xs focus:outline-none cursor-pointer"
            >
              <option value="se registre a un evento">un usuario se registre al evento</option>
              <option value="falten 24 horas para el evento">falten 24 horas para el congreso</option>
              <option value="se emita su certificado oficial">se apruebe y emita su certificado</option>
            </select>
          </div>
        ) : (
          <div className="space-y-2">
            <textarea
              rows={2}
              placeholder="Ej: Enviar un correo de bienvenida automático con los accesos cuando alguien pague su inscripción..."
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full rounded-2xl border border-border bg-card p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOpenCreateModal(true)}
            className="rounded-xl text-xs h-9 px-4 font-semibold"
          >
            <Plus className="size-3.5 mr-1" />
            Crear manual desde cero
          </Button>

          <Button
            onClick={handleAiGenerate}
            className="rounded-xl px-5 h-9 font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex items-center gap-2 text-xs"
          >
            <Zap className="size-3.5" />
            <span>Crear automatización con IA</span>
            <ArrowRight className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* List of Automations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-foreground">
            Automatizaciones activas ({automations.length})
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {automations.map((item) => {
            const trig = getTriggerDetails(item.trigger)
            const TriggerIcon = trig.icon

            return (
              <div
                key={item.id}
                className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 hover:border-violet-500/40"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${trig.color}`}>
                      <TriggerIcon className="size-3.5" />
                      <span>{trig.label}</span>
                    </div>

                    <Badge
                      variant={item.active ? "default" : "secondary"}
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${item.active
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0"
                          : "bg-muted text-muted-foreground"
                        }`}
                    >
                      {item.active ? "Activa" : "Pausada"}
                    </Badge>
                  </div>

                  <h4 className="font-bold text-sm text-foreground">{item.name}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Canal: <span className="font-semibold text-foreground">{item.channel || "Email"}</span> • Disparador instantáneo para nuevos inscritos.
                  </p>
                </div>

                <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="font-medium">
                    {item.sentCount || 0} envíos procesados
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toast.success(`Estado de "${item.name}" actualizado`)}
                    className="rounded-lg h-7 px-2.5 text-[11px]"
                  >
                    {item.active ? (
                      <>
                        <Pause className="mr-1 size-3 text-amber-500" />
                        Pausar
                      </>
                    ) : (
                      <>
                        <Play className="mr-1 size-3 text-emerald-500" />
                        Reanudar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Manual Create Modal */}
      <Dialog open={openCreateModal} onOpenChange={setOpenCreateModal}>
        <DialogContent className="sm:max-w-[520px] p-6 rounded-3xl border-border bg-card">
          <DialogHeader className="space-y-1 text-left pb-2">
            <DialogTitle className="text-xl font-bold text-foreground">
              Nueva automatización
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Configura las condiciones de disparo y canales de notificación.
            </p>
          </DialogHeader>

          <form onSubmit={handleCreateNew} className="space-y-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Nombre de la automatización <span className="text-red-500">*</span>
              </label>
              <Input
                required
                placeholder="Ej: Bienvenida e instrucciones de acceso"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Disparador (Trigger)
              </label>
              <select
                value={trigger}
                onChange={(e) => setTrigger(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-background px-3 h-10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                <option value="REGISTRATION">Al registrarse o comprar ticket</option>
                <option value="EVENT_REMINDER">Recordatorio 24h antes del inicio</option>
                <option value="EVENT_ATTENDED">Después de confirmar asistencia</option>
                <option value="CERTIFICATE_ISSUED">Al emitirse su certificado</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Canal de entrega
              </label>
              <select
                value={channel}
                onChange={(e) => setChannel(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-background px-3 h-10 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 cursor-pointer"
              >
                <option value="EMAIL">Correo Electrónico (Email)</option>
                <option value="SMS">Mensaje de Texto (SMS)</option>
                <option value="WHATSAPP">WhatsApp Business</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenCreateModal(false)}
                className="rounded-full text-xs h-9 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-full text-xs h-9 px-5 bg-neutral-900 text-white dark:bg-primary dark:text-primary-foreground font-semibold"
              >
                Crear automatización
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
