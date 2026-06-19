import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { useEventStore } from "@/store/event.store"
import { supabase } from "@/utils/supabase"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { Check, Loader2, Sparkles, Mail } from "lucide-react"

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
  const [talkDescription, setTalkDescription] = useState("")
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [isEditionSpecific, setIsEditionSpecific] = useState(false)
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

  // Default-select role (prefer slug "speaker", else first active role)
  useEffect(() => {
    if (activeRoles.length > 0 && !selectedRoleId) {
      const defaultRole = activeRoles.find((r) => r.slug === "speaker") || activeRoles[0]
      setSelectedRoleId(defaultRole.id)
    }
  }, [activeRoles, selectedRoleId])

  // Default-select current edition
  useEffect(() => {
    if (isEditionSpecific && currentEdition && !selectedEditionId) {
      setSelectedEditionId(currentEdition.id)
    }
  }, [isEditionSpecific, currentEdition, selectedEditionId])

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
    if (isEditionSpecific && !selectedEditionId) {
      setFormError("Por favor, selecciona una edición específica.")
      return
    }

    setIsSubmitting(true)

    const payload = {
      eventId: eventId!,
      editionId: isEditionSpecific ? selectedEditionId : null,
      profileId: profileId || null,
      roleId: selectedRoleId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      avatar: avatar.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName + " " + lastName)}`,
      talkTitle: talkTitle.trim() || "Charla Especial",
      talkDescription: talkDescription.trim(),
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
    <div className="min-h-screen bg-background text-foreground font-sans py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        
        <PageHeader
          title="Agregar Ponente"
          description="Vincula un perfil de usuario existente o crea uno nuevo y asígnale su rol de ponente."
          showBackButton
          onBackClick={() => navigate(`/dashboard/events/${eventId}/speakers`)}
        />

        <form onSubmit={handleSave} className="space-y-6">
          {formError && (
            <div className="p-4 text-sm bg-destructive/15 text-destructive rounded-xl border border-destructive/20 font-medium animate-in fade-in">
              {formError}
            </div>
          )}

          {/* Card: Perfil del Ponente */}
          <div className="p-6 bg-card border border-border rounded-xl space-y-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Mail className="size-5 text-primary" />
              <h3 className="font-bold text-base">Información de Perfil</h3>
            </div>

            <FieldGroup className="space-y-4">
              {/* Email */}
              <Field>
                <FieldLabel htmlFor="emailInput">Correo Electrónico *</FieldLabel>
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
                <p className="text-[10px] text-muted-foreground mt-1">
                  Introduce el correo para comprobar si el usuario ya tiene un perfil registrado en la plataforma.
                </p>
              </Field>

              {/* Names */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="firstNameInput">Nombre *</FieldLabel>
                  <Input
                    id="firstNameInput"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Carlos"
                    required
                    disabled={isSubmitting}
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="lastNameInput">Apellido *</FieldLabel>
                  <Input
                    id="lastNameInput"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Mendoza"
                    required
                    disabled={isSubmitting}
                  />
                </Field>
              </div>

              {/* Avatar URL & Preview */}
              <div className="flex flex-col md:flex-row gap-4 items-start">
                <Field className="flex-1 w-full">
                  <FieldLabel htmlFor="avatarInput">URL de Avatar (Foto de perfil - Opcional)</FieldLabel>
                  <Input
                    id="avatarInput"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    placeholder="https://..."
                    disabled={isSubmitting}
                  />
                </Field>
                {(avatar.trim() || firstName) && (
                  <div className="shrink-0 pt-6">
                    <img
                      src={avatar.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName + " " + lastName)}`}
                      alt="Preview"
                      className="size-16 rounded-full border border-border object-cover bg-muted"
                    />
                  </div>
                )}
              </div>

              {/* Biography */}
              <Field>
                <FieldLabel htmlFor="bioInput">Biografía del Ponente *</FieldLabel>
                <textarea
                  id="bioInput"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Escribe una breve descripción del perfil profesional del ponente..."
                  required
                  rows={4}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring"
                  disabled={isSubmitting}
                />
              </Field>
            </FieldGroup>
          </div>

          {/* Card: Lógica del Evento, Charla y Roles */}
          <div className="p-6 bg-card border border-border rounded-xl space-y-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Sparkles className="size-5 text-primary" />
              <h3 className="font-bold text-base">Charla, Rol y Ámbito</h3>
            </div>

            <FieldGroup className="space-y-4">
              {/* Talk Title */}
              <Field>
                <FieldLabel htmlFor="talkTitleInput">Título de la Charla / Taller *</FieldLabel>
                <Input
                  id="talkTitleInput"
                  value={talkTitle}
                  onChange={(e) => setTalkTitle(e.target.value)}
                  placeholder="Ej. Introducción al Desarrollo Frontend Premium con React"
                  required
                  disabled={isSubmitting}
                />
              </Field>

              {/* Talk Description */}
              <Field>
                <FieldLabel htmlFor="talkDescriptionInput">Resumen de la Charla</FieldLabel>
                <textarea
                  id="talkDescriptionInput"
                  value={talkDescription}
                  onChange={(e) => setTalkDescription(e.target.value)}
                  placeholder="Describe brevemente de qué tratará la presentación..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-hidden focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring"
                  disabled={isSubmitting}
                />
              </Field>

              {/* Role Selector */}
              <Field>
                <FieldLabel htmlFor="roleSelect">Rol Asignado *</FieldLabel>
                {activeRoles.length === 0 ? (
                  <p className="text-xs text-amber-500 font-medium">
                    No hay roles de participante activos registrados en el evento. Crea un rol primero.
                  </p>
                ) : (
                  <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                    <SelectTrigger id="roleSelect">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeRoles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name.es} ({role.slug})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </Field>

              {/* Scope Switch (Global vs Edition) */}
              <div className="bg-muted/10 border border-border/60 p-4 rounded-xl space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5">
                    <label className="text-sm font-semibold cursor-pointer select-none" htmlFor="speakerEditionSwitch">
                      ¿Asignar a una edición específica del evento?
                    </label>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Si se apaga, el ponente se vinculará a nivel de evento (global). Si se enciende, estará asignado sólo a la edición elegida.
                    </p>
                  </div>
                  <Switch
                    id="speakerEditionSwitch"
                    checked={isEditionSpecific}
                    onCheckedChange={setIsEditionSpecific}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Dropdown with event editions - visible only if switch is ON */}
                {isEditionSpecific && (
                  <Field className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <FieldLabel htmlFor="speakerEditionSelect">Seleccionar Edición</FieldLabel>
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
                              {ed.name} ({ed.year}) {ed.isCurrent ? "— [Actual]" : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </Field>
                )}
              </div>
            </FieldGroup>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/dashboard/events/${eventId}/speakers`)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="font-semibold px-6">
              {isSubmitting ? "Registrando..." : "Agregar Ponente"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
