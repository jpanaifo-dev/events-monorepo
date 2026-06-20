import { useParams, useNavigate } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { Plus, Edit, Trash2, Globe, Layers, BookOpen } from "lucide-react"
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
        <div className="overflow-x-auto border border-border rounded-xl bg-card/10 backdrop-blur-xs">
          <table className="w-full text-sm text-left border-collapse">
            <thead>
              <tr className="bg-muted/40 text-xs font-bold text-muted-foreground border-b border-border uppercase">
                <th className="p-3">Ponente</th>
                <th className="p-3">Tipo de Ponente</th>
                <th className="p-3">Charla / Taller</th>
                <th className="p-3">Ámbito (Edición)</th>
                <th className="p-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
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
                  <tr key={sp.id} className="hover:bg-muted/5 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={sp.avatar}
                          alt={sp.name}
                          className="size-10 rounded-full border border-border/80 object-cover bg-muted shrink-0 shadow-xs"
                        />
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-foreground truncate">{sp.name}</h4>
                          {sp.email && (
                            <p className="text-xs text-muted-foreground truncate">{sp.email}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div
                        className="inline-flex px-2 py-0.5 rounded-md border text-[10px] font-bold font-sans tracking-wide uppercase"
                        style={styleBadge}
                      >
                        {roleName}
                      </div>
                    </td>
                    <td className="p-3 max-w-[280px]">
                      <div className="space-y-0.5">
                        <p className="text-xs font-bold text-foreground leading-snug truncate" title={sp.talkTitle}>
                          {sp.talkTitle}
                        </p>
                        {sp.talkDescription && (
                          <p className="text-[11px] text-muted-foreground truncate" title={sp.talkDescription}>
                            {sp.talkDescription}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      {isGlobal ? (
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px] gap-1 px-2 py-0.5">
                          <Globe className="size-3" />
                          Global
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-primary/20 text-primary text-[10px] gap-1 px-2 py-0.5">
                          <Layers className="size-3" />
                          {editionName}
                        </Badge>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
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
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
