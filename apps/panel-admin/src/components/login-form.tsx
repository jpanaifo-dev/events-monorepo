import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { z } from "zod"
import { useAuthStore } from "@/store/auth.store"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldDescription,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { supabase } from "@/utils/supabase"
import { Eye, EyeOff } from "lucide-react"

const loginSchema = z.object({
  email: z.string().min(1, "El correo electrónico es requerido").email("Correo electrónico inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
})

type LoginInput = z.infer<typeof loginSchema>

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const setLoading = useAuthStore((state) => state.setLoading)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof LoginInput, string>>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setIsLoading(true)
    setLoading(true)

    const result = loginSchema.safeParse({ email, password })

    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginInput, string>> = {}
      result.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof LoginInput] = err.message
        }
      })
      setErrors(fieldErrors)
      setIsLoading(false)
      setLoading(false)
      return
    }

    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setFormError("Credenciales incorrectas o problema de inicio de sesión.")
        setIsLoading(false)
        setLoading(false)
        return
      }

      const sessionUser = authData.user
      if (!sessionUser) {
        setFormError("No se pudo obtener la información de usuario.")
        setIsLoading(false)
        setLoading(false)
        return
      }

      // Fetch profile
      let { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", sessionUser.id)
        .maybeSingle()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("Error fetching profile:", profileError)
      }

      if (!profile) {
        const newProfile = {
          id: sessionUser.id,
          first_name: "",
          last_name: "",
          phone: null,
          bio: null,
          dedication: null,
          avatar_url: null,
          institution: null
        }

        const { data: insertedProfile, error: insertError } = await supabase
          .from("profiles")
          .insert([newProfile])
          .select()
          .single()

        if (insertError) {
          console.error("Error creating profile:", insertError)
          profile = newProfile
        } else {
          profile = insertedProfile
        }
      }

      // Fetch user role
      const { data: roleData } = await supabase
        .from("user_global_roles")
        .select("role")
        .eq("user_id", sessionUser.id)
        .maybeSingle()

      const userRole = (roleData?.role as any) || "SERVICE_OWNER"

      // Fetch organizations associated with user membership
      let orgsData: any[] = []
      const { data: memberData, error: memberError } = await supabase
        .from("organization_members")
        .select(`
          organization:organizations (
            id,
            organization_name,
            organization_type,
            organization_email,
            description,
            status,
            slug,
            logo_url,
            cover_image_url,
            favicon_url
          )
        `)
        .eq("profile_id", sessionUser.id)

      if (memberError) {
        if (memberError.code === "P0001" || memberError.message.includes("does not exist")) {
          console.warn("organization_members table does not exist, loading all organizations instead.")
          const { data: allOrgs, error: allOrgsErr } = await supabase
            .from("organizations")
            .select(`
              id,
              organization_name,
              organization_type,
              organization_email,
              description,
              status,
              slug,
              logo_url,
              cover_image_url,
              favicon_url
            `)
          if (!allOrgsErr) {
            orgsData = allOrgs || []
          }
        } else {
          console.error("Error fetching organizations during login:", memberError)
        }
      } else {
        orgsData = (memberData || []).map((item: any) => item.organization).filter(Boolean)
      }

      // Map to Organization model
      const formattedOrgs = (orgsData || []).map((org: any) => ({
        id: org.id,
        name: org.organization_name,
        slug: org.slug || org.organization_name.toLowerCase().replace(/\s+/g, "-"),
        description: org.description || "",
        isActive: org.status === "active",
        type: org.organization_type,
        logoUrl: org.logo_url || "",
        coverUrl: org.cover_image_url || "",
        faviconUrl: org.favicon_url || "",
        plan: "Free Plan",
        projectsCount: 0
      }))

      const computedFullName = profile.first_name || profile.last_name
        ? `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
        : (profile.full_name || null)

      login(
        {
          id: sessionUser.id,
          email: sessionUser.email || email,
          full_name: computedFullName,
          phone: profile.phone,
          bio: profile.bio || null,
          specialty: profile.dedication || profile.specialty || null,
          role: userRole,
        },
        formattedOrgs
      )

      // Navigating to the Organization Selection dashboard
      navigate("/dashboard/organizations", { replace: true })
    } catch (err: any) {
      console.error(err)
      setFormError("Ocurrió un error inesperado. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold font-sans">Iniciar Sesión</h1>
          <p className="text-sm text-balance text-muted-foreground font-sans">
            Ingresa tu correo abajo para acceder a tu cuenta en EventHive
          </p>
        </div>
        {formError && (
          <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
            {formError}
          </div>
        )}
        <Field>
          <FieldLabel htmlFor="email">Correo Electrónico</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={cn("bg-background", errors.email && "border-destructive")}
          />
          {errors.email && <p className="text-xs text-destructive mt-1 font-semibold">{errors.email}</p>}
        </Field>
        <Field>
          <div className="flex items-center">
            <FieldLabel htmlFor="password">Contraseña</FieldLabel>
            <a
              href="#"
              className="ml-auto text-xs underline-offset-4 hover:underline text-muted-foreground"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
          <div className="relative flex items-center">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={cn("bg-background pr-10", errors.password && "border-destructive")}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors outline-none focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive mt-1 font-semibold">{errors.password}</p>}
        </Field>
        <Field>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Validando..." : "Ingresar"}
          </Button>
        </Field>
        <FieldSeparator>O continuar con</FieldSeparator>
        <Field>
          <Button variant="outline" type="button" className="w-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 mr-2" viewBox="0 0 24 24">
              <path
                d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                fill="currentColor"
              />
            </svg>
            GitHub
          </Button>
          <FieldDescription className="text-center mt-4 text-xs">
            ¿No tienes una cuenta?{" "}
            <a href="#" className="underline underline-offset-4 font-semibold text-primary">
              Regístrate
            </a>
          </FieldDescription>
        </Field>
      </FieldGroup>
    </form>
  )
}
