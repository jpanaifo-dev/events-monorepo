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
import { api } from "@/api/client"
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<"login" | "forgot">("login")

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})
    setFormError(null)
    setSuccessMessage(null)
    setIsLoading(true)

    if (!email) {
      setErrors({ email: "El correo electrónico es requerido" })
      setIsLoading(false)
      return
    }

    try {
      await api.auth.forgotPassword(email)
      setSuccessMessage("Si el correo existe, recibirás instrucciones para restablecer tu contraseña.")
    } catch (err: any) {
      console.error(err)
      setFormError("Ocurrió un error inesperado. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }


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
      const authData = await api.auth.login(email, password)
      localStorage.setItem("events-api-access-token", authData.accessToken)
      const sessionUser = authData.user
      const profile = authData.user

      const userRole = sessionUser.role || "USER"
      const orgsData = await api.organizations.list()

      // Map to Organization model
      const formattedOrgs = (orgsData || []).map((org: any) => ({
        id: org.id,
        name: org.name,
        slug: org.slug || org.name.toLowerCase().replace(/\s+/g, "-"),
        description: org.description || "",
        isActive: true,
        type: "organization",
        logoUrl: org.logoUrl || "",
        coverUrl: org.coverUrl || "",
        faviconUrl: "",
        plan: "Free Plan",
        projectsCount: 0
      }))

      const computedFullName = profile.firstName || profile.lastName
        ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
        : (profile.fullName || null)

      login(
        {
          id: sessionUser.id,
          email: sessionUser.email || email,
          full_name: computedFullName,
          phone: profile.phone || null,
          bio: profile.bio || null,
          specialty: profile.specialty || null,
          role: userRole,
        },
        formattedOrgs
      )

      // Navigating to the Organization Selection dashboard
      navigate(["SUPER_ADMIN", "ADMIN", "SAAS_ADMIN"].includes(sessionUser.role) ? "/admin" : "/dashboard/organizations", { replace: true })
    } catch (err: any) {
      console.error(err)
      setFormError("Ocurrió un error inesperado. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
      setLoading(false)
    }
  }

  if (mode === "forgot") {
    return (
      <form onSubmit={handleForgotPassword} className={cn("flex flex-col gap-6", className)} {...props}>
        <FieldGroup>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-2xl font-bold font-sans">Recuperar Contraseña</h1>
            <p className="text-sm text-balance text-muted-foreground font-sans">
              Ingresa tu correo para recibir instrucciones de restauración.
            </p>
          </div>
          {formError && (
            <div className="p-3 text-xs font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-md text-center">
              {formError}
            </div>
          )}
          {successMessage && (
            <div className="p-3 text-xs font-semibold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-center">
              {successMessage}
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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Instrucciones"}
            </Button>
          </Field>
          <Field>
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setFormError(null)
                setSuccessMessage(null)
              }}
              className="w-full text-center text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors mt-2 cursor-pointer bg-transparent border-0 outline-none"
            >
              Volver a Iniciar Sesión
            </button>
          </Field>
        </FieldGroup>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn("flex flex-col gap-6", className)} {...props}>
      <FieldGroup>
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-bold font-sans">Iniciar Sesión</h1>
          <p className="text-sm text-balance text-muted-foreground font-sans">
            Ingresa tu correo abajo para acceder a tu cuenta en Zynqro
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
            <button
              type="button"
              onClick={() => {
                setMode("forgot")
                setFormError(null)
                setSuccessMessage(null)
              }}
              className="ml-auto text-xs underline-offset-4 hover:underline text-muted-foreground cursor-pointer bg-transparent border-0 outline-none"
            >
              ¿Olvidaste tu contraseña?
            </button>
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
