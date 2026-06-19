import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { useEventStore } from "@/store/event.store"
import { Search, Plus, Layers, ShieldCheck, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"

export function OrganizationsPage() {
  const { organizations, selectOrganization, setOrganizations } = useAuthStore()
  const { loadData } = useEventStore()
  const navigate = useNavigate()

  const [search, setSearch] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newOrgName, setNewOrgName] = useState("")
  const [newOrgDesc, setNewOrgDesc] = useState("")

  const filteredOrgs = organizations.filter((org) =>
    org.name.toLowerCase().includes(search.toLowerCase())
  )

  const handleSelect = (org: any) => {
    selectOrganization(org)
    loadData(org.id) // Load events for this organization
    navigate("/dashboard")
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newOrgName.trim()) return

    const newOrg = {
      id: crypto.randomUUID(),
      name: newOrgName,
      slug: newOrgName.toLowerCase().replace(/\s+/g, "-"),
      description: newOrgDesc,
      isActive: true,
      plan: "Free Plan",
      projectsCount: 0
    }

    const updated = [...organizations, newOrg]
    setOrganizations(updated)
    setIsModalOpen(false)
    setNewOrgName("")
    setNewOrgDesc("")
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-8 md:p-16 max-w-6xl mx-auto space-y-12 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight font-sans">EventHive</h1>
          <p className="text-muted-foreground text-sm mt-1">Elige o crea una organización para administrar tus eventos.</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full w-fit">
          <ShieldCheck className="size-4" />
          Sesión Activa
        </div>
      </div>

      {/* Main title & Action Row */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold font-sans">Tus Organizaciones</h2>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar organización..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-card"
            />
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-2"
          >
            <Plus className="size-4" />
            Nueva organización
          </Button>
        </div>
      </div>

      {/* Grid of Organizations */}
      {filteredOrgs.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-card space-y-4">
          <Layers className="size-12 mx-auto text-muted-foreground" />
          <h3 className="font-bold text-lg">No se encontraron organizaciones</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            {search ? "Intenta con otro término de búsqueda o" : "Registra tu primera organización para"} empezar a publicar eventos.
          </p>
          {!search && (
            <Button onClick={() => setIsModalOpen(true)} variant="outline">
              Crear Organización
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredOrgs.map((org) => (
            <div
              key={org.id}
              onClick={() => handleSelect(org)}
              className="group p-6 bg-card border border-border rounded-xl hover:border-emerald-500 hover:shadow-md cursor-pointer transition-all flex items-start gap-4"
            >
              {/* Left logo icon */}
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-600/10 text-emerald-600 font-bold text-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                {org.name.charAt(0).toUpperCase()}
              </div>
              {/* Metadata */}
              <div className="space-y-1 overflow-hidden flex-1">
                <h3 className="font-semibold text-base truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {org.name}
                </h3>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span className="font-medium bg-muted px-2 py-0.5 rounded-md">{org.plan || "Free Plan"}</span>
                  <span>•</span>
                  <span>{org.projectsCount ?? 2} eventos</span>
                </div>
                {org.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1 pt-1">{org.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-xl w-full max-w-md relative shadow-xl space-y-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground outline-none"
            >
              <X className="size-4" />
            </button>
            <div className="space-y-1">
              <h3 className="text-lg font-bold">Crear Nueva Organización</h3>
              <p className="text-xs text-muted-foreground">Escribe el nombre y la descripción para registrar tu organización.</p>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="orgName">Nombre de la Organización</FieldLabel>
                  <Input
                    id="orgName"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    placeholder="Ej. Tech Latam, Open Source Group"
                    required
                    className="bg-background"
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor="orgDesc">Descripción (Opcional)</FieldLabel>
                  <Input
                    id="orgDesc"
                    value={newOrgDesc}
                    onChange={(e) => setNewOrgDesc(e.target.value)}
                    placeholder="Ej. Organización enfocada en eventos tecnológicos de Latinoamérica."
                    className="bg-background"
                  />
                </Field>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Crear y Continuar
                  </Button>
                </div>
              </FieldGroup>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
