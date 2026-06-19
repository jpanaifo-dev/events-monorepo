import { useState } from "react"
import { useParams } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import type { AgendaItem } from "@/store/event.store"
import { Plus, Edit2, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

export function EventAgendaSection() {
  const { id } = useParams<{ id: string }>()
  const { agendaItems, speakers, addAgendaItem, updateAgendaItem, deleteAgendaItem } = useEventStore()

  const eventAgenda = agendaItems.filter((ag) => ag.eventId === id)
  const eventSpeakers = speakers.filter((sp) => sp.eventId === id)

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [timeSlot, setTimeSlot] = useState("")
  const [title, setTitle] = useState("")
  const [stage, setStage] = useState("")
  const [speakerId, setSpeakerId] = useState("")

  const openCreate = () => {
    setEditingId(null)
    setTimeSlot("")
    setTitle("")
    setStage("")
    setSpeakerId("")
    setIsSheetOpen(true)
  }

  const openEdit = (item: AgendaItem) => {
    setEditingId(item.id)
    setTimeSlot(item.timeSlot)
    setTitle(item.title)
    setStage(item.stage)
    setSpeakerId(item.speakerId)
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setEditingId(null)
    setTimeSlot("")
    setTitle("")
    setStage("")
    setSpeakerId("")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateAgendaItem(editingId, { timeSlot, title, stage, speakerId })
    } else {
      await addAgendaItem({ eventId: id!, timeSlot, title, stage, speakerId })
    }
    closeSheet()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-lg font-bold">Agenda</h3>
        <Button onClick={openCreate} className="text-xs px-3 py-1.5 h-8">
          <Plus className="size-4 mr-1.5" />
          Nueva Sesión
        </Button>
      </div>

      {eventAgenda.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No hay sesiones programadas.
        </div>
      ) : (
        <div className="relative border-l-2 border-border ml-3 pl-6 space-y-4 py-2">
          {eventAgenda.map((item) => {
            const sp = eventSpeakers.find((s) => s.id === item.speakerId)
            return (
              <div key={item.id} className="relative group bg-background border border-border p-4 rounded-lg">
                <span className="absolute -left-[31px] top-5 size-3 bg-primary rounded-full border-[3px] border-card" />

                <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button onClick={() => openEdit(item)} variant="ghost" className="size-7 p-0">
                    <Edit2 className="size-3.5" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="size-7 p-0 text-destructive hover:bg-destructive/10">
                        <Trash2 className="size-3.5" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>¿Eliminar sesión?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Se eliminará permanentemente "{item.title}". Esta acción no se puede deshacer.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteAgendaItem(item.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Sí, eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <span className="text-primary">{item.timeSlot}</span>
                    <span>•</span>
                    <span className="bg-muted px-2 py-0.5 rounded-md">{item.stage}</span>
                  </div>
                  <h4 className="font-bold text-sm">{item.title}</h4>
                  {sp && (
                    <p className="text-[11px] text-muted-foreground">{sp.name}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Sheet Create/Edit */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Sesión" : "Nueva Sesión"}</SheetTitle>
            <SheetDescription>Define el horario, título y expositor.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4 px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="agTime">Horario</FieldLabel>
                <Input id="agTime" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} placeholder="09:00 - 10:00" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="agTitle">Título</FieldLabel>
                <Input id="agTitle" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Keynote Apertura" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="agStage">Escenario</FieldLabel>
                <Input id="agStage" value={stage} onChange={(e) => setStage(e.target.value)} placeholder="Main Stage" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="agSpeaker">Expositor</FieldLabel>
                <select
                  id="agSpeaker"
                  value={speakerId}
                  onChange={(e) => setSpeakerId(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none"
                >
                  <option value="">Sin expositor</option>
                  {eventSpeakers.map((sp) => (
                    <option key={sp.id} value={sp.id}>{sp.name}</option>
                  ))}
                </select>
              </Field>
            </FieldGroup>
          </form>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={closeSheet}>Cancelar</Button>
            <Button onClick={handleSave} className="font-semibold">Guardar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
