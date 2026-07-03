import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "@/utils/supabase"
import { Award, CheckCircle2, AlertTriangle, ShieldAlert, Calendar, User, FileText, Globe } from "lucide-react"

export function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>()
  const [loading, setLoading] = useState(true)
  const [cert, setCert] = useState<any>(null)
  const [template, setTemplate] = useState<any>(null)
  const [event, setEvent] = useState<any>(null)
  const [edition, setEdition] = useState<any>(null)
  const [participantName, setParticipantName] = useState<string>("")
  const [errorMsg, setErrorMsg] = useState<string>("")

  useEffect(() => {
    if (!code) return

    const verify = async () => {
      try {
        setLoading(true)
        setErrorMsg("")

        // 1. Fetch certificate
        const { data: certData, error: certError } = await supabase
          .from("participant_certificates")
          .select("*")
          .eq("validation_code", code)
          .maybeSingle()

        if (certError) throw certError
        if (!certData) {
          setErrorMsg("Código de verificación no válido o certificado no encontrado.")
          setLoading(false)
          return
        }

        setCert(certData)

        // 2. Fetch template
        const { data: templateData, error: templateError } = await supabase
          .from("certificate_templates")
          .select("*")
          .eq("id", certData.template_id)
          .maybeSingle()

        if (templateError) throw templateError
        setTemplate(templateData)

        // 3. Fetch edition and event
        if (templateData) {
          const { data: editionData } = await supabase
            .from("editions")
            .select("*")
            .eq("id", templateData.edition_id)
            .maybeSingle()
          setEdition(editionData)

          if (editionData) {
            const { data: eventData } = await supabase
              .from("main_events")
              .select("*")
              .eq("id", editionData.main_event_id)
              .maybeSingle()
            setEvent(eventData)
          }
        }

        // 4. Fetch participant full name from event_participants joining profile
        const { data: partData } = await supabase
          .from("event_participants")
          .select(`
            id,
            profile:profile_id (
              first_name,
              last_name,
              email
            )
          `)
          .eq("id", certData.participant_id)
          .maybeSingle()

        if (partData?.profile) {
          const profile: any = partData.profile
          const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim()
          setParticipantName(fullName || "Participante")
        } else {
          setParticipantName("Participante")
        }

        // 5. If not revoked, increment validation count & create log
        if (!certData.is_revoked) {
          const newCount = (certData.validations_count || 0) + 1
          await supabase
            .from("participant_certificates")
            .update({ validations_count: newCount })
            .eq("id", certData.id)

          await supabase
            .from("certificate_tracking_logs")
            .insert([{
              certificate_id: certData.id,
              action_type: "validation",
              ip_address: "127.0.0.1",
              user_agent: navigator.userAgent || "browser"
            }])
        }

      } catch (err: any) {
        console.error("Error verifying certificate:", err)
        setErrorMsg("Ocurrió un error al procesar la verificación del certificado.")
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col items-center justify-center p-6">
        <Award className="size-16 text-indigo-400 animate-pulse mb-4" />
        <p className="text-sm font-medium text-slate-400">Verificando autenticidad del certificado...</p>
      </div>
    )
  }

  const isRevoked = cert?.is_revoked

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Decorative background glow */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full blur-3xl opacity-15 pointer-events-none ${
        errorMsg || isRevoked ? "bg-red-500" : "bg-indigo-500"
      }`} />

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl relative overflow-hidden flex flex-col items-center z-10">
        
        {errorMsg ? (
          // Certificate Not Found / Error
          <div className="text-center space-y-6 w-full animate-in fade-in zoom-in duration-300">
            <div className="size-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-100">Verificación Fallida</h2>
              <p className="text-sm text-slate-450 leading-relaxed px-4">{errorMsg}</p>
            </div>
            <div className="pt-2 border-t border-slate-800/60">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">Zynqro Events Platform</p>
            </div>
          </div>
        ) : isRevoked ? (
          // Revoked Certificate
          <div className="text-center space-y-6 w-full animate-in fade-in zoom-in duration-300">
            <div className="size-16 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <ShieldAlert className="size-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-red-400">Certificado Revocado</h2>
              <p className="text-xs text-slate-400 leading-normal px-4">
                Este certificado (Código: <span className="font-mono font-bold text-slate-200">{code}</span>) ha sido marcado como **inválido o revocado** por la organización emisora.
              </p>
            </div>
            
            <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 text-left space-y-3 w-full text-xs">
              <div className="flex items-center gap-2.5 text-slate-400">
                <User className="size-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-bold">Destinatario original</p>
                  <p className="font-semibold text-slate-300 mt-0.5">{participantName}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 text-slate-400 border-t border-slate-850/60 pt-2.5">
                <Award className="size-4 shrink-0 text-slate-500" />
                <div>
                  <p className="text-[10px] uppercase text-slate-600 font-bold">Diploma</p>
                  <p className="font-semibold text-slate-300 mt-0.5">{template?.name || "Diploma de participación"}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-[10px] text-slate-505 uppercase tracking-wider">Zynqro Events Platform</p>
            </div>
          </div>
        ) : (
          // Valid Certificate
          <div className="text-center space-y-6 w-full animate-in fade-in zoom-in duration-300">
            <div className="size-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-450 rounded-2xl flex items-center justify-center mx-auto shadow-inner shadow-emerald-500/5">
              <CheckCircle2 className="size-8" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-black text-emerald-400">Certificado Válido</h2>
              <p className="text-xs text-slate-400 font-medium">Documento de autenticidad verificado correctamente</p>
            </div>

            {/* Validation Info Block */}
            <div className="bg-slate-950/40 border border-slate-850/80 rounded-2xl p-4 text-left space-y-3 w-full text-xs">
              <div className="flex items-center gap-2.5 text-slate-400">
                <User className="size-4.5 shrink-0 text-indigo-400" />
                <div>
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-wide">Participante</p>
                  <p className="font-bold text-slate-200 text-sm mt-0.5">{participantName}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400 border-t border-slate-800/40 pt-2.5">
                <Award className="size-4.5 shrink-0 text-indigo-400" />
                <div>
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-wide">Certificación</p>
                  <p className="font-semibold text-slate-200 mt-0.5">{template?.name || "Diploma de participación"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400 border-t border-slate-800/40 pt-2.5">
                <Calendar className="size-4.5 shrink-0 text-indigo-400" />
                <div>
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-wide">Evento / Edición</p>
                  <p className="font-semibold text-slate-200 mt-0.5">
                    {event?.name ? `${event.name} - ${edition?.name || ""}` : "Evento Zynqro"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-400 border-t border-slate-800/40 pt-2.5">
                <FileText className="size-4.5 shrink-0 text-indigo-400" />
                <div>
                  <p className="text-[9px] uppercase text-slate-500 font-bold tracking-wide">Código de Validación</p>
                  <p className="font-mono text-slate-200 font-bold mt-0.5">{code}</p>
                </div>
              </div>
            </div>

            {/* Validation details */}
            <div className="flex items-center justify-between text-[9px] text-slate-500 uppercase px-1">
              <span>Emisión: {cert?.issued_at ? new Date(cert.issued_at).toLocaleDateString() : ""}</span>
              <span>Validaciones: {cert?.validations_count || 0}</span>
            </div>

            {/* Redirect button to event page if available */}
            {event?.stream_url && (
              <a
                href={event.stream_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/10 text-xs transition-colors"
              >
                <Globe className="size-4" />
                Ir al sitio web del evento
              </a>
            )}

            <div className="pt-2 border-t border-slate-800/80">
              <p className="text-[10px] text-slate-505 uppercase tracking-wider">Zynqro Events Platform</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
