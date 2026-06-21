import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { useAdminProfilesStore } from "@/store/admin-profiles.store"
import { Search, SlidersHorizontal, UserCheck, Eye, EyeOff, Plus, ExternalLink } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { z } from "zod"
import { toast } from "sonner"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"
import { useSEO } from "@/hooks/use-seo"
import { DataTable, type ColumnDef } from "@/components/ui/data-table"

export function ProfilesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { profiles, isLoading, loadAllProfiles, createProfile } = useAdminProfilesStore()

  // Register Form states
  const isSheetOpen = searchParams.get("new") === "true"
  const setIsSheetOpen = (open: boolean) => {
    if (open) {
      setSearchParams({ new: "true" })
    } else {
      setSearchParams({})
    }
  }
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [identityDocumentType, setIdentityDocumentType] = useState("")
  const [identityDocumentNumber, setIdentityDocumentNumber] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [institution, setInstitution] = useState("")
  const [dedication, setDedication] = useState("")
  const [bio, setBio] = useState("")
  const [globalRole, setGlobalRole] = useState("user")
  const [accountType, setAccountType] = useState("basic")
  
  const [formError, setFormError] = useState("")

  const profileFormSchema = z.object({
    firstName: z.string().trim().min(1, "El nombre es obligatorio."),
    lastName: z.string().trim().min(1, "El apellido es obligatorio."),
    email: z.string().trim().email("Formato de correo no válido.").or(z.literal("")).optional().nullable(),
    avatarUrl: z.string().trim().url("El enlace del avatar debe ser una URL válida.").or(z.literal("")).optional().nullable(),
    phone: z.string().trim().optional().nullable(),
    identityDocumentType: z.string().trim().optional().nullable(),
    identityDocumentNumber: z.string().trim().optional().nullable(),
    institution: z.string().trim().optional().nullable(),
    dedication: z.string().trim().optional().nullable(),
    bio: z.string().trim().optional().nullable(),
    globalRole: z.string().min(1),
    accountType: z.string().min(1),
  })

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError("")

    const validation = profileFormSchema.safeParse({
      firstName,
      lastName,
      email: email || null,
      avatarUrl: avatarUrl || null,
      phone: phone || null,
      identityDocumentType: identityDocumentType || null,
      identityDocumentNumber: identityDocumentNumber || null,
      institution: institution || null,
      dedication: dedication || null,
      bio: bio || null,
      globalRole,
      accountType,
    })

    if (!validation.success) {
      setFormError(validation.error.issues[0].message)
      return
    }

    try {
      await createProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim() || null,
        avatarUrl: avatarUrl.trim() || null,
        phone: phone.trim() || null,
        identityDocumentType: identityDocumentType || null,
        identityDocumentNumber: identityDocumentNumber.trim() || null,
        institution: institution.trim() || null,
        dedication: dedication.trim() || null,
        bio: bio.trim() || null,
        globalRole,
        accountType,
      })

      toast.success("Perfil registrado correctamente")
      setIsSheetOpen(false)
      // Reset form
      setFirstName("")
      setLastName("")
      setEmail("")
      setPhone("")
      setIdentityDocumentType("")
      setIdentityDocumentNumber("")
      setAvatarUrl("")
      setInstitution("")
      setDedication("")
      setBio("")
      setGlobalRole("user")
      setAccountType("basic")
    } catch (err: any) {
      console.error(err)
      if (err?.message?.includes("profiles_email_key")) {
        setFormError("El correo electrónico ya está registrado por otro perfil.")
      } else if (err?.message?.includes("profiles_identity_document_number_key")) {
        setFormError("El número de documento de identidad ya está registrado por otro perfil.")
      } else {
        setFormError(err?.message || "Ocurrió un error al registrar el perfil.")
      }
    }
  }

  useSEO({
    title: "Directorio de Perfiles Registrados",
    description: "Busca, filtra y gestiona los roles, privilegios y estado de todos los perfiles de usuario registrados en la plataforma."
  })

  useEffect(() => {
    loadAllProfiles()
  }, [loadAllProfiles])

  // Filter states
  const [searchQuery, setSearchQuery] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [accountTypeFilter, setAccountTypeFilter] = useState("all")

  // Filter logic
  const filteredProfiles = profiles.filter((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase()
    const email = (p.email || "").toLowerCase()
    const matchesSearch =
      fullName.includes(searchQuery.toLowerCase()) ||
      email.includes(searchQuery.toLowerCase())

    const matchesRole = roleFilter === "all" || p.globalRole === roleFilter
    const matchesAccount = accountTypeFilter === "all" || p.accountType === accountTypeFilter

    return matchesSearch && matchesRole && matchesAccount
  })

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ""
    return new Date(dateStr).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric"
    })
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-bold">Admin</Badge>
      case "developer":
        return <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20 font-bold">Developer</Badge>
      default:
        return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Usuario</Badge>
    }
  }

  const getAccountBadge = (type: string) => {
    switch (type) {
      case "enterprise":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-bold">Enterprise</Badge>
      case "premium":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold">Premium</Badge>
      default:
        return <Badge className="bg-slate-500/10 text-slate-500 border-slate-500/20">Gratuito</Badge>
    }
  }

  const columns: ColumnDef<any>[] = [
    {
      header: "Usuario",
      cell: (p) => {
        const fullName = `${p.firstName} ${p.lastName}`.trim() || "Usuario sin nombre"
        const avatarSeed = encodeURIComponent(fullName || p.email || "User")
        return (
          <div className="flex items-center gap-3">
            <img
              src={p.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${avatarSeed}`}
              alt={fullName}
              className="size-9 rounded-lg object-cover border border-border/80"
            />
            <div className="space-y-0.5">
              <p className="font-bold text-sm text-foreground">{fullName}</p>
              <p className="text-xs text-muted-foreground">{p.email || "Sin correo"}</p>
            </div>
          </div>
        )
      }
    },
    {
      header: "Rol Global",
      cell: (p) => getRoleBadge(p.globalRole)
    },
    {
      header: "Plan / Cuenta",
      cell: (p) => getAccountBadge(p.accountType)
    },
    {
      header: "Estado",
      cell: (p) => p.isPublic ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-500 font-semibold">
          <Eye className="size-3.5" />
          Público
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-semibold">
          <EyeOff className="size-3.5" />
          Privado
        </span>
      )
    },
    {
      header: "Registro",
      className: "text-xs text-muted-foreground",
      cell: (p) => formatDate(p.createdAt)
    },
    {
      header: "Acción",
      headerClassName: "text-right",
      className: "text-right",
      cell: (p) => (
        <Button
          asChild
          variant="outline"
          className="text-xs h-8 px-3 font-semibold gap-1.5"
        >
          <a
            href={`/dashboard/profiles/${p.id}/info`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span>Gestionar</span>
            <ExternalLink className="size-3" />
          </a>
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      <PageHeader
        title="Perfiles Registrados"
        description="Explora, busca y administra las cuentas, accesos y privilegios globales de los usuarios de la plataforma."
        actionButton={
          <Button onClick={() => setIsSheetOpen(true)} className="flex items-center gap-2">
            <Plus className="size-4" />
            Registrar Perfil
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between bg-card p-4 rounded-xl border border-border/80">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido o correo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="size-4 text-muted-foreground mr-1 hidden sm:block" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Rol:</span>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Todos los roles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                <SelectItem value="user">Usuario</SelectItem>
                <SelectItem value="admin">Administrador</SelectItem>
                <SelectItem value="developer">Developer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium whitespace-nowrap">Cuenta:</span>
            <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="Todas las cuentas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las cuentas</SelectItem>
                <SelectItem value="basic">Gratuito</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Profiles list table */}
      {isLoading ? (
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="p-4 bg-muted/20 border-b border-border h-12 animate-pulse" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 border-b border-border/50 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 w-1/3">
                <div className="size-9 rounded-lg bg-muted shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
              <div className="h-6 bg-muted rounded w-20" />
              <div className="h-6 bg-muted rounded w-20" />
              <div className="h-8 bg-muted rounded w-24" />
            </div>
          ))}
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="p-16 text-center text-muted-foreground text-sm border border-dashed border-border rounded-xl bg-card/20 space-y-3">
          <UserCheck className="size-10 mx-auto opacity-30" />
          <div>
            <p className="font-semibold text-lg text-foreground">No se encontraron perfiles</p>
            <p className="text-xs text-muted-foreground">
              Intenta cambiar los términos de búsqueda o los filtros aplicados.
            </p>
          </div>
        </div>
      ) : (
        <DataTable columns={columns} data={filteredProfiles} />
      )}

      {/* Register Profile Sheet Form */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent className="overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Registrar Nuevo Perfil</SheetTitle>
            <SheetDescription>
              Crea un nuevo perfil de usuario de forma manual en la plataforma.
            </SheetDescription>
          </SheetHeader>

          <form onSubmit={handleSave} className="space-y-5 px-6 py-6">
            <FieldGroup>
              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="regFirstName">Nombre *</FieldLabel>
                  <Input
                    id="regFirstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ej. Juan"
                    required
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="regLastName">Apellido *</FieldLabel>
                  <Input
                    id="regLastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Ej. Pérez"
                    required
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="regEmail">Correo Electrónico</FieldLabel>
                <Input
                  id="regEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juan.perez@example.com"
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="regPhone">Teléfono</FieldLabel>
                <Input
                  id="regPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Ej. +51 987654321"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="regDocType">Tipo de Documento</FieldLabel>
                  <select
                    id="regDocType"
                    value={identityDocumentType}
                    onChange={(e) => setIdentityDocumentType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">Ninguno</option>
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="OTROS">Otros</option>
                  </select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="regDocNumber">Número de Documento</FieldLabel>
                  <Input
                    id="regDocNumber"
                    value={identityDocumentNumber}
                    onChange={(e) => setIdentityDocumentNumber(e.target.value)}
                    placeholder="Ej. 12345678"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="regAvatarUrl">URL del Avatar</FieldLabel>
                <Input
                  id="regAvatarUrl"
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://ejemplo.com/avatar.png"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="regInstitution">Institución</FieldLabel>
                  <Input
                    id="regInstitution"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="Ej. Universidad"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="regDedication">Dedicación / Rol</FieldLabel>
                  <Input
                    id="regDedication"
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    placeholder="Ej. Desarrollador"
                  />
                </Field>
              </div>

              <Field>
                <FieldLabel htmlFor="regBio">Biografía</FieldLabel>
                <textarea
                  id="regBio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Acerca del usuario..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-xs"
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field>
                  <FieldLabel htmlFor="regGlobalRole">Rol Global</FieldLabel>
                  <select
                    id="regGlobalRole"
                    value={globalRole}
                    onChange={(e) => setGlobalRole(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="user">Usuario Regular</option>
                    <option value="admin">Administrador</option>
                    <option value="developer">Developer</option>
                  </select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="regAccountType">Plan / Cuenta</FieldLabel>
                  <select
                    id="regAccountType"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="basic">Gratuito</option>
                    <option value="premium">Premium</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </Field>
              </div>
            </FieldGroup>

            {formError && (
              <p className="text-sm text-destructive font-medium mt-2">{formError}</p>
            )}

            <SheetFooter className="pt-4 border-t border-border gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsSheetOpen(false)} className="w-full sm:w-auto">
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                Registrar Perfil
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
