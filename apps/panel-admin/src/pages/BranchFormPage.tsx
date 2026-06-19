import React, { useState, useEffect, useRef } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useAuthStore } from "@/store/auth.store"
import { supabase } from "@/utils/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X, ArrowLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

declare global {
  interface Window {
    L: any
  }
}

export function BranchFormPage() {
  const navigate = useNavigate()
  const { branchId } = useParams()
  const { selectedOrganization } = useAuthStore()

  // Loading States
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [mapReady, setMapReady] = useState(false)

  // Form Fields
  const [name, setName] = useState("")
  const [isMain, setIsMain] = useState(false)
  const [department, setDepartment] = useState("")
  const [province, setProvince] = useState("")
  const [district, setDistrict] = useState("")
  const [address, setAddress] = useState("")
  const [reference, setReference] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [phones, setPhones] = useState<string[]>([])
  const [newPhone, setNewPhone] = useState("")
  const [emails, setEmails] = useState<string[]>([])
  const [newEmail, setNewEmail] = useState("")
  const [isActive, setIsActive] = useState(true)

  // Map reference
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)

  // Dynamically load Leaflet CDN
  useEffect(() => {
    if (window.L) {
      setMapReady(true)
      return
    }

    const cssLink = document.createElement("link")
    cssLink.rel = "stylesheet"
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(cssLink)

    const jsScript = document.createElement("script")
    jsScript.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    jsScript.onload = () => setMapReady(true)
    document.head.appendChild(jsScript)
  }, [])

  // Load existing branch data if editing
  useEffect(() => {
    async function loadBranch() {
      if (!branchId) return
      setIsLoading(true)
      try {
        const { data, error } = await supabase
          .from("organization_branches")
          .select("*")
          .eq("id", branchId)
          .single()

        if (error) throw error
        if (data) {
          setName(data.name)
          setIsMain(data.is_main)
          setDepartment(data.department || "")
          setProvince(data.province || "")
          setDistrict(data.district || "")
          setAddress(data.address || "")
          setReference(data.reference || "")
          setLatitude(data.latitude?.toString() || "")
          setLongitude(data.longitude?.toString() || "")
          setPhones(data.contact_phones || [])
          setEmails(data.contact_emails || [])
          setIsActive(data.is_active)
        }
      } catch (err: any) {
        console.error("Error loading branch details:", err)
        toast.error("No se pudo cargar la información de la sede.")
        navigate("/dashboard/settings/branches")
      } finally {
        setIsLoading(false)
      }
    }

    if (selectedOrganization?.id) {
      loadBranch()
    } else {
      navigate("/dashboard/organizations")
    }
  }, [branchId, selectedOrganization?.id])

  // Initialize and update Map
  useEffect(() => {
    if (!mapReady || isLoading || !document.getElementById("branch-map")) return

    const latVal = parseFloat(latitude) || -12.046374 // Default to Lima, Peru
    const lngVal = parseFloat(longitude) || -77.042793

    // Initialize Map if not already initialized
    if (!mapRef.current) {
      mapRef.current = window.L.map("branch-map").setView([latVal, lngVal], 13)

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(mapRef.current)

      markerRef.current = window.L.marker([latVal, lngVal], {
        draggable: true
      }).addTo(mapRef.current)

      // Event listener for dragging marker
      markerRef.current.on("dragend", () => {
        const position = markerRef.current.getLatLng()
        setLatitude(position.lat.toFixed(6))
        setLongitude(position.lng.toFixed(6))
      })

      // Event listener for clicking map
      mapRef.current.on("click", (e: any) => {
        markerRef.current.setLatLng(e.latlng)
        setLatitude(e.latlng.lat.toFixed(6))
        setLongitude(e.latlng.lng.toFixed(6))
      })
    } else {
      // Update map view and marker position when coordinate values change externally
      const pos = [latVal, lngVal]
      mapRef.current.setView(pos, 13)
      markerRef.current.setLatLng(pos)
    }

    return () => {
      // Cleanup map on component unmount
      if (!branchId && mapRef.current) {
        // Keep it or let it re-initialize
      }
    }
  }, [mapReady, isLoading, latitude, longitude])

  // Handle Tag Input for Phones
  const addPhone = (e: React.MouseEvent) => {
    e.preventDefault()
    const trimmed = newPhone.trim()
    if (trimmed && !phones.includes(trimmed)) {
      setPhones([...phones, trimmed])
      setNewPhone("")
    }
  }

  const removePhone = (index: number) => {
    setPhones(phones.filter((_, i) => i !== index))
  }

  // Handle Tag Input for Emails
  const addEmail = (e: React.MouseEvent) => {
    e.preventDefault()
    const trimmed = newEmail.trim()
    if (trimmed && !emails.includes(trimmed)) {
      if (!/\S+@\S+\.\S+/.test(trimmed)) {
        toast.error("Por favor ingresa un correo válido.")
        return
      }
      setEmails([...emails, trimmed])
      setNewEmail("")
    }
  }

  const removeEmail = (index: number) => {
    setEmails(emails.filter((_, i) => i !== index))
  }

  // Form Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error("El nombre de la sede es requerido.")
      return
    }

    setIsSubmitting(true)
    try {
      if (isMain && selectedOrganization?.id) {
        // Unmark other main branches
        await supabase
          .from("organization_branches")
          .update({ is_main: false })
          .eq("organization_id", selectedOrganization.id)
      }

      const branchPayload = {
        organization_id: selectedOrganization!.id,
        name: name.trim(),
        is_main: isMain,
        department: department.trim() || null,
        province: province.trim() || null,
        district: district.trim() || null,
        address: address.trim() || null,
        reference: reference.trim() || null,
        latitude: latitude.trim() ? parseFloat(latitude) : null,
        longitude: longitude.trim() ? parseFloat(longitude) : null,
        contact_phones: phones,
        contact_emails: emails,
        is_active: isActive
      }

      if (branchId) {
        // Update
        const { error } = await supabase
          .from("organization_branches")
          .update({ ...branchPayload, updated_at: new Date().toISOString() })
          .eq("id", branchId)

        if (error) throw error
        toast.success("Sede actualizada correctamente.")
      } else {
        // Create
        const { error } = await supabase
          .from("organization_branches")
          .insert([branchPayload])

        if (error) throw error
        toast.success("Sede registrada correctamente.")
      }

      navigate("/dashboard/settings/branches")
    } catch (err: any) {
      console.error("Error saving branch:", err)
      toast.error("Ocurrió un error al guardar la sede.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="size-8 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground">Cargando detalles de la sede...</span>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-6 space-y-8 animate-in fade-in duration-300">
      {/* Back to Branches link */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/dashboard/settings/branches")}
          className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors py-1.5 px-3 border border-border rounded-md bg-card cursor-pointer"
        >
          <ArrowLeft className="size-3.5" />
          Volver a Sedes
        </button>
      </div>

      <div className="space-y-1">
        <h1 className="text-3xl font-medium tracking-tight text-foreground font-sans">
          {branchId ? "Editar Sede" : "Agregar Nueva Sede"}
        </h1>
        <p className="text-sm text-muted-foreground font-sans">
          Configura los detalles geográficos, dirección física e información de contacto de esta sede.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {/* Name Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3 space-y-1">
              <label htmlFor="branch-name" className="text-sm font-medium text-foreground">
                Nombre de la Sede <span className="text-destructive">*</span>
              </label>
              <p className="text-xs text-muted-foreground">Nombre identificatorio de esta sede física.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <Input
                id="branch-name"
                placeholder="Ej. Oficina Principal, Sede San Isidro"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Main and Active configuration Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border bg-muted/5">
            <div className="md:w-1/3 space-y-1">
              <label className="text-sm font-medium text-foreground">Estado y Configuración</label>
              <p className="text-xs text-muted-foreground">Configura la visibilidad y rol principal de esta ubicación.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full flex flex-col gap-3">
              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={isMain}
                  onChange={(e) => setIsMain(e.target.checked)}
                  className="size-4 accent-primary rounded border-border"
                  disabled={isSubmitting}
                />
                <span>Establecer como Sede Principal</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 accent-primary rounded border-border"
                  disabled={isSubmitting || isMain} // Main branch must be active
                />
                <span>Sede Activa (Disponible para registrar eventos presenciales)</span>
              </label>
            </div>
          </div>

          {/* Address Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3 space-y-1">
              <label htmlFor="branch-address" className="text-sm font-medium text-foreground">
                Dirección Física
              </label>
              <p className="text-xs text-muted-foreground">Dirección de calle y número.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <Input
                id="branch-address"
                placeholder="Ej. Av. Javier Prado Este 1024"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Ubicación Peru Group Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3 space-y-1">
              <label className="text-sm font-medium text-foreground">Región / Ubicación</label>
              <p className="text-xs text-muted-foreground">Ubigeo político (Departamento, Provincia y Distrito).</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium">Departamento</span>
                <Input
                  placeholder="Ej. Lima"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={isSubmitting}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium">Provincia</span>
                <Input
                  placeholder="Ej. Lima"
                  value={province}
                  onChange={(e) => setProvince(e.target.value)}
                  disabled={isSubmitting}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium">Distrito</span>
                <Input
                  placeholder="Ej. San Isidro"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  disabled={isSubmitting}
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Reference Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3 space-y-1">
              <label htmlFor="branch-ref" className="text-sm font-medium text-foreground">
                Referencia
              </label>
              <p className="text-xs text-muted-foreground">Detalles adicionales para encontrar la sede.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full">
              <Input
                id="branch-ref"
                placeholder="Ej. Al lado de la clínica Ricardo Palma"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Coordinates and Map Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3 space-y-1">
              <label className="text-sm font-medium text-foreground">Coordenadas y Mapa</label>
              <p className="text-xs text-muted-foreground">
                Haz clic en el mapa o arrastra el marcador para seleccionar la ubicación exacta.
              </p>
            </div>
            <div className="md:w-2/3 max-w-md w-full space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Latitud</span>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-12.0945"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground font-medium">Longitud</span>
                  <Input
                    type="number"
                    step="any"
                    placeholder="-77.0321"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Map Container */}
              <div className="relative">
                <div
                  id="branch-map"
                  className="h-[280px] w-full rounded-xl border border-border bg-muted/10 z-0 overflow-hidden"
                />
                {!mapReady && (
                  <div className="absolute inset-0 bg-background/80 flex items-center justify-center gap-2 rounded-xl">
                    <Loader2 className="size-4 text-primary animate-spin" />
                    <span className="text-xs text-muted-foreground">Iniciando mapa interactivo...</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Contact Phones Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3 space-y-1">
              <label className="text-sm font-medium text-foreground">Teléfonos de Contacto</label>
              <p className="text-xs text-muted-foreground">Agrega múltiples números de teléfono para esta sede.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Ej. 987654321, 014445555"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value.replace(/[^0-9+\s-]/g, ""))}
                  disabled={isSubmitting}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPhone(e as any))}
                />
                <Button type="button" variant="outline" onClick={addPhone} disabled={isSubmitting} className="cursor-pointer">
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {phones.map((phone, idx) => (
                  <span
                    key={idx}
                    className="bg-muted border border-border text-foreground text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium animate-in zoom-in-95 duration-100"
                  >
                    {phone}
                    <button
                      type="button"
                      onClick={() => removePhone(idx)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer outline-none"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {phones.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No hay teléfonos registrados.</span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Emails Row */}
          <div className="flex flex-col md:flex-row md:items-start justify-between p-6 gap-4 border-b border-border">
            <div className="md:w-1/3 space-y-1">
              <label className="text-sm font-medium text-foreground">Correos de Contacto</label>
              <p className="text-xs text-muted-foreground">Agrega múltiples correos oficiales para esta sede.</p>
            </div>
            <div className="md:w-2/3 max-w-md w-full space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Ej. miraflores@organizacion.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value.trim())}
                  disabled={isSubmitting}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addEmail(e as any))}
                />
                <Button type="button" variant="outline" onClick={addEmail} disabled={isSubmitting} className="cursor-pointer">
                  Agregar
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {emails.map((email, idx) => (
                  <span
                    key={idx}
                    className="bg-muted border border-border text-foreground text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 font-medium animate-in zoom-in-95 duration-100"
                  >
                    {email}
                    <button
                      type="button"
                      onClick={() => removeEmail(idx)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer outline-none"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
                {emails.length === 0 && (
                  <span className="text-xs text-muted-foreground italic">No hay correos registrados.</span>
                )}
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="bg-muted/10 px-6 py-4 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/dashboard/settings/branches")}
              disabled={isSubmitting}
              className="cursor-pointer font-sans"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="font-medium px-5 transition-colors font-sans"
            >
              {isSubmitting ? "Guardando..." : branchId ? "Guardar Cambios" : "Crear Sede"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
