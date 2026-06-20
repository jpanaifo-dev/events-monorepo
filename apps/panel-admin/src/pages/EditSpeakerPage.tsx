import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { FormFooter } from "@/components/form-footer"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { AlertTriangle } from "lucide-react"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"

export function EditSpeakerPage() {
  const { eventId, speakerId } = useParams<{ eventId: string; speakerId: string }>()
  const navigate = useNavigate()

  const { speakers, roles, editions, loadRoles, updateSpeaker } = useEventStore()

  const eventEditions = editions.filter((ed) => ed.mainEventId === eventId)
  const currentEdition = eventEditions.find((ed) => ed.isCurrent)

  const speaker = speakers.find((s) => s.id === speakerId)

  // Form states
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState("")
  const [talkTitle, setTalkTitle] = useState("")
  const [talkDescription, setTalkDescription] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [isEditionSpecific, setIsEditionSpecific] = useState(false)
  const [selectedEditionId, setSelectedEditionId] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  // Load roles for list
  useEffect(() => {
    if (eventId) {
      loadRoles(eventId)
    }
  }, [eventId, loadRoles])

  // Pre-fill form fields when speaker data is available
  useEffect(() => {
    if (speaker) {
      setEmail(speaker.email || "")
      setFirstName(speaker.firstName || "")
      setLastName(speaker.lastName || "")
      setBio(speaker.bio || "")
      setAvatar(speaker.avatar || "")
      setTalkTitle(speaker.talkTitle || "")
      setTalkDescription(speaker.talkDescription || "")
      setSelectedRoleId(speaker.roleId || "")
      setIsEditionSpecific(!!speaker.editionId)
      setSelectedEditionId(speaker.editionId || currentEdition?.id || "")
    }
  }, [speaker, currentEdition])

  // Get active roles of this event
  const activeRoles = roles.filter((r) => r.mainEventId === eventId && r.isActive)

  // Find speaker and keynote-speaker roles
  const speakerRole = activeRoles.find((r) => r.slug === "speaker")
  const keynoteRole = activeRoles.find((r) => r.slug === "keynote-speaker")

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!firstName.trim()) {
      setFormError("El nombre es obligatorio.")
      return
    }
    if (!lastName.trim()) {
      setFormError("El apellido es obligatorio.")
      return
    }
    if (!selectedRoleId) {
      setFormError("Debes seleccionar un rol para el ponente.")
      return
    }
    if (isEditionSpecific && !selectedEditionId) {
      setFormError("Por favor, selecciona una edición específica.")
      return
    }

    setIsSubmitting(true)

    const payload = {
      editionId: isEditionSpecific ? selectedEditionId : null,
      roleId: selectedRoleId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      avatar: avatar.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName + " " + lastName)}`,
      talkTitle: talkTitle.trim() || "Charla Especial",
      talkDescription: talkDescription.trim(),
      bio: bio.trim(),
    }

    try {
      await updateSpeaker(speakerId!, payload)
      navigate(`/dashboard/events/${eventId}/speakers`)
    } catch (err: any) {
      console.error(err)
      setFormError(err?.message || "Ocurrió un error al actualizar el ponente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!speaker) {
    return (
      <div className="min-h-screen bg-background flex flex-col justify-center items-center gap-4 text-center">
        <AlertTriangle className="size-12 text-destructive animate-bounce" />
        <h3 className="font-bold text-lg">Ponente no encontrado</h3>
        <p className="text-sm text-muted-foreground">El ponente seleccionado no existe o pertenece a otro evento.</p>
        <Button onClick={() => navigate(`/dashboard/events/${eventId}/speakers`)} variant="outline">
          Volver a Ponentes
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full pb-28">
        <div className="mb-10">
          <PageHeader
            title="Editar Ponente"
            description={`Modifica los datos del perfil y la ponencia de: ${speaker.name}.`}
            showBackButton
            onBackClick={() => navigate(`/dashboard/events/${eventId}/speakers`)}
          />
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {formError && (
            <div className="p-4 text-sm bg-destructive/15 text-destructive rounded-xl border border-destructive/20 font-medium">
              {formError}
            </div>
          )}

          {/* Card: Perfil del Ponente */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-sm font-medium uppercase tracking-wider text-primary">Información de Perfil</h2>
            </div>

            {/* Email Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="emailInput" className="text-sm font-medium text-foreground">Correo Electrónico (No editable)</label>
                <p className="text-xs text-muted-foreground">Identifica la cuenta del usuario.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="emailInput"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted/40 cursor-not-allowed opacity-80"
                />
              </div>
            </div>

            {/* Names Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">
                  Nombre Completo <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Nombre y apellido del ponente.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstNameInput" className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Nombre</label>
                    <Input
                      id="firstNameInput"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Ej. Carlos"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastNameInput" className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Apellido</label>
                    <Input
                      id="lastNameInput"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Ej. Mendoza"
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Avatar Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">Foto de Perfil</label>
                <p className="text-xs text-muted-foreground">Sube una foto de avatar para el ponente o introduce un enlace directo.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <ImageUploadWithPreview
                  value={avatar}
                  onChange={setAvatar}
                  label=""
                  folder={`events/${eventId}/speakers`}
                  identifier="avatar"
                />
              </div>
            </div>

            {/* Bio Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="bioInput" className="text-sm font-medium text-foreground">
                  Biografía del Ponente <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Breve descripción profesional del expositor.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <textarea
                  id="bioInput"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Escribe una breve descripción del perfil profesional del ponente..."
                  required
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>

          {/* Card: Detalles de Charla y Rol */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
              <h2 className="text-sm font-medium uppercase tracking-wider text-primary">Charla, Rol y Ámbito</h2>
            </div>

            {/* Talk Title Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="talkTitleInput" className="text-sm font-medium text-foreground">
                  Título de la Charla <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Tema principal de la exposición.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <Input
                  id="talkTitleInput"
                  value={talkTitle}
                  onChange={(e) => setTalkTitle(e.target.value)}
                  placeholder="Ej. Introducción al Desarrollo Frontend Premium con React"
                  required
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Talk Description Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="talkDescriptionInput" className="text-sm font-medium text-foreground">Resumen de la Charla</label>
                <p className="text-xs text-muted-foreground">Breve resumen de la presentación.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <textarea
                  id="talkDescriptionInput"
                  value={talkDescription}
                  onChange={(e) => setTalkDescription(e.target.value)}
                  placeholder="Describe brevemente de qué tratará la presentación..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Role Select Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="roleSelect" className="text-sm font-medium text-foreground">
                  Tipo de Ponente <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Selecciona el tipo de ponente para este evento.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                {activeRoles.length === 0 ? (
                  <p className="text-xs text-amber-500 font-medium">
                    No hay roles activos en el evento. Crea un rol primero en la sección de Roles.
                  </p>
                ) : (
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger id="roleSelect">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {speakerRole && (
                        <SelectItem value={speakerRole.id}>
                          Ponente
                        </SelectItem>
                      )}
                      {keynoteRole && (
                        <SelectItem value={keynoteRole.id}>
                          Ponente Magistral
                        </SelectItem>
                      )}
                      {!speakerRole && !keynoteRole && activeRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name.es}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Scope Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4">
              <div className="md:w-1/3 space-y-1">
                <label className="text-sm font-medium text-foreground">Ámbito de Asignación</label>
                <p className="text-xs text-muted-foreground">¿Vincular a nivel global o a una edición específica?</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full space-y-4">
                <div className="flex items-center justify-between bg-muted/10 border border-border/60 p-4 rounded-xl">
                  <div className="space-y-0.5 pr-4">
                    <label className="text-xs font-semibold cursor-pointer select-none" htmlFor="speakerEditionSwitch">
                      ¿Asignar a una edición específica del evento?
                    </label>
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Si se apaga será global. Si se enciende, estará asignado sólo a la edición elegida.
                    </p>
                  </div>
                  <Switch
                    id="speakerEditionSwitch"
                    checked={isEditionSpecific}
                    onCheckedChange={setIsEditionSpecific}
                    disabled={isSubmitting}
                  />
                </div>

                {isEditionSpecific && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <label htmlFor="speakerEditionSelect" className="text-[10px] font-bold uppercase text-muted-foreground block mb-1">Seleccionar Edición</label>
                    {eventEditions.length === 0 ? (
                      <p className="text-xs text-amber-500 font-medium">
                        No hay ediciones creadas para este evento.
                      </p>
                    ) : (
                      <Select value={selectedEditionId} onValueChange={setSelectedEditionId}>
                        <SelectTrigger id="speakerEditionSelect">
                          <SelectValue placeholder="Selecciona una edición" />
                        </SelectTrigger>
                        <SelectContent>
                          {eventEditions.map((ed) => (
                            <SelectItem key={ed.id} value={ed.id}>
                              {`${ed.name} (${ed.year}) ${ed.isCurrent ? "— [Actual]" : ""}`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <FormFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/dashboard/events/${eventId}/speakers`)}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="cursor-pointer font-semibold px-6"
            >
              Guardar Cambios
            </Button>
          </FormFooter>
        </form>
      </main>
    </div>
  )
}
