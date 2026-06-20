import React, { useState, useEffect } from "react"
import { z } from "zod"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { useSEO } from "@/hooks/use-seo"

export function ProfileInfoSection() {
  const { user, setUser } = useAuthStore()

  useSEO({
    title: "Mi Perfil - Datos Generales",
    description: "Actualiza tu información de perfil personal, teléfono, biografía e institución en EventHive."
  })

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [institution, setInstitution] = useState("")
  const [dedication, setDedication] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return
      setIsLoadingProfile(true)
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setFirstName(data.first_name || "")
          setLastName(data.last_name || "")
          setPhone(data.phone || "")
          setBio(data.bio || "")
          setInstitution(data.institution || "")
          setDedication(data.dedication || "")
          setAvatarUrl(data.avatar_url || "")
        }
      } catch (err) {
        console.error("Error loading user profile:", err)
        toast.error("Error al cargar la información del perfil.")
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()
  }, [user?.id])

  const profileSchema = z.object({
    firstName: z.string().trim().min(1, "El nombre es requerido."),
    lastName: z.string().trim().min(1, "El apellido es requerido."),
    avatarUrl: z.string().trim().url("El enlace del avatar no es válido.").or(z.literal("")).optional(),
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.id) return

    const validation = profileSchema.safeParse({
      firstName,
      lastName,
      avatarUrl,
    })

    if (!validation.success) {
      toast.error(validation.error.issues[0].message)
      return
    }

    setIsSubmitting(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          first_name: firstName,
          last_name: lastName,
          phone,
          bio,
          institution,
          dedication,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Update auth store user details
      setUser({
        ...user,
        full_name: `${firstName} ${lastName}`.trim() || null,
        first_name: firstName || null,
        last_name: lastName || null,
        phone: phone || null,
        bio: bio || null,
        specialty: dedication || null
      })

      toast.success("Perfil actualizado con éxito")
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error al guardar los cambios.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingProfile) {
    return (
      <div className="border border-border rounded-xl bg-card p-6 space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-border">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded w-full md:w-2/3 max-w-md" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-border">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded w-full md:w-2/3 max-w-md" />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between py-4 border-b border-border">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-10 bg-muted rounded w-full md:w-2/3 max-w-md" />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <div className="h-10 bg-muted rounded w-24" />
          <div className="h-10 bg-muted rounded w-32" />
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-in fade-in duration-200">
      <div className="border border-border rounded-xl bg-card overflow-hidden">
        {/* Email Row (Disabled) */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label className="text-sm font-medium text-foreground">Correo Electrónico</label>
            <p className="text-xs text-muted-foreground">Tu dirección de correo no puede ser modificada.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <div className="flex items-stretch rounded-md border border-input bg-muted/35 overflow-hidden text-sm px-3 py-2 select-none text-muted-foreground">
              <span className="flex-1 truncate">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Name Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="first-name" className="text-sm font-medium text-foreground">
              Nombre <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground">Tu nombre o nombres de pila.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="first-name"
              type="text"
              placeholder="Ej. Juan"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Last Name Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="last-name" className="text-sm font-medium text-foreground">
              Apellido <span className="text-destructive">*</span>
            </label>
            <p className="text-xs text-muted-foreground">Tus apellidos paterno y materno.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="last-name"
              type="text"
              placeholder="Ej. Pérez"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Phone Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="phone" className="text-sm font-medium text-foreground">Teléfono</label>
            <p className="text-xs text-muted-foreground">Número de contacto telefónico con código de país.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="phone"
              type="tel"
              placeholder="Ej. +51 987654321"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Avatar URL Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="avatar-url" className="text-sm font-medium text-foreground">Enlace del Avatar (URL)</label>
            <p className="text-xs text-muted-foreground">Enlace directo a tu foto de perfil.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="avatar-url"
              type="url"
              placeholder="https://ejemplo.com/foto.png"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Institution Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="institution" className="text-sm font-medium text-foreground">Institución</label>
            <p className="text-xs text-muted-foreground">La universidad, empresa u organización a la que representas.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="institution"
              type="text"
              placeholder="Ej. Universidad o Empresa"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Dedication Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="dedication" className="text-sm font-medium text-foreground">Dedicación / Rol Profesional</label>
            <p className="text-xs text-muted-foreground">Tu cargo, ocupación o especialidad principal.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <Input
              id="dedication"
              type="text"
              placeholder="Ej. Desarrollador, Diseñador, Investigador"
              value={dedication}
              onChange={(e) => setDedication(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Bio Row */}
        <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
          <div className="md:w-1/3 space-y-1">
            <label htmlFor="bio" className="text-sm font-medium text-foreground">Biografía</label>
            <p className="text-xs text-muted-foreground">Breve resumen de tu perfil profesional o académico.</p>
          </div>
          <div className="md:w-2/3 max-w-md w-full">
            <textarea
              id="bio"
              rows={4}
              placeholder="Escribe algo sobre ti..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-input rounded-md outline-none focus:ring-2 focus:ring-ring/50 text-foreground"
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Actions Row */}
        <div className="bg-muted/10 px-6 py-4 flex justify-end gap-3">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="font-medium px-5 transition-colors"
          >
            {isSubmitting ? "Guardando..." : "Guardar Cambios"}
          </Button>
        </div>
      </div>
    </form>
  )
}
