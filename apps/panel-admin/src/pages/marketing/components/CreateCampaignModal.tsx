import { useState } from "react"
import {
  Mail,
  MessageSquare,
  Smartphone,
  Bell,
  PanelTop,
  Crown,
  Sparkles,
  RefreshCw,
  Edit3,
  ArrowRight,
  Zap,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface CreateCampaignModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectStandardEmail: () => void
  onSelectAutomation: (automationConfig: any) => void
}

export function CreateCampaignModal({
  open,
  onOpenChange,
  onSelectStandardEmail,
  onSelectAutomation,
}: CreateCampaignModalProps) {
  const [automationMode, setAutomationMode] = useState<"guided" | "custom">("guided")
  const [actionVerb, setActionVerb] = useState("envíe")
  const [channel, setChannel] = useState("Email")
  const [triggerCondition, setTriggerCondition] = useState("se registre a un evento")
  const [customPrompt, setCustomPrompt] = useState("")

  const channelsList = [
    {
      id: "email",
      label: "Email",
      description: "Mensajes HTML enriquecidos",
      icon: Mail,
      isPro: false,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      activeColor: "border-violet-600 bg-violet-50/20 ring-2 ring-violet-600/30",
    },
    {
      id: "sms",
      label: "SMS",
      description: "Mensajes de texto directos",
      icon: Smartphone,
      isPro: false,
      color: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      description: "Plantillas oficiales Meta",
      icon: MessageSquare,
      isPro: true,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
    {
      id: "push",
      label: "Push",
      description: "Notificaciones del navegador",
      icon: Bell,
      isPro: true,
      color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
    },
    {
      id: "popup",
      label: "Ventana emergente",
      description: "Popups en tu landing",
      icon: PanelTop,
      isPro: true,
      color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    },
  ]

  const handleStandardClick = (channelId: string) => {
    if (channelId === "email") {
      onOpenChange(false)
      onSelectStandardEmail()
    } else if (channelId === "sms") {
      toast.info("Configuración de SMS disponible próximamente.")
    } else {
      toast.info(`El canal ${channelId.toUpperCase()} está disponible en el plan Pro.`)
    }
  }

  const handleGenerateAutomation = () => {
    const config = {
      name:
        automationMode === "guided"
          ? `Auto ${channel}: Cuando ${triggerCondition}`
          : customPrompt || "Automatización personalizada",
      action: actionVerb,
      channel,
      trigger: triggerCondition,
      mode: automationMode,
    }
    onOpenChange(false)
    onSelectAutomation(config)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[760px] p-8 rounded-3xl border-border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-1 text-left pb-2">
          <DialogTitle className="text-2xl font-bold text-foreground tracking-tight">
            Crear una campaña
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-7 pt-2">
          {/* Section 1: Estándar (Matches Reference Image 3) */}
          <div className="space-y-3">
            <div>
              <h3 className="text-base font-bold text-foreground">Estándar</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Crear una campaña individualizada desde cero.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {channelsList.map((item) => {
                const Icon = item.icon
                const isEmail = item.id === "email"

                return (
                  <button
                    key={item.id}
                    onClick={() => handleStandardClick(item.id)}
                    className={`group relative flex flex-col items-center justify-between p-4 rounded-2xl border transition-all text-center hover:scale-[1.02] hover:shadow-md cursor-pointer ${
                      isEmail
                        ? "border-violet-500/50 bg-violet-50/10 dark:bg-violet-950/20 ring-1 ring-violet-500/30"
                        : "border-border/80 bg-background/60 hover:border-border hover:bg-card"
                    }`}
                  >
                    <div className="size-12 rounded-2xl bg-muted/70 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Icon className="size-6 text-foreground/80" />
                    </div>

                    <div className="flex items-center justify-center gap-1">
                      <span className="text-xs font-semibold text-foreground">
                        {item.label}
                      </span>
                      {item.isPro && (
                        <Crown className="size-3 text-amber-500 fill-amber-500 shrink-0" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Automatizada (Matches Reference Image 3) */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-foreground">Automatizada</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Crea una automatización desde cero, obtén asistencia de nuestra IA, o elige una de nuestras automatizaciones predefinidas.
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onOpenChange(false)
                  onSelectAutomation({ name: "Automatización desde cero", trigger: "REGISTRATION" })
                }}
                className="rounded-xl h-8 px-3 text-xs font-semibold shrink-0 border-border text-foreground hover:bg-muted"
              >
                Crear desde cero
              </Button>
            </div>

            {/* Interactive Prompt Card */}
            <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-500/5 via-background to-background p-6 space-y-4 shadow-sm">
              <div className="text-center space-y-3">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 text-xs font-semibold">
                  <Sparkles className="size-3.5" />
                  <span>Empieza con una frase y crearemos tu automatización</span>
                </div>

                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    onClick={() => setAutomationMode("guided")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      automationMode === "guided"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <RefreshCw className="size-3" />
                    <span>Modo guiado</span>
                  </button>

                  <button
                    onClick={() => setAutomationMode("custom")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      automationMode === "custom"
                        ? "bg-violet-600 text-white shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Edit3 className="size-3" />
                    <span>Escribir el tuyo</span>
                  </button>
                </div>
              </div>

              {automationMode === "guided" ? (
                <div className="rounded-xl border border-border/80 bg-background/90 p-4 text-sm text-center leading-relaxed">
                  <span className="text-muted-foreground">Crear una automatización que </span>
                  <button
                    onClick={() =>
                      setActionVerb(actionVerb === "envíe" ? "programe" : actionVerb === "programe" ? "notifique" : "envíe")
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 mx-1 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold hover:bg-violet-500/20 transition-colors"
                  >
                    <span>{actionVerb}</span>
                    <RefreshCw className="size-3" />
                  </button>
                  <span className="text-muted-foreground">un mensaje a través del </span>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="inline-block px-2.5 py-1 mx-1 rounded-lg bg-muted border border-border font-semibold text-foreground text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="Email">canal de Email</option>
                    <option value="SMS">canal de SMS</option>
                    <option value="WhatsApp">canal de WhatsApp</option>
                  </select>
                  <span className="text-muted-foreground">cuando </span>
                  <select
                    value={triggerCondition}
                    onChange={(e) => setTriggerCondition(e.target.value)}
                    className="inline-block px-2.5 py-1 mx-1 rounded-lg bg-muted border border-border font-semibold text-foreground text-xs focus:outline-none cursor-pointer"
                  >
                    <option value="se registre a un evento">un usuario se registre a un evento</option>
                    <option value="falten 24 horas para el evento">falten 24 horas para iniciar el evento</option>
                    <option value="asista a la conferencia">el participante confirme su asistencia</option>
                    <option value="se emita su certificado">se genere su certificado oficial</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Ej: Enviar un recordatorio por correo y SMS 2 horas antes de que comience el taller..."
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
                  />
                </div>
              )}

              <div className="flex justify-end pt-1">
                <Button
                  onClick={handleGenerateAutomation}
                  className="rounded-xl px-5 h-9 font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm flex items-center gap-2 text-xs"
                >
                  <Zap className="size-3.5" />
                  <span>Generar automatización</span>
                  <ArrowRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
