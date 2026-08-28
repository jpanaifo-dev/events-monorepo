import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Monitor, Smartphone, Send } from "lucide-react"
import { toast } from "sonner"

interface PreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subject: string
  previewText?: string
  senderName: string
  senderEmail: string
  content?: string
}

export function PreviewModal({
  open,
  onOpenChange,
  subject,
  previewText,
  senderName,
  senderEmail,
}: PreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[780px] p-6 rounded-3xl border-border bg-card max-h-[92vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40 space-y-0">
          <div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Vista previa y prueba
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Comprueba cómo se visualizará tu campaña en clientes de correo.
            </p>
          </div>

          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl">
            <button
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded-lg transition-colors ${device === "desktop"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
                }`}
              title="Vista de escritorio"
            >
              <Monitor className="size-4" />
            </button>
            <button
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded-lg transition-colors ${device === "mobile"
                ? "bg-background text-foreground shadow-2xs font-bold"
                : "text-muted-foreground hover:text-foreground"
                }`}
              title="Vista móvil"
            >
              <Smartphone className="size-4" />
            </button>
          </div>
        </DialogHeader>

        {/* Email Header Preview Info */}
        <div className="p-3 bg-muted/40 rounded-2xl border border-border/50 text-xs space-y-1.5 my-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">De:</span>
            <span className="font-semibold text-foreground">
              {senderName || "Organización"} &lt;{senderEmail || "marketing@evento.com"}&gt;
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground font-medium">Asunto:</span>
            <span className="font-bold text-foreground">{subject || "Sin asunto"}</span>
          </div>
          {previewText && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground font-medium">Pre-header:</span>
              <span className="text-muted-foreground italic">{previewText}</span>
            </div>
          )}
        </div>

        {/* Render Preview Container */}
        <div className="flex-1 overflow-y-auto flex items-center justify-center p-4 bg-neutral-100 dark:bg-neutral-900/60 rounded-2xl min-h-[360px]">
          <div
            className={`bg-white text-neutral-900 rounded-2xl shadow-md border border-neutral-200 overflow-hidden transition-all duration-300 ${device === "desktop" ? "w-full max-w-[620px]" : "w-[360px]"
              }`}
          >
            {/* Mock Header banner */}
            <div className="bg-gradient-to-r from-violet-700 to-indigo-800 p-6 text-white text-center">
              <h2 className="text-xl font-bold tracking-tight">CONIAP 2024</h2>
              <p className="text-xs text-violet-200 mt-1">
                III Congreso Internacional Sobre Amazonía Peruana
              </p>
            </div>

            {/* Email Body */}
            <div className="p-6 space-y-4 text-xs leading-relaxed text-neutral-800">
              <p className="font-semibold text-sm">Estimado/a Participante,</p>

              <p>
                Nos complace informarte que el plazo para el envío y postulación de resúmenes de ponencias y pósters ha sido ampliado.
              </p>

              <div className="p-4 bg-violet-50 rounded-xl border border-violet-200/80 text-violet-900 space-y-1">
                <p className="font-bold">Nueva fecha límite:</p>
                <p className="text-sm font-black">15 de Octubre de 2024 - 23:59 (GMT-5)</p>
              </div>

              <p>
                Aprovecha esta oportunidad para formar parte del programa científico y compartir tus investigaciones con la comunidad científica internacional.
              </p>

              <div className="pt-2 text-center">
                <a
                  href="#submit"
                  onClick={(e) => e.preventDefault()}
                  className="inline-block px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Enviar mi resumen ahora
                </a>
              </div>

              <div className="pt-6 border-t border-neutral-200 text-center text-[10px] text-neutral-500 space-y-1">
                <p>Instituto de Investigaciones de la Amazonía Peruana - IIAP</p>
                <p>Si no deseas recibir más avisos de este congreso, puedes <span className="underline cursor-pointer">cancelar tu suscripción</span>.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer with test send */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => toast.success(`Email de prueba enviado a ${senderEmail}`)}
            className="rounded-full text-xs h-8 px-3.5 flex items-center gap-1.5"
          >
            <Send className="size-3 text-muted-foreground" />
            <span>Enviar prueba a mi correo</span>
          </Button>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs h-8 px-5 bg-neutral-900 text-white dark:bg-primary dark:text-primary-foreground font-semibold"
          >
            Listo
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
