import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Plus, MapPin, Phone, Mail, Edit, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface Branch {
  id: string
  organization_id: string
  name: string
  is_main: boolean
  department: string | null
  province: string | null
  district: string | null
  address: string | null
  reference: string | null
  latitude: number | null
  longitude: number | null
  contact_phones: string[]
  contact_emails: string[]
  is_active: boolean
  created_at: string
}

export function BranchesPage() {
  const navigate = useNavigate()
  const { selectedOrganization } = useAuthStore()

  // State
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Load branches
  const fetchBranches = async () => {
    if (!selectedOrganization?.id) return
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("organization_branches")
        .select("*")
        .eq("organization_id", selectedOrganization.id)
        .order("is_main", { ascending: false })
        .order("created_at", { ascending: true })

      if (error) throw error
      setBranches(data || [])
    } catch (err: any) {
      console.error("Error fetching branches:", err)
      toast.error("Error al cargar las sedes.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (!selectedOrganization?.id) {
      navigate("/dashboard/organizations")
      return
    }
    fetchBranches()
  }, [selectedOrganization?.id])

  // Delete Branch
  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("¿Estás seguro de que deseas eliminar esta sede? Esta acción no se puede deshacer.")
    if (!confirmed) return

    try {
      const { error } = await supabase
        .from("organization_branches")
        .delete()
        .eq("id", id)

      if (error) throw error
      toast.success("Sede eliminada con éxito.")
      fetchBranches()
    } catch (err: any) {
      console.error("Error deleting branch:", err)
      toast.error("No se pudo eliminar la sede.")
    }
  }

  // Filtered list
  const filteredBranches = branches.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.address && b.address.toLowerCase().includes(search.toLowerCase())) ||
    (b.department && b.department.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        title="Gestionar Sedes"
        description={`Administra las sucursales, oficinas principales y ubicaciones físicas de ${selectedOrganization?.name}.`}
        showBackButton
        onBackClick={() => navigate("/dashboard/settings/business")}
        actionButton={
          <Button onClick={() => navigate("/dashboard/settings/branches/new")} className="flex items-center gap-2">
            <Plus className="size-4" />
            Agregar Sede
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-xl border border-border">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, dirección o región..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-background"
          />
        </div>
        <div className="text-xs text-muted-foreground">
          {filteredBranches.length} sede{filteredBranches.length !== 1 && "s"} encontrada{filteredBranches.length !== 1 && "s"}
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 h-[180px] animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-1/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-border rounded-xl bg-card space-y-4">
          <MapPin className="size-12 mx-auto text-muted-foreground" />
          <h3 className="font-bold text-lg">No hay sedes registradas</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Registra las sucursales de tu organización para indicar los lugares donde ocurren tus eventos presenciales.
          </p>
          <Button onClick={() => navigate("/dashboard/settings/branches/new")} variant="outline">
            Registrar Primera Sede
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className={`bg-card border rounded-xl p-6 transition-all relative flex flex-col justify-between gap-4 hover:shadow-md ${
                branch.is_main ? "border-primary/50 dark:border-primary/30 ring-1 ring-primary/20" : "border-border"
              } ${!branch.is_active && "opacity-60"}`}
            >
              {/* Badges and Top Actions */}
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-base text-foreground truncate max-w-[240px]">
                      {branch.name}
                    </h3>
                    {branch.is_main && (
                      <span className="bg-primary/10 border border-primary/25 text-primary text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Principal
                      </span>
                    )}
                    {!branch.is_active && (
                      <span className="bg-muted border border-border text-muted-foreground text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                        Inactivo
                      </span>
                    )}
                  </div>
                  
                  {/* Address */}
                  {branch.address && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <MapPin className="size-3.5 shrink-0 text-muted-foreground/60" />
                      <span className="truncate">
                        {branch.address}
                        {(branch.district || branch.province || branch.department) && " - "}
                        {[branch.district, branch.province, branch.department].filter(Boolean).join(", ")}
                      </span>
                    </p>
                  )}
                  {branch.reference && (
                    <p className="text-[10px] text-muted-foreground/80 italic pl-5">
                      Ref: {branch.reference}
                    </p>
                  )}
                </div>

                {/* Edit & Delete Action Panel */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/dashboard/settings/branches/${branch.id}/edit`)}
                    className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"
                    title="Editar"
                  >
                    <Edit className="size-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(branch.id)}
                    className="p-1.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-lg transition-colors cursor-pointer"
                    title="Eliminar"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Coordinates and Contact details */}
              <div className="border-t border-border pt-4 flex flex-col gap-2.5 text-xs text-muted-foreground">
                {/* Coordinates */}
                {(branch.latitude !== null || branch.longitude !== null) && (
                  <div className="flex gap-4 text-[10px] font-mono bg-muted/30 px-2 py-1 rounded-md w-fit">
                    {branch.latitude !== null && <span>Lat: {branch.latitude}</span>}
                    {branch.longitude !== null && <span>Long: {branch.longitude}</span>}
                  </div>
                )}

                {/* Phones & Emails */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 flex-wrap">
                  {/* Phones list */}
                  {branch.contact_phones && branch.contact_phones.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Phone className="size-3.5 text-muted-foreground/60 shrink-0" />
                      {branch.contact_phones.map((p, idx) => (
                        <span key={idx} className="bg-muted px-2 py-0.5 rounded-md text-[10px] font-medium">
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] italic text-muted-foreground/40 flex items-center gap-1">
                      <Phone className="size-3 text-muted-foreground/30" /> Sin teléfonos
                    </span>
                  )}

                  {/* Emails list */}
                  {branch.contact_emails && branch.contact_emails.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Mail className="size-3.5 text-muted-foreground/60 shrink-0" />
                      {branch.contact_emails.map((e, idx) => (
                        <span key={idx} className="bg-muted px-2 py-0.5 rounded-md text-[10px] font-medium truncate max-w-[130px]" title={e}>
                          {e}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] italic text-muted-foreground/40 flex items-center gap-1">
                      <Mail className="size-3 text-muted-foreground/30" /> Sin correos
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
