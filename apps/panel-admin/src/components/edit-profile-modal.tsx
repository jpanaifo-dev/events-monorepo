import React, { useState, useEffect } from "react"
import { z } from "zod"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { X } from "lucide-react"
import { toast } from "sonner"

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { user, setUser } = useAuthStore()

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [bio, setBio] = useState("")
  const [institution, setInstitution] = useState("")
  const [dedication, setDedication] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      if (!user?.id) return
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
      }
    }

    if (isOpen) {
      loadProfile()
    }
  }, [isOpen, user?.id])

  if (!isOpen) return null

  const profileSchema = z.object({
    firstName: z.string().trim().min(1, "El nombre es requerido."),
    lastName: z.string().trim().min(1, "El apellido es requerido."),
    avatarUrl: z.string().trim().url("El enlace del avatar no es válido.").or(z.literal("")).optional(),
  })

  const handleSubmit = async (e: React.FormEvent) => {
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

      // Update local state store
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
      onClose()
    } catch (err: any) {
      console.error(err)
      toast.error(err.message || "Error al actualizar el perfil.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-card border border-border p-6 rounded-xl w-full max-w-lg relative shadow-xl space-y-6 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground outline-none cursor-pointer"
        >
          <X className="size-4" />
        </button>
        <div className="space-y-1">
          <h3 className="text-lg font-bold">Editar Perfil</h3>
          <p className="text-xs text-muted-foreground">Actualiza tu información personal de tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FieldGroup>
            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="firstName">Nombre</FieldLabel>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Ej. Juan"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="lastName">Apellido</FieldLabel>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Ej. Pérez"
                  required
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="phone">Teléfono</FieldLabel>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +51 987654321"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="avatarUrl">URL del Avatar</FieldLabel>
                <Input
                  id="avatarUrl"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://ejemplo.com/avatar.png"
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field>
                <FieldLabel htmlFor="institution">Institución</FieldLabel>
                <Input
                  id="institution"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="Ej. Universidad Nacional"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="dedication">Dedicación / Rol Profesional</FieldLabel>
                <Input
                  id="dedication"
                  value={dedication}
                  onChange={(e) => setDedication(e.target.value)}
                  placeholder="Ej. Investigador, Desarrollador"
                />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="bio">Biografía / Acerca de mí</FieldLabel>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Escribe un breve resumen sobre ti..."
                rows={3}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring text-foreground"
              />
            </Field>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="font-semibold">
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </Button>
            </div>
          </FieldGroup>
        </form>
      </div>
    </div>
  )
}
