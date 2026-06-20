import { useState } from "react"
import { useParams } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { Plus, Trash2, UserCheck, Check } from "lucide-react"
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

import { useSEO } from "@/hooks/use-seo"

export function EventAttendeesSection() {
  const { id } = useParams<{ id: string }>()
  const { events, attendees, addAttendee, toggleAttendeeCheckIn, deleteAttendee } = useEventStore()

  const event = events.find((e) => e.id === id)
  const eventAttendees = attendees.filter((at) => at.eventId === id)

  useSEO({
    title: event ? `${event.name} - Participantes` : "Participantes de Evento",
    description: `Administración de la lista de asistentes inscritos, entradas de cortesía, VIP, generales y control de asistencia (check-in) para el evento ${event?.name || ""}.`
  })
  const checkedInCount = eventAttendees.filter((a) => a.checkedIn).length
  const vipCount = eventAttendees.filter((a) => a.ticketType === "VIP").length
  const attendanceRate = eventAttendees.length > 0 ? Math.round((checkedInCount / eventAttendees.length) * 100) : 0

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [ticket, setTicket] = useState<"General" | "VIP" | "Speaker">("General")

  const closeSheet = () => {
    setIsSheetOpen(false)
    setName("")
    setEmail("")
    setTicket("General")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await addAttendee({
      eventId: id!,
      fullName: name,
      email,
      ticketType: ticket,
      registrationDate: new Date().toISOString().split("T")[0],
      checkedIn: false,
    })
    closeSheet()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-lg font-bold">Participantes</h3>
        <Button onClick={() => setIsSheetOpen(true)} className="text-xs px-3 py-1.5 h-8">
          <Plus className="size-4 mr-1.5" />
          Inscribir Participante
        </Button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/40 border border-border/80 rounded-xl text-center">
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Registrados</p>
          <p className="text-xl font-bold">{eventAttendees.length}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">VIP</p>
          <p className="text-xl font-bold text-amber-600">{vipCount}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Check-in</p>
          <p className="text-xl font-bold text-primary">{attendanceRate}%</p>
        </div>
      </div>

      {eventAttendees.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No hay participantes inscritos.
        </div>
      ) : (
        <div className="overflow-x-auto border border-border rounded-xl">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-muted/60 text-xs font-bold text-muted-foreground border-b border-border uppercase">
                <th className="p-3">Nombre</th>
                <th className="p-3">Correo</th>
                <th className="p-3">Ticket</th>
                <th className="p-3 text-center">Check-In</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {eventAttendees.map((at) => (
                <tr key={at.id} className="hover:bg-muted/10 transition-colors">
                  <td className="p-3 font-semibold">{at.fullName}</td>
                  <td className="p-3 text-xs text-muted-foreground">{at.email}</td>
                  <td className="p-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${at.ticketType === "VIP" ? "bg-amber-500/10 text-amber-600" : at.ticketType === "Speaker" ? "bg-indigo-500/10 text-indigo-600" : "bg-muted text-muted-foreground"}`}>
                      {at.ticketType}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => toggleAttendeeCheckIn(at.id)}
                      className={`p-1.5 rounded-full border transition-colors inline-flex ${at.checkedIn ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/40 border-border/80 text-muted-foreground/60 hover:text-foreground"}`}
                    >
                      {at.checkedIn ? <UserCheck className="size-4" /> : <Check className="size-4" />}
                    </button>
                  </td>
                  <td className="p-3 text-right">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" className="size-7 p-0 text-destructive hover:bg-destructive/10">
                          <Trash2 className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar participante?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará permanentemente "{at.fullName}". Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteAttendee(at.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Sí, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Sheet Create */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Inscribir Participante</SheetTitle>
            <SheetDescription>Datos del boleto del asistente.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4 px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="atName">Nombre Completo</FieldLabel>
                <Input id="atName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Jefferson Santos" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="atEmail">Correo Electrónico</FieldLabel>
                <Input id="atEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jefferson@example.com" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="atTicket">Tipo de Entrada</FieldLabel>
                <select
                  id="atTicket"
                  value={ticket}
                  onChange={(e) => setTicket(e.target.value as "General" | "VIP" | "Speaker")}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm outline-none"
                >
                  <option value="General">General</option>
                  <option value="VIP">VIP</option>
                  <option value="Speaker">Ponente</option>
                </select>
              </Field>
            </FieldGroup>
          </form>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={closeSheet}>Cancelar</Button>
            <Button onClick={handleSave} className="font-semibold">Registrar</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
