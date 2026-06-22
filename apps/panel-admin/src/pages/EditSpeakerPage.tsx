import React, { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { z } from "zod"
import { useEventStore } from "@/store/event.store"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FormFooter } from "@/components/form-footer"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { AlertTriangle, Trash2, Plus, Loader2 } from "lucide-react"
import { ImageUploadWithPreview } from "@/components/ImageUploadWithPreview"
import { useSEO } from "@/hooks/use-seo"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { supabase } from "@/utils/supabase"

export function EditSpeakerPage() {
  const { eventId, speakerId } = useParams<{ eventId: string; speakerId: string }>()
  const navigate = useNavigate()

  const { speakers, roles, editions, thematicLines, loadRoles, loadThematicLines, updateSpeaker } = useEventStore()
  const [isLoadingSession, setIsLoadingSession] = useState(false)

  const eventEditions = editions.filter((ed) => ed.mainEventId === eventId)
  const currentEdition = eventEditions.find((ed) => ed.isCurrent)

  const speaker = speakers.find((s) => s.id === speakerId)

  useSEO({
    title: speaker ? `Editar Ponente: ${speaker.firstName} ${speaker.lastName}` : "Editar Ponente",
    description: "Modifica los datos personales del ponente, su biografía, fotografía y los detalles de su ponencia."
  })

  // Form states
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [bio, setBio] = useState("")
  const [avatar, setAvatar] = useState("")
  const [hasSession, setHasSession] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionTitle, setSessionTitle] = useState("")
  const [selectedThematicLines, setSelectedThematicLines] = useState<string[]>([])
  const [sessionResources, setSessionResources] = useState<Array<{ id?: string; name: string; file_url: string }>>([])
  const [selectedRoleId, setSelectedRoleId] = useState("")
  const [selectedEditionId, setSelectedEditionId] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState("")

  // Load roles and thematic lines for list
  useEffect(() => {
    if (eventId) {
      loadRoles(eventId)
      loadThematicLines(eventId)
    }
  }, [eventId, loadRoles, loadThematicLines])

  // Pre-fill form fields when speaker data is available
  useEffect(() => {
    if (speaker) {
      setEmail(speaker.email || "")
      setFirstName(speaker.firstName || "")
      setLastName(speaker.lastName || "")
      setBio(speaker.bio || "")
      setAvatar(speaker.avatar || "")
      setSelectedRoleId(speaker.roleId || "")
      setSelectedEditionId(speaker.editionId || currentEdition?.id || "")
    }
  }, [speaker, currentEdition])

  // Load session details for the speaker
  useEffect(() => {
    async function fetchSessionInfo() {
      if (!speakerId) return
      setIsLoadingSession(true)
      try {
        // 1. Find session_speakers pivot
        const { data: speakerPivot, error: pivotErr } = await supabase
          .from("session_speakers")
          .select("session_id")
          .eq("participant_id", speakerId)
          .maybeSingle()

        if (pivotErr) throw pivotErr

        if (speakerPivot?.session_id) {
          const sId = speakerPivot.session_id
          setSessionId(sId)
          setHasSession(true)

          // 2. Fetch session details
          const { data: sessionData, error: sessionErr } = await supabase
            .from("event_sessions")
            .select("*")
            .eq("id", sId)
            .maybeSingle()

          if (sessionErr) throw sessionErr
          if (sessionData) {
            setSessionTitle(sessionData.title || "")
          }

          // 3. Fetch thematic lines pivots
          const { data: thematicData, error: thematicErr } = await supabase
            .from("session_thematic_lines")
            .select("thematic_line_id")
            .eq("session_id", sId)

          if (thematicErr) throw thematicErr
          if (thematicData) {
            setSelectedThematicLines(thematicData.map((d) => d.thematic_line_id))
          }

          // 4. Fetch session resources
          const { data: resourceData, error: resourceErr } = await supabase
            .from("session_resources")
            .select("id, name, file_url, mime_type")
            .eq("session_id", sId)

          if (resourceErr) throw resourceErr
          if (resourceData) {
            setSessionResources(resourceData)
          }
        } else {
          // Reset states in case speaker doesn't have a session
          setHasSession(false)
          setSessionId(null)
          setSessionTitle("")
          setSelectedThematicLines([])
          setSessionResources([])
        }
      } catch (err) {
        console.error("Error loading speaker session info:", err)
      } finally {
        setIsLoadingSession(false)
      }
    }

    if (speaker) {
      fetchSessionInfo()
    }
  }, [speaker, speakerId])

  // Get active roles of this event
  const activeRoles = roles.filter((r) => r.mainEventId === eventId && r.isActive)

  // Find speaker and keynote-speaker roles
  const speakerRole = activeRoles.find((r) => r.slug === "speaker")
  const keynoteRole = activeRoles.find((r) => r.slug === "keynote-speaker")

  const speakerEditFormSchema = z.object({
    firstName: z.string().trim().min(1, "El nombre es obligatorio."),
    lastName: z.string().trim().min(1, "El apellido es obligatorio."),
    bio: z.string().trim().min(1, "La biografía del ponente es obligatoria."),
    selectedRoleId: z.string().min(1, "Debes seleccionar un rol para el ponente."),
    selectedEditionId: z.string().min(1, "Por favor, selecciona una edición."),
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    const result = speakerEditFormSchema.safeParse({
      firstName,
      lastName,
      bio,
      selectedRoleId,
      selectedEditionId,
    })

    if (!result.success) {
      setFormError(result.error.issues[0].message)
      return
    }

    setIsSubmitting(true)

    const payload = {
      editionId: selectedEditionId,
      roleId: selectedRoleId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      avatar: avatar.trim() || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(firstName + " " + lastName)}`,
      talkTitle: hasSession ? sessionTitle.trim() : "",
      talkDescription: "",
      bio: bio.trim(),
    }

    try {
      await updateSpeaker(speakerId!, payload)

      if (hasSession && sessionTitle.trim()) {
        if (sessionId) {
          // A. Modifying an existing session
          // 1. Update session title
          const { error: sessionErr } = await supabase
            .from("event_sessions")
            .update({ title: sessionTitle.trim() })
            .eq("id", sessionId)

          if (sessionErr) throw sessionErr

          // 2. Sync session thematic lines
          // First delete existing lines
          const { error: deleteLinesErr } = await supabase
            .from("session_thematic_lines")
            .delete()
            .eq("session_id", sessionId)

          if (deleteLinesErr) throw deleteLinesErr

          // Insert new selected lines
          if (selectedThematicLines.length > 0) {
            const thematicPivots = selectedThematicLines.map((lineId) => ({
              session_id: sessionId,
              thematic_line_id: lineId,
            }))

            const { error: insertLinesErr } = await supabase
              .from("session_thematic_lines")
              .insert(thematicPivots)

            if (insertLinesErr) throw insertLinesErr
          }

          // 3. Sync session resources
          // First delete existing resources
          const { error: deleteResErr } = await supabase
            .from("session_resources")
            .delete()
            .eq("session_id", sessionId)

          if (deleteResErr) throw deleteResErr

          // Insert new ones
          if (sessionResources.length > 0) {
            const resourceInserts = sessionResources
              .filter((r) => r.name.trim() && r.file_url.trim())
              .map((r) => ({
                id: crypto.randomUUID(),
                session_id: sessionId,
                name: r.name.trim(),
                file_url: r.file_url.trim(),
                mime_type: r.file_url.split('.').pop() || 'application/octet-stream',
              }))

            if (resourceInserts.length > 0) {
              const { error: insertResErr } = await supabase
                .from("session_resources")
                .insert(resourceInserts)

              if (insertResErr) throw insertResErr
            }
          }
        } else {
          // B. Creating a new session during edit
          const newSessionId = crypto.randomUUID()

          // 1. Insert event_sessions
          const { error: sessionErr } = await supabase
            .from("event_sessions")
            .insert([{
              id: newSessionId,
              title: sessionTitle.trim(),
              edition_id: selectedEditionId,
            }])

          if (sessionErr) throw sessionErr

          // 2. Insert session_speakers
          const { error: speakerErr } = await supabase
            .from("session_speakers")
            .insert([{
              session_id: newSessionId,
              participant_id: speakerId!,
              is_main_speaker: true,
            }])

          if (speakerErr) throw speakerErr

          // 3. Insert session_thematic_lines
          if (selectedThematicLines.length > 0) {
            const thematicPivots = selectedThematicLines.map((lineId) => ({
              session_id: newSessionId,
              thematic_line_id: lineId,
            }))

            const { error: insertLinesErr } = await supabase
              .from("session_thematic_lines")
              .insert(thematicPivots)

            if (insertLinesErr) throw insertLinesErr
          }

          // 4. Insert session_resources
          if (sessionResources.length > 0) {
            const resourceInserts = sessionResources
              .filter((r) => r.name.trim() && r.file_url.trim())
              .map((r) => ({
                id: crypto.randomUUID(),
                session_id: newSessionId,
                name: r.name.trim(),
                file_url: r.file_url.trim(),
                mime_type: r.file_url.split('.').pop() || 'application/octet-stream',
              }))

            if (resourceInserts.length > 0) {
              const { error: insertResErr } = await supabase
                .from("session_resources")
                .insert(resourceInserts)

              if (insertResErr) throw insertResErr
            }
          }
        }
      } else {
        // C. Switch is toggled OFF (or title is empty). If sessionId existed, delete the session.
        if (sessionId) {
          const { error: deleteSessionErr } = await supabase
            .from("event_sessions")
            .delete()
            .eq("id", sessionId)

          if (deleteSessionErr) throw deleteSessionErr
        }
      }

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

          <h2 className="text-lg">Información de Perfil</h2>
          {/* Card: Perfil del Ponente */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
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

          <h2 className="text-lg">Rol y Ámbito</h2>
          {/* Card: Detalles de Rol y Ámbito */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
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

          <h2 className="text-lg">Tema de Ponencia (Sesión)</h2>
          {/* Card: Tema de Ponencia */}
          <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm p-6 space-y-6">
            {isLoadingSession ? (
              <div className="flex items-center justify-center py-6 gap-2">
                <Loader2 className="size-5 animate-spin text-primary" />
                <span className="text-xs text-muted-foreground">Cargando detalles del tema...</span>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="hasSessionToggle" className="text-sm font-medium text-foreground">
                      Asociar Sesión / Tema de Ponencia
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Activa esta opción si el ponente expondrá una charla o sesión específica en el evento.
                    </p>
                  </div>
                  <Switch
                    id="hasSessionToggle"
                    checked={hasSession}
                    onCheckedChange={setHasSession}
                  />
                </div>

                {hasSession && (
                  <div className="space-y-6 border-t border-border pt-6 animate-in fade-in duration-200">
                    {/* Session Title */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="md:w-1/3 space-y-1">
                        <Label htmlFor="sessionTitleInput" className="text-sm font-medium text-foreground">
                          Título de la Charla / Sesión <span className="text-destructive">*</span>
                        </Label>
                        <p className="text-xs text-muted-foreground">Nombre principal de la conferencia o taller.</p>
                      </div>
                      <div className="md:w-2/3 max-w-md w-full">
                        <Input
                          id="sessionTitleInput"
                          value={sessionTitle}
                          onChange={(e) => setSessionTitle(e.target.value)}
                          placeholder="Ej. Introducción a Inteligencia Artificial"
                          required={hasSession}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    {/* Thematic Lines (Multi-select) */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-t border-border pt-6">
                      <div className="md:w-1/3 space-y-1">
                        <span className="text-sm font-medium text-foreground">Líneas Temáticas</span>
                        <p className="text-xs text-muted-foreground">Selecciona las líneas temáticas a las que pertenece este tema (pueden ser múltiples).</p>
                      </div>
                      <div className="md:w-2/3 max-w-md w-full">
                        {thematicLines.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">No hay líneas temáticas creadas para este evento.</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {thematicLines.map((line) => {
                              const isChecked = selectedThematicLines.includes(line.id)
                              return (
                                <label
                                  key={line.id}
                                  className="flex items-center gap-2.5 p-2.5 rounded-lg border border-border bg-card/50 hover:bg-muted/30 cursor-pointer transition-colors text-xs font-medium"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        setSelectedThematicLines(selectedThematicLines.filter((id) => id !== line.id))
                                      } else {
                                        setSelectedThematicLines([...selectedThematicLines, line.id])
                                      }
                                    }}
                                    className="rounded border-input text-primary focus:ring-primary/20 size-4 cursor-pointer"
                                  />
                                  <span className="flex items-center gap-1.5 min-w-0">
                                    {line.colorHex && (
                                      <span
                                        className="size-2 rounded-full shrink-0"
                                        style={{ backgroundColor: line.colorHex }}
                                      />
                                    )}
                                    <span className="truncate">{line.name}</span>
                                  </span>
                                </label>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Session Resources */}
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-t border-border pt-6">
                      <div className="md:w-1/3 space-y-1">
                        <span className="text-sm font-medium text-foreground">Recursos Descargables</span>
                        <p className="text-xs text-muted-foreground">Agrega enlaces a diapositivas, PDFs, código fuente u otros materiales.</p>
                      </div>
                      <div className="md:w-2/3 max-w-md w-full space-y-3">
                        {sessionResources.map((res, index) => (
                          <div key={index} className="flex gap-2 items-center bg-muted/20 p-3 rounded-lg border border-border relative group animate-in fade-in duration-200">
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">Nombre</label>
                                <Input
                                  value={res.name}
                                  onChange={(e) => {
                                    const updated = [...sessionResources]
                                    updated[index].name = e.target.value
                                    setSessionResources(updated)
                                  }}
                                  placeholder="Ej. Presentación PDF"
                                  className="h-8 text-xs"
                                  required
                                />
                              </div>
                              <div>
                                <label className="text-[9px] uppercase font-bold text-muted-foreground block mb-0.5">URL del Archivo</label>
                                <Input
                                  type="url"
                                  value={res.file_url}
                                  onChange={(e) => {
                                    const updated = [...sessionResources]
                                    updated[index].file_url = e.target.value
                                    setSessionResources(updated)
                                  }}
                                  placeholder="https://ejemplo.com/archivo.pdf"
                                  className="h-8 text-xs"
                                  required
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => {
                                setSessionResources(sessionResources.filter((_, idx) => idx !== index))
                              }}
                              className="size-8 p-0 text-destructive hover:bg-destructive/10 shrink-0 self-end mb-0.5"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setSessionResources([...sessionResources, { name: "", file_url: "" }])}
                          className="w-full text-xs h-8 border-dashed hover:border-primary/50"
                        >
                          <Plus className="size-3.5 mr-1" />
                          Añadir Recurso
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
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
