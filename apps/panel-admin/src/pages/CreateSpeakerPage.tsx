import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { supabase } from "@/utils/supabase"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { FormFooter } from "@/components/form-footer"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Check, Loader2 } from "lucide-react"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"

export function CreateSpeakerPage() {
  const { eventId } = useParams<{ eventId: string }>()
  const navigate = useNavigate()

  const { roles, editions, loadRoles, addSpeaker } = useEventStore()

  const eventEditions = editions.filter((ed) => ed.mainEventId === eventId)
  const currentEdition = eventEditions.find((ed) => ed.isCurrent)

  // Form states
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState("")
  const [talkTitle, setTalkTitle] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [selectedEditionId, setSelectedEditionId] = useState("")

  // Verification states
  const [profileId, setProfileId] = useState("")
  const [isCheckingEmail, setIsCheckingEmail] = useState(false)
  const [isProfileFound, setIsProfileFound] = useState<boolean | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  // Load roles for list
  useEffect(() => {
    if (eventId) {
      loadRoles(eventId)
    }
  }, [eventId, loadRoles])

  // Get active roles of this event
  const activeRoles = roles.filter((r) => r.mainEventId === eventId && r.isActive)

  // Find speaker and keynote-speaker roles
  const speakerRole = activeRoles.find((r) => r.slug === "speaker")
  const keynoteRole = activeRoles.find((r) => r.slug === "keynote-speaker")

  // Default-select role (prefer slug "speaker", else keynote-speaker, else first active role)
  useEffect(() => {
    if (activeRoles.length > 0 && !selectedRoleId) {
      const defaultRole = speakerRole || keynoteRole || activeRoles[0]
      setSelectedRoleId(defaultRole.id)
    }
  }, [activeRoles, selectedRoleId, speakerRole, keynoteRole])

  // Default-select current edition
  useEffect(() => {
    if (eventEditions.length > 0 && !selectedEditionId) {
      const defaultEd = currentEdition || eventEditions[0]
      setSelectedEditionId(defaultEd.id)
    }
  }, [eventEditions, currentEdition, selectedEditionId])

  // Check email on blur
  const handleEmailBlur = async () => {
    const trimmedEmail = email.trim().toLowerCase()
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setIsProfileFound(null)
      return
    }

    setIsCheckingEmail(true)
    setFormError("")

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", trimmedEmail)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setProfileId(data.id)
        setFirstName(data.first_name || "")
        setLastName(data.last_name || "")
        setBio(data.bio || "")
        setAvatar(data.avatar_url || "")
        setIsProfileFound(true)
      } else {
        setProfileId("")
        setIsProfileFound(false)
      }
    } catch (err) {
      console.error("Error looking up email profile:", err)
    } finally {
      setIsCheckingEmail(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    if (!email.trim() || !email.includes("@")) {
      setFormError("Por favor, introduce un correo electrónico válido.")
      return
    }
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
    if (!selectedEditionId) {
      setFormError("Por favor, selecciona una edición.")
      return
    }

    setIsSubmitting(true)

    const payload = {
      eventId: eventId!,
      editionId: selectedEditionId,
      profileId: profileId || null,
      roleId: selectedRoleId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      avatar: avatar.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName + " " + lastName)}`,
      talkTitle: talkTitle.trim() || "Charla Especial",
      talkDescription: "",
      bio: bio.trim(),
    }

    try {
      await addSpeaker(payload)
      navigate(`/dashboard/events/${eventId}/speakers`)
    } catch (err: any) {
      console.error(err)
      setFormError(err?.message || "Ocurrió un error al registrar el ponente.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      <main className="max-w-4xl mx-auto px-6 py-12 flex-1 w-full pb-28">
        <div className="mb-10">
          <PageHeader
            title="Agregar Ponente"
            description="Vincula un perfil de usuario existente o crea uno nuevo y asígnale su rol de ponente."
            showBackButton
            onBackClick={() => navigate(`/dashboard/events/${eventId}/speakers`)}
          />
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {formError && (
            <div className="p-4 text-sm bg-destructive/15 text-destructive rounded-xl border border-destructive/20 font-medium animate-in fade-in">
              {formError}
            </div>
          )}
          <h2 className="text-lg">Información de Perfil</h2>
          {/* Card: Perfil del Ponente */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
            {/* Email Row */}
            <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
              <div className="md:w-1/3 space-y-1">
                <label htmlFor="emailInput" className="text-sm font-medium text-foreground">
                  Correo Electrónico <span className="text-destructive">*</span>
                </label>
                <p className="text-xs text-muted-foreground">Comprueba si el usuario ya tiene perfil registrado.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
                <div className="relative">
                  <Input
                    id="emailInput"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setIsProfileFound(null)
                    }}
                    onBlur={handleEmailBlur}
                    placeholder="ponente@correo.com"
                    required
                    className="pr-10"
                    disabled={isSubmitting}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    {isCheckingEmail && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    {isProfileFound === true && (
                      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-500 gap-1 pl-1 pr-2 py-0.5 h-6">
                        <Check className="size-3" />
                        Existente
                      </Badge>
                    )}
                    {isProfileFound === false && (
                      <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-500 py-0.5 h-6">
                        Nuevo Perfil
                      </Badge>
                    )}
                  </div>
                </div>
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

          <h2 className="text-lg">Charla, Rol y Ámbito</h2>
          {/* Card: Detalles de Charla y Rol */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
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
                <label className="text-sm font-medium text-foreground">Edición *</label>
                <p className="text-xs text-muted-foreground">Selecciona la edición del evento a la que pertenece el ponente.</p>
              </div>
              <div className="md:w-2/3 max-w-md w-full">
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
              {isSubmitting ? "Registrando..." : "Agregar Ponente"}
            </Button>
          </FormFooter>
        </form>
      </main>
    </div>
  )
}
