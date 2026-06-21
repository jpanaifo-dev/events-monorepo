import { useState } from "react"
import { z } from "zod"
import { useAuthStore } from "@/store/auth.store"
import { useProfileStore, type Education } from "@/store/profile.store"
import { Plus, Trash2, Edit, GraduationCap, Calendar, MapPin, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
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

export function ProfileEducationSection() {
  const { user } = useAuthStore()
  const { education, addEducation, updateEducation, deleteEducation } = useProfileStore()

  useSEO({
    title: "Mi Perfil - Estudios",
    description: "Gestiona tu formación académica, universidades, grados y títulos en Zynqro ."
  })

  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Form fields
  const [institution, setInstitution] = useState("")
  const [title, setTitle] = useState("")
  const [fieldOfStudy, setFieldOfStudy] = useState("")
  const [degree, setDegree] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isCurrent, setIsCurrent] = useState(false)
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [status, setStatus] = useState("completed")
  const [visibility, setVisibility] = useState("public")
  const [isFavorite, setIsFavorite] = useState(false)
  const [formError, setFormError] = useState("")

  const openCreate = () => {
    setEditingId(null)
    setInstitution("")
    setTitle("")
    setFieldOfStudy("")
    setDegree("")
    setStartDate("")
    setEndDate("")
    setIsCurrent(false)
    setCity("")
    setCountry("")
    setStatus("completed")
    setVisibility("public")
    setIsFavorite(false)
    setFormError("")
    setIsSheetOpen(true)
  }

  const openEdit = (item: Education) => {
    setEditingId(item.id)
    setInstitution(item.institution)
    setTitle(item.title)
    setFieldOfStudy(item.fieldOfStudy || "")
    setDegree(item.degree || "")
    setStartDate(item.startDate || "")
    setEndDate(item.endDate || "")
    setIsCurrent(item.isCurrent)
    setCity(item.city || "")
    setCountry(item.country || "")
    setStatus(item.status)
    setVisibility(item.visibility)
    setIsFavorite(item.isFavorite)
    setFormError("")
    setIsSheetOpen(true)
  }

  const closeSheet = () => {
    setIsSheetOpen(false)
    setEditingId(null)
    setFormError("")
  }

  const educationSchema = z.object({
    institution: z.string().trim().min(1, "El nombre de la institución es requerido."),
    title: z.string().trim().min(1, "El título o carrera es requerido."),
    fieldOfStudy: z.string().trim().optional().nullable(),
    degree: z.string().trim().optional().nullable(),
    startDate: z.string().optional().nullable(),
    endDate: z.string().optional().nullable(),
    isCurrent: z.boolean(),
    city: z.string().trim().optional().nullable(),
    country: z.string().trim().optional().nullable(),
    status: z.string(),
    visibility: z.string(),
    isFavorite: z.boolean(),
  }).refine((data) => {
    if (!data.isCurrent && !data.endDate && data.status === "completed") {
      return false
    }
    return true
  }, {
    message: "La fecha de fin es obligatoria para estudios finalizados.",
    path: ["endDate"]
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return
    setFormError("")

    const validation = educationSchema.safeParse({
      institution,
      title,
      fieldOfStudy: fieldOfStudy || null,
      degree: degree || null,
      startDate: startDate || null,
      endDate: isCurrent ? null : (endDate || null),
      isCurrent,
      city: city || null,
      country: country || null,
      status,
      visibility,
      isFavorite,
    })

    if (!validation.success) {
      setFormError(validation.error.issues[0].message)
      return
    }

    const payload = {
      institution: institution.trim(),
      title: title.trim(),
      fieldOfStudy: fieldOfStudy.trim() || null,
      degree: degree.trim() || null,
      startDate: startDate || null,
      endDate: isCurrent ? null : (endDate || null),
      isCurrent,
      city: city.trim() || null,
      country: country.trim() || null,
      status,
      visibility,
      isFavorite,
    }

    try {
      if (editingId) {
        await updateEducation(editingId, payload)
        toast.success("Estudio actualizado correctamente")
      } else {
        await addEducation(user.id, payload)
        toast.success("Estudio agregado correctamente")
      }
      closeSheet()
    } catch (err: any) {
      console.error(err)
      setFormError(err?.message || "Ocurrió un error al guardar.")
    }
  }

  const handleDelete = async (itemId: string) => {
    try {
      await deleteEducation(itemId)
      toast.success("Estudio académico eliminado")
    } catch (err) {
      console.error(err)
      toast.error("Error al eliminar el estudio")
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Por definir"
    const [year, month] = dateStr.split("-")
    if (!month) return year // Fallback for just year
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString("es-ES", { month: "long", year: "numeric" })
  }

  const getStatusLabel = (statusKey: string) => {
    switch (statusKey) {
      case "completed":
        return "Completado"
      case "studying":
        return "Cursando"
      case "suspended":
        return "Suspendido"
      default:
        return "Completado"
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">

      {/* Title & Add Button */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-lg font-bold">Historial Académico</h3>
          <p className="text-xs text-muted-foreground">
            Añade tus estudios superiores, cursos o postgrados.
          </p>
        </div>
        <Button onClick={openCreate} className="text-xs px-3 py-1.5 h-8">
          <Plus className="size-4 mr-1.5" />
          Añadir Estudio
        </Button>
      </div>

      {/* Education List */}
      {education.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/20 space-y-3">
          <GraduationCap className="size-8 mx-auto opacity-40" />
          <div>
            <p className="font-semibold">No hay estudios registrados</p>
            <p className="text-xs text-muted-foreground">
              Comienza añadiendo tu formación académica haciendo clic en el botón de arriba.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {education.map((item) => (
            <div
              key={item.id}
              className="p-5 rounded-xl border border-border bg-card hover:bg-muted/5 transition-all duration-300 relative overflow-hidden group flex flex-col md:flex-row md:items-start justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="size-10 rounded-lg border border-border/80 bg-muted/40 flex items-center justify-center text-muted-foreground">
                  <GraduationCap className="size-5" />
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                    <span className="text-muted-foreground text-xs">en</span>
                    <span className="font-semibold text-sm text-primary">{item.institution}</span>
                    {item.isFavorite && (
                      <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                        Destacado
                      </Badge>
                    )}
                  </div>

                  {/* Info Metadata Row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {item.degree && (
                      <span className="font-medium text-foreground/80">
                        {item.degree} {item.fieldOfStudy ? `en ${item.fieldOfStudy}` : ""}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3.5" />
                      {formatDate(item.startDate)} – {item.isCurrent ? "Presente" : formatDate(item.endDate)}
                    </span>
                    {(item.city || item.country) && (
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {[item.city, item.country].filter(Boolean).join(", ")}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Globe className="size-3.5" />
                      {item.visibility === "public" ? "Público" : "Privado"}
                    </span>
                    <Badge variant="outline" className="text-[10px] py-0 border-border/80">
                      {getStatusLabel(item.status)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 md:self-start self-end">
                <Button onClick={() => openEdit(item)} variant="ghost" className="size-8 p-0">
                  <Edit className="size-4" />
                </Button>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" className="size-8 p-0 text-destructive hover:bg-destructive/10">
                      <Trash2 className="size-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Eliminar estudio?</AlertDialogTitle>
                      <AlertDialogDescription>
                        ¿Estás seguro de que deseas eliminar "{item.title}" de "{item.institution}"? Esta acción no se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(item.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
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

      {/* Sheet Form */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar Estudio" : "Añadir Estudio"}</SheetTitle>
            <SheetDescription>
              Registra los datos de tu institución y grado académico. Los campos con * son obligatorios.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-5 px-4 mt-6 flex-1 overflow-y-auto pb-6">

            {formError && (
              <div className="p-3 text-xs bg-destructive/15 text-destructive rounded-lg border border-destructive/20 font-medium">
                {formError}
              </div>
            )}

            <FieldGroup>

              {/* Institution */}
              <Field>
                <FieldLabel htmlFor="instName">Institución Académica *</FieldLabel>
                <Input
                  id="instName"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Ej. Universidad de Buenos Aires, Coursera"
                  required
                />
              </Field>

              {/* Title */}
              <Field>
                <FieldLabel htmlFor="eduTitle">Título / Carrera *</FieldLabel>
                <Input
                  id="eduTitle"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Bachiller en Ingeniería de Sistemas, Curso de React"
                  required
                />
              </Field>

              {/* Field of Study & Degree */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="eduField">Especialidad</FieldLabel>
                  <Input
                    id="eduField"
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                    placeholder="Ej. Computación"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="eduDegree">Grado / Nivel</FieldLabel>
                  <Input
                    id="eduDegree"
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    placeholder="Ej. Bachiller, Diplomado"
                  />
                </Field>
              </div>

              {/* Start Date & End Date */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="eduStart">Fecha Inicio</FieldLabel>
                  <Input
                    id="eduStart"
                    type="month"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Field>
                {!isCurrent && (
                  <Field>
                    <FieldLabel htmlFor="eduEnd">Fecha Fin</FieldLabel>
                    <Input
                      id="eduEnd"
                      type="month"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      required={!isCurrent && status === "completed"}
                    />
                  </Field>
                )}
              </div>

              {/* Is Current Checkbox */}
              <div className="flex items-center justify-between p-1 bg-muted/10 border border-border/50 rounded-xl px-4 py-3">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold cursor-pointer select-none" htmlFor="currStudy">
                    Estudio aquí actualmente
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Marcar si te encuentras cursando este estudio.
                  </p>
                </div>
                <Switch
                  id="currStudy"
                  checked={isCurrent}
                  onCheckedChange={(val) => {
                    setIsCurrent(val)
                    if (val) setStatus("studying")
                  }}
                />
              </div>

              {/* Status Selector */}
              <Field>
                <FieldLabel htmlFor="eduStatus">Estado del estudio</FieldLabel>
                <Select value={status} onValueChange={(val) => {
                  setStatus(val)
                  if (val === "completed") setIsCurrent(false)
                  if (val === "studying") setIsCurrent(true)
                }}>
                  <SelectTrigger id="eduStatus">
                    <SelectValue placeholder="Selecciona estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">Completado / Graduado</SelectItem>
                    <SelectItem value="studying">Cursando actualmente</SelectItem>
                    <SelectItem value="suspended">Suspendido / Aplazado</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* Location Fields */}
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="eduCity">Ciudad</FieldLabel>
                  <Input
                    id="eduCity"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Ej. Buenos Aires"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="eduCountry">País</FieldLabel>
                  <Input
                    id="eduCountry"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Ej. Argentina"
                  />
                </Field>
              </div>

              {/* Visibility Selector */}
              <Field>
                <FieldLabel htmlFor="eduVis">Visibilidad en el perfil</FieldLabel>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger id="eduVis">
                    <SelectValue placeholder="Selecciona visibilidad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Público (Visible para todos)</SelectItem>
                    <SelectItem value="private">Privado (Solo organizadores)</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              {/* Is Favorite Switch */}
              <div className="flex items-center justify-between p-1">
                <div className="space-y-0.5">
                  <label className="text-sm font-semibold cursor-pointer select-none" htmlFor="favEdu">
                    Destacar estudio
                  </label>
                  <p className="text-xs text-muted-foreground">
                    Aparecerá resaltado al inicio de tu perfil.
                  </p>
                </div>
                <Switch
                  id="favEdu"
                  checked={isFavorite}
                  onCheckedChange={setIsFavorite}
                />
              </div>

            </FieldGroup>
          </form>

          <SheetFooter className="mt-8 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={closeSheet}>
              Cancelar
            </Button>
            <Button onClick={handleSave} className="font-semibold">
              {editingId ? "Guardar Cambios" : "Añadir Estudio"}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
