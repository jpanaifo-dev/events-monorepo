import { useState } from "react"
import { useParams } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import type { Speaker } from "@/store/event.store"
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

export function EventSpeakersSection() {
  const { id } = useParams<{ id: string }>()
  const { speakers, addSpeaker, updateSpeaker, deleteSpeaker } = useEventStore()

  const eventSpeakers = speakers.filter((sp) => sp.eventId === id)

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState("")
  const [avatar, setAvatar] = useState("")
  const [talkTitle, setTalkTitle] = useState("")
  const [talkDesc, setTalkDesc] = useState("")
  const [bio, setBio] = useState("")

  const openCreate = () => {
    setEditingId(null)
    setName("")
    setAvatar("")
    setTalkTitle("")
    setTalkDesc("")
    setBio("")
    setIsSheetOpen(true)
  }

  const openEdit = (sp: Speaker) => {
    setEditingId(sp.id)
    setName(sp.name)
    setAvatar(sp.avatar)
    setTalkTitle(sp.talkTitle)
    setTalkDesc(sp.talkDescription)
    setBio(sp.bio)
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setEditingId(null)
    setName("")
    setAvatar("")
    setTalkTitle("")
    setTalkDesc("")
    setBio("")
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const defaultAvatar = avatar.trim() || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`

    if (editingId) {
      await updateSpeaker(editingId, {
        name,
        avatar: defaultAvatar,
        talkTitle,
        talkDescription: talkDesc,
        bio,
      })
    } else {
      await addSpeaker({
        eventId: id!,
        name,
        avatar: defaultAvatar,
        talkTitle,
        talkDescription: talkDesc,
        bio,
      })
    }
    closeSheet()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-lg font-bold">Ponentes</h3>
        <Button onClick={openCreate} className="text-xs px-3 py-1.5 h-8">
          <Plus className="size-4 mr-1.5" />
          Agregar Ponente
        </Button>
      </div>

      {eventSpeakers.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm border border-dashed border-border rounded-lg">
          No hay ponentes registrados.
        </div>
      ) : (
        <div className="space-y-3">
          {eventSpeakers.map((sp) => (
            <div key={sp.id} className="flex items-center gap-4 p-4 bg-background border border-border rounded-lg group">
              <img src={sp.avatar} alt={sp.name} className="size-10 rounded-full bg-muted object-cover shrink-0" />

              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm truncate">{sp.name}</h4>
                <p className="text-[11px] text-muted-foreground truncate">{sp.talkTitle}</p>
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button onClick={() => openEdit(sp)} variant="ghost" className="size-7 p-0">
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
                      <AlertDialogTitle>¿Eliminar ponente?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Se eliminará permanentemente "{sp.name}". Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deleteSpeaker(sp.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Sí, eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Sheet Create/Edit */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Ponente" : "Agregar Ponente"}</SheetTitle>
            <SheetDescription>Datos del expositor y su ponencia.</SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-4 px-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="spName">Nombre</FieldLabel>
                <Input id="spName" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Dr. Alex Rivera" required />
              </Field>
              <Field>
                <FieldLabel htmlFor="spAvatar">URL de Avatar (Opcional)</FieldLabel>
                <Input id="spAvatar" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://..." />
              </Field>
              <Field>
                <FieldLabel htmlFor="spBio">Biografía</FieldLabel>
                <Input id="spBio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Institución, experiencia..." required />
              </Field>
              <Field>
                <FieldLabel htmlFor="spTalk">Título de la Charla</FieldLabel>
                <Input id="spTalk" value={talkTitle} onChange={(e) => setTalkTitle(e.target.value)} required />
              </Field>
              <Field>
                <FieldLabel htmlFor="spDesc">Resumen</FieldLabel>
                <textarea
                  id="spDesc"
                  value={talkDesc}
                  onChange={(e) => setTalkDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
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
