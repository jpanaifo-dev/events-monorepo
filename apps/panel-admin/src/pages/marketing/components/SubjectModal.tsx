import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sparkles, Smile } from "lucide-react"

interface SubjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSubject: string
  initialPreviewText?: string
  onSave: (data: { subject: string; previewText: string }) => void
}

export function SubjectModal({
  open,
  onOpenChange,
  initialSubject,
  initialPreviewText,
  onSave,
}: SubjectModalProps) {
  const [subject, setSubject] = useState(initialSubject)
  const [previewText, setPreviewText] = useState(initialPreviewText || "")

  const insertVariable = (variable: string) => {
    setSubject((prev) => `${prev} {{${variable}}}`)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ subject, previewText })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] p-6 rounded-3xl border-border bg-card">
        <DialogHeader className="space-y-1 text-left pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            Añadir un asunto
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            El asunto y texto de previsualización determinan la tasa de apertura de tu campaña.
          </p>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Línea de asunto <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Variables:</span>
                <button
                  type="button"
                  onClick={() => insertVariable("nombre")}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-mono font-medium hover:bg-violet-500/20"
                >
                  {`{{nombre}}`}
                </button>
                <button
                  type="button"
                  onClick={() => insertVariable("evento")}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 dark:text-violet-400 font-mono font-medium hover:bg-violet-500/20"
                >
                  {`{{evento}}`}
                </button>
              </div>
            </div>
            <Input
              required
              placeholder="Ej: ¡Últimos días para postular tu resumen en CONIAP 2024!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl h-11 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Texto de vista previa (Pre-header)
              </label>
              <span className="text-[11px] text-muted-foreground">Opcional</span>
            </div>
            <Input
              placeholder="Texto que aparece al lado del asunto en la bandeja de entrada..."
              value={previewText}
              onChange={(e) => setPreviewText(e.target.value)}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/50 space-y-1.5 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-foreground">
              <Sparkles className="size-3.5 text-amber-500" />
              <span>Consejo para mayor impacto:</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Los asuntos entre 35 y 50 caracteres con personalización suelen tener hasta un 26% más de aperturas.
            </p>
          </div>

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
              type="submit"
              disabled={!subject.trim()}
              className="rounded-full text-xs h-9 px-5 bg-neutral-900 text-white dark:bg-primary dark:text-primary-foreground font-semibold"
            >
              Guardar asunto
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
