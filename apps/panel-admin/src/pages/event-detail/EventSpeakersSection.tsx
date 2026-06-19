import { useParams, useNavigate } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { Plus, Edit, Trash2, Mail, Globe, Layers, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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

export function EventSpeakersSection() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { speakers, roles, editions, deleteSpeaker } = useEventStore()

  const eventSpeakers = speakers.filter((sp) => sp.eventId === id)

  const handleAddClick = () => {
    navigate(`/dashboard/events/${id}/speakers/new`)
  }

  const handleEditClick = (speakerId: string) => {
    navigate(`/dashboard/events/${id}/speakers/${speakerId}/edit`)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-lg font-bold">Ponentes</h3>
          <p className="text-xs text-muted-foreground">
            Gestiona los expositores de charlas, conferencias y talleres.
          </p>
        </div>
        <Button onClick={handleAddClick} className="text-xs px-3 py-1.5 h-8">
          <Plus className="size-4 mr-1.5" />
          Agregar Ponente
        </Button>
      </div>

      {/* Speakers List */}
      {eventSpeakers.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/10 space-y-3">
          <BookOpen className="size-8 mx-auto opacity-40 text-primary animate-pulse" />
          <div>
            <p className="font-semibold">No hay ponentes registrados</p>
            <p className="text-xs text-muted-foreground">
              Haz clic en "Agregar Ponente" para registrar al primer conferencista.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {eventSpeakers.map((sp) => {
            const roleObj = roles.find((r) => r.id === sp.roleId)
            const roleName = roleObj?.name.es || (sp.roleSlug === "keynote-speaker" ? "Ponente Magistral" : "Ponente")
            const badgeColor = roleObj?.badgeColor || "#3b82f6"
            const isGlobal = !sp.editionId
            const editionName = isGlobal
              ? ""
              : editions.find((ed) => ed.id === sp.editionId)?.name || "Edición Desconocida"

            const styleBadge = {
              backgroundColor: `${badgeColor}12`,
              color: badgeColor,
              borderColor: `${badgeColor}30`,
            }

            return (
              <div
                key={sp.id}
                className="p-5 bg-card/40 border border-border rounded-xl flex flex-col justify-between hover:border-border/80 hover:bg-card/70 transition-all duration-300 relative group"
              >
                <div className="space-y-4">
                  {/* Top info: Avatar, Name, Email, Roles */}
                  <div className="flex gap-4 items-start">
                    <img
                      src={sp.avatar}
                      alt={sp.name}
                      className="size-12 rounded-full border border-border/80 object-cover bg-muted shrink-0 shadow-xs"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center flex-wrap gap-1.5">
                        <h4 className="font-bold text-sm truncate">{sp.name}</h4>
                        {/* Custom role badge */}
                        <div
                          className="px-2 py-0.5 rounded-md border text-[9px] font-bold font-sans tracking-wide uppercase"
                          style={styleBadge}
                        >
                          {roleName}
                        </div>
                      </div>
                      
                      {/* Email */}
                      {sp.email && (
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Mail className="size-3 shrink-0" />
                          <span className="truncate">{sp.email}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Talk Title & Description */}
                  <div className="space-y-1 bg-muted/10 p-3 rounded-lg border border-border/40">
                    <p className="text-xs font-bold text-foreground leading-snug line-clamp-2">
                      {sp.talkTitle}
                    </p>
                    {sp.talkDescription && (
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {sp.talkDescription}
                      </p>
                    )}
                  </div>

                  {/* Biography (short preview) */}
                  {sp.bio && (
                    <div className="text-[11px] text-muted-foreground leading-normal">
                      <span className="font-semibold text-foreground/80">Bio:</span> {sp.bio}
                    </div>
                  )}
                </div>

                {/* Bottom line: Scope and action buttons */}
                <div className="flex items-center justify-between border-t border-border/60 pt-3 mt-4">
                  {/* Scope badge */}
                  <div className="text-xs flex items-center gap-1.5 text-muted-foreground">
                    {isGlobal ? (
                      <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] gap-1 px-2 py-0.5">
                        <Globe className="size-3" />
                        Todo el evento (Global)
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-primary/20 text-primary text-[10px] gap-1 px-2 py-0.5">
                        <Layers className="size-3" />
                        Edición: {editionName}
                      </Badge>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      onClick={() => handleEditClick(sp.id)}
                      variant="ghost"
                      className="size-8 p-0 hover:bg-muted text-muted-foreground hover:text-foreground"
                    >
                      <Edit className="size-3.5" />
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          className="size-8 p-0 text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Eliminar ponente?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Se eliminará permanentemente a "{sp.name}" y se removerá su vinculación del evento. Esta acción no se puede deshacer.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteSpeaker(sp.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Sí, eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
