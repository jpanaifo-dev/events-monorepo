import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface SenderModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialName: string
  initialEmail: string
  initialReplyTo?: string
  onSave: (data: { senderName: string; senderEmail: string; replyTo?: string }) => void
}

export function SenderModal({
  open,
  onOpenChange,
  initialName,
  initialEmail,
  initialReplyTo,
  onSave,
}: SenderModalProps) {
  const [senderName, setSenderName] = useState(initialName)
  const [senderEmail, setSenderEmail] = useState(initialEmail)
  const [replyTo, setReplyTo] = useState(initialReplyTo || initialEmail)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({ senderName, senderEmail, replyTo })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] p-6 rounded-3xl border-border bg-card">
        <DialogHeader className="space-y-1 text-left pb-2">
          <DialogTitle className="text-xl font-bold text-foreground">
            Gestionar remitente
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Configura el nombre y la dirección de correo que verán tus destinatarios.
          </p>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Nombre del remitente <span className="text-red-500">*</span>
            </label>
            <Input
              required
              placeholder="Ej: IIAP Conferencia"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Correo del remitente <span className="text-red-500">*</span>
            </label>
            <Input
              required
              type="email"
              placeholder="ejemplo@organizacion.com"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              className="rounded-xl h-10 text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-foreground">
              Responder a (Reply-to)
            </label>
            <Input
              type="email"
              placeholder="respuestas@organizacion.com"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
              className="rounded-xl h-10 text-xs"
            />
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
              className="rounded-full text-xs h-9 px-5 bg-neutral-900 text-white dark:bg-primary dark:text-primary-foreground font-semibold"
            >
              Guardar cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
