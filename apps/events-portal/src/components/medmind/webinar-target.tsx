'use client'

import { UserCheck, Stethoscope, Clock, TrendingUp } from 'lucide-react'

export function WebinarTarget() {
    const targets = [
        {
            icon: Stethoscope,
            title: 'Estudiantes de Ciencias Clínicas',
            desc: 'Si estás en tus últimos años de medicina y quieres adelantar ventaja construyendo una base sólida sin quemarte antes del internado.'
        },
        {
            icon: Clock,
            title: 'Internos de Medicina',
            desc: 'Si tienes poco tiempo libre por las guardias y turnos hospitalarios y necesitas un sistema de alta eficiencia de 60-90 minutos diarios.'
        },
        {
            icon: TrendingUp,
            title: 'Postulantes a ENAM & Residentado',
            desc: 'Si tu meta es ingresar a una especialidad altamente competitiva y necesitas subir tus notas en simulacros por encima del percentil 90.'
        },
        {
            icon: UserCheck,
            title: 'Médicos que buscan cambiar de método',
            desc: 'Si ya estudiaste con academias tradicionales y sentiste que memorizaste mucho contenido que luego no lograste evocar en el examen.'
        }
    ]

    return (
        <section className="w-full py-16 md:py-24 bg-background border-b border-border/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                
                <div className="max-w-3xl mb-12 sm:mb-16">
                    <span className="text-medmind-cyan text-xs sm:text-sm tracking-widest uppercase font-mono font-medium block mb-2">
                        PÚBLICO OBJETIVO
                    </span>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground uppercase leading-tight mb-4">
                        ¿ESTE WEBINAR ES <span className="text-[#00b49d]">PARA TI?</span>
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed">
                        Este espacio está diseñado exclusivamente para profesionales y estudiantes de la salud comprometidos con su excelencia médica.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {targets.map((item, idx) => {
                        const Icon = item.icon
                        return (
                            <div
                                key={idx}
                                className="p-6 rounded-2xl border border-border bg-card/40 flex flex-col justify-between shadow-none hover:border-medmind-cyan/40 transition-colors"
                            >
                                <div>
                                    <div className="p-2.5 w-fit rounded-lg bg-medmind-cyan/10 text-medmind-cyan mb-4">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h3 className="text-base font-semibold text-foreground mb-2">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs sm:text-sm text-muted-foreground font-light leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>

            </div>
        </section>
    )
}
