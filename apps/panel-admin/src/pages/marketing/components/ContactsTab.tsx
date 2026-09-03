import { useState } from "react"
import {
  Search,
  Trash2,
  UserPlus,
  Download,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import type { Contact } from "../types"

interface ContactsTabProps {
  contacts: Contact[]
  onAddContact: (contact: { email: string; firstName?: string; lastName?: string; tags?: string[] }) => void
  onDeleteContact: (id: string) => void
}

export function ContactsTab({
  contacts,
  onAddContact,
  onDeleteContact,
}: ContactsTabProps) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("ALL")
  const [openModal, setOpenModal] = useState(false)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [tagInput, setTagInput] = useState("")

  const filteredContacts = contacts.filter((c) => {
    const email = c.email || ""
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase()
    const matchesSearch =
      email.toLowerCase().includes(search.toLowerCase()) ||
      fullName.includes(search.toLowerCase()) ||
      c.tags?.some((t) => (t || "").toLowerCase().includes(search.toLowerCase()))
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    onAddContact({
      email: email.trim(),
      firstName: firstName.trim() || undefined,
      lastName: lastName.trim() || undefined,
      tags: tagInput ? tagInput.split(",").map((t) => t.trim()) : ["Nuevo"],
    })

    setEmail("")
    setFirstName("")
    setLastName("")
    setTagInput("")
    setOpenModal(false)
    toast.success("Contacto añadido a tu base de datos")
  }

  const handleExportCSV = () => {
    toast.success("Exportando base de contactos en formato CSV...")
  }

  return (
    <div className="space-y-5">
      {/* Top Filter & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o etiqueta..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9 text-xs rounded-xl border-border bg-background"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
          >
            <option value="ALL">Todos los estados</option>
            <option value="SUBSCRIBED">Suscritos</option>
            <option value="UNSUBSCRIBED">Desuscritos</option>
            <option value="BOUNCED">Rebotados</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="rounded-xl h-9 px-3 text-xs font-semibold"
          >
            <Download className="mr-1.5 size-3.5 text-muted-foreground" />
            Exportar
          </Button>

          <Button
            onClick={() => setOpenModal(true)}
            className="rounded-xl h-9 px-4 font-semibold bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-primary dark:text-primary-foreground text-xs shadow-sm flex items-center gap-1.5"
          >
            <UserPlus className="size-3.5" />
            <span>Añadir contacto</span>
          </Button>
        </div>
      </div>

      {/* Contacts Table */}
      <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left font-semibold text-muted-foreground border-b border-border">
              <tr>
                <th className="p-3.5 pl-5">Contacto / Nombre</th>
                <th className="p-3.5">Correo electrónico</th>
                <th className="p-3.5">Estado</th>
                <th className="p-3.5">Etiquetas</th>
                <th className="p-3.5">Fecha de alta</th>
                <th className="p-3.5 pr-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No se encontraron contactos registrados.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => {
                  const fullName = [contact.firstName, contact.lastName].filter(Boolean).join(" ")

                  return (
                    <tr key={contact.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 pl-5 font-bold text-foreground">
                        {fullName || "—"}
                      </td>
                      <td className="p-3.5 text-foreground font-medium">
                        {contact.email}
                      </td>
                      <td className="p-3.5">
                        <Badge
                          variant="secondary"
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold border-0 ${contact.status === "SUBSCRIBED"
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : contact.status === "BOUNCED"
                              ? "bg-red-500/10 text-red-600 dark:text-red-400"
                              : "bg-muted text-muted-foreground"
                            }`}
                        >
                          {contact.status === "SUBSCRIBED"
                            ? "Suscrito"
                            : contact.status === "BOUNCED"
                              ? "Rebotado"
                              : "Desuscrito"}
                        </Badge>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {contact.tags?.map((t) => (
                            <span
                              key={t}
                              className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 text-muted-foreground">
                        {new Date(contact.createdAt).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => onDeleteContact(contact.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 rounded-lg hover:bg-muted"
                          title="Eliminar contacto"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-[480px] p-6 rounded-3xl border-border bg-card">
          <DialogHeader className="space-y-1 text-left pb-2">
            <DialogTitle className="text-xl font-bold text-foreground">
              Añadir contacto
            </DialogTitle>
            <p className="text-xs text-muted-foreground">
              Agrega un suscriptor manual a tu base de marketing.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Correo electrónico <span className="text-red-500">*</span>
              </label>
              <Input
                required
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Nombre</label>
                <Input
                  placeholder="Juan"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">Apellido</label>
                <Input
                  placeholder="Pérez"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">
                Etiquetas (separadas por coma)
              </label>
              <Input
                placeholder="CONIAP 2024, Ponente, VIP"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="rounded-xl h-10 text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenModal(false)}
                className="rounded-full text-xs h-9 px-4"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="rounded-full text-xs h-9 px-5 bg-neutral-900 text-white dark:bg-primary dark:text-primary-foreground font-semibold"
              >
                Guardar contacto
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
