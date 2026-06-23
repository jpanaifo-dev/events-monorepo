import { useParams, useNavigate } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { Plus, Trash2, UserCheck, Check, ExternalLink } from "lucide-react"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"
import { Button } from "@/components/ui/button"
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
import { PageHeader } from "@/components/page-header"

export function EventAttendeesSection() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { events, editions, attendees, toggleAttendeeCheckIn, deleteAttendee } = useEventStore()

  const event = events.find((e) => e.id === id)
  const eventAttendees = attendees.filter((at) => at.eventId === id)
  const eventEditions = editions.filter((ed) => ed.mainEventId === id)

  useSEO({
    title: event ? `${event.name} - Participantes` : "Participantes de Evento",
    description: `Administración de la lista de asistentes inscritos, entradas de cortesía, VIP, generales y control de asistencia (check-in) para el evento ${event?.name || ""}.`
  })


  const columns: ColumnDef<any>[] = [
    {
      header: "Participante",
      className: "p-3",
      headerClassName: "p-3",
      cell: (at) => {
        const avatarUrl = at.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(at.fullName || "User")}`
        return (
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={avatarUrl}
                alt={at.fullName}
                className="size-9 rounded-full border border-border/80 object-cover bg-muted shadow-xs"
              />
              {(!at.email || !at.identityDocumentNumber) && (
                <span
                  className="absolute -top-0.5 -right-0.5 size-3.5 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-background shadow-xs select-none cursor-help animate-pulse"
                  title={
                    !at.email && !at.identityDocumentNumber
                      ? "Falta registrar correo electrónico y número de documento"
                      : !at.email
                      ? "Falta registrar correo electrónico"
                      : "Falta registrar número de documento"
                  }
                >
                  !
                </span>
              )}
            </div>
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-foreground truncate">{at.fullName || "Participante"}</h4>
              {at.email ? (
                <p className="text-xs text-muted-foreground truncate">{at.email}</p>
              ) : (
                <p className="text-xs text-amber-500 italic truncate">Sin correo registrado</p>
              )}
            </div>
          </div>
        )
      }
    },
    {
      header: "Ticket",
      className: "p-3",
      headerClassName: "p-3",
      cell: (at) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${at.ticketType === "VIP" ? "bg-amber-500/10 text-amber-600" : at.ticketType === "Speaker" ? "bg-indigo-500/10 text-indigo-600" : "bg-muted text-muted-foreground"}`}>
          {at.ticketType}
        </span>
      )
    },
    {
      header: "Edición",
      className: "p-3 text-xs",
      headerClassName: "p-3",
      cell: (at) => {
        const ed = eventEditions.find((e) => e.id === at.editionId)
        return ed ? (
          <span className="font-medium text-foreground">
            {ed.name}
          </span>
        ) : (
          <span className="text-muted-foreground italic text-[11px]">Global (Todas)</span>
        )
      }
    },
    {
      header: "Check-In",
      className: "p-3 text-center",
      headerClassName: "p-3 text-center",
      cell: (at) => (
        <button
          onClick={() => toggleAttendeeCheckIn(at.id)}
          className={`p-1.5 rounded-full border transition-colors inline-flex ${at.checkedIn ? "bg-primary/10 border-primary/30 text-primary" : "bg-muted/40 border-border/80 text-muted-foreground/60 hover:text-foreground"}`}
        >
          {at.checkedIn ? <UserCheck className="size-4" /> : <Check className="size-4" />}
        </button>
      )
    },
    {
      header: "Acciones",
      headerClassName: "text-right p-3",
      className: "text-right p-3",
      cell: (at) => (
        <div className="flex items-center justify-end gap-1.5">
          {at.profileId && (
            <Button
              asChild
              variant="ghost"
              className="size-7 p-0 text-muted-foreground hover:text-foreground"
              title="Gestionar Perfil Completo"
            >
              <a
                href={`/dashboard/profiles/${at.profileId}/info`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full h-full"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </Button>
          )}
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
        </div>
      )
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <PageHeader
        title="Participantes"
        description="Gestiona y acredita a los asistentes registrados en el evento."
        actionButton={
          <Button onClick={() => navigate("new")} className="text-xs px-3 py-1.5 h-8">
            <Plus className="size-4 mr-1.5" />
            Inscribir Participante
          </Button>
        }
      />

      {eventAttendees.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No hay participantes inscritos.
        </div>
      ) : (
        <DataTable columns={columns} data={eventAttendees} containerClassName="border border-border rounded-xl" />
      )}
    </div>
  )
}
