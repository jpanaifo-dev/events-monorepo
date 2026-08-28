import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { api } from "@/api/client"
import { useEventStore } from "@/store/event.store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/page-header"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet"

export function EventFormsSection() {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate(); const { editions } = useEventStore(); const [forms, setForms] = useState<any[]>([]); const [open, setOpen] = useState(false); const [title, setTitle] = useState(""); const [slug, setSlug] = useState(""); const [editionId, setEditionId] = useState(""); const eventEditions = editions.filter((edition) => edition.mainEventId === id)
  const load = () => id && api.registrationForms.list(id).then(setForms).catch((error) => toast.error(error.message))
  useEffect(() => { load() }, [id])
  const create = async () => { if (!title || !slug) return toast.error("Completa el nombre y enlace."); try { await api.registrationForms.create(id!, { title, slug, editionId: editionId || undefined, status: "DRAFT", fields: [{ key: "firstName", label: "Nombres", type: "text", required: true }, { key: "lastName", label: "Apellidos", type: "text", required: true }, { key: "email", label: "Correo", type: "email", required: true }] }); setOpen(false); load(); toast.success("Formulario creado como borrador.") } catch (error: any) { toast.error(error.message) } }
  return <div className="space-y-6"><PageHeader title="Formularios de registro" description="Crea formularios públicos para el evento o una edición." actionButton={<Button onClick={() => setOpen(true)}><Plus className="mr-2 size-4" />Nuevo formulario</Button>} /><div className="rounded-xl border bg-card divide-y">{forms.length ? forms.map((form) => <div key={form.id} className="flex items-center justify-between p-4"><div><p className="font-medium">{form.title}</p><p className="text-xs text-muted-foreground">/{form.slug} · {form.status} · {form._count?.submissions || 0} envíos</p></div><Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/events/${id}/forms/${form.id}`)}>Diseñar formulario</Button></div>) : <p className="p-8 text-sm text-muted-foreground">Aún no hay formularios.</p>}</div><Sheet open={open} onOpenChange={setOpen}><SheetContent><SheetHeader><SheetTitle>Nuevo formulario</SheetTitle></SheetHeader><div className="space-y-4 p-4"><Input placeholder="Nombre" value={title} onChange={(e) => { setTitle(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-")) }} /><Input placeholder="enlace-publico" value={slug} onChange={(e) => setSlug(e.target.value)} /><select className="h-9 w-full rounded-md border bg-background px-3" value={editionId} onChange={(e) => setEditionId(e.target.value)}><option value="">Evento completo</option>{eventEditions.map((edition) => <option key={edition.id} value={edition.id}>{edition.name}</option>)}</select></div><SheetFooter><Button onClick={create}>Crear borrador</Button></SheetFooter></SheetContent></Sheet></div>
}
