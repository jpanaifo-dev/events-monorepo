import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send, Calendar, Clock, Sparkles } from "lucide-react"

interface ScheduleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipientCount: number
  onSendNow: () => void
  onSchedule: (datetime: string) => void
}

export function ScheduleModal({
  open,
  onOpenChange,
  recipientCount,
  onSendNow,
  onSchedule,
}: ScheduleModalProps) {
  const [mode, setMode] = useState<"now" | "later">("now")
  const [date, setDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  )
  const [time, setTime] = useState("09:00")

  const handleConfirm = () => {
    if (mode === "now") {
      onSendNow()
    } else {
      onSchedule(`${date}T${time}:00`)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl border-border bg-card">
        <DialogHeader className="space-y-1 text-left pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            Lanzamiento de campaña
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Esta campaña se enviará a un total de {recipientCount} destinatarios seleccionados.
          </p>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setMode("now")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center gap-2 ${
                mode === "now"
                  ? "border-violet-600 bg-violet-50/20 dark:bg-violet-950/20 ring-1 ring-violet-600/30"
                  : "border-border/80 hover:border-border bg-background"
              }`}
            >
              <div className="size-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <Send className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Enviar ahora</h4>
                <p className="text-[10px] text-muted-foreground">Comienza el despacho de inmediato</p>
              </div>
            </div>

            <div
              onClick={() => setMode("later")}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col items-center text-center gap-2 ${
                mode === "later"
                  ? "border-violet-600 bg-violet-50/20 dark:bg-violet-950/20 ring-1 ring-violet-600/30"
                  : "border-border/80 hover:border-border bg-background"
              }`}
            >
              <div className="size-10 rounded-xl bg-violet-500/10 text-violet-600 flex items-center justify-center">
                <Calendar className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Programar envío</h4>
                <p className="text-[10px] text-muted-foreground">Elige fecha y mejor hora</p>
              </div>
            </div>
          </div>

          {mode === "later" && (
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-muted/40 border border-border/50">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Calendar className="size-3 text-muted-foreground" />
                  Fecha de envío
                </label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <Clock className="size-3 text-muted-foreground" />
                  Hora (Zona local)
                </label>
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="rounded-full text-xs h-9 px-4"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              className="rounded-full text-xs h-9 px-6 bg-neutral-900 text-white dark:bg-primary dark:text-primary-foreground font-semibold"
            >
              {mode === "now" ? "Confirmar y enviar" : "Programar campaña"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
