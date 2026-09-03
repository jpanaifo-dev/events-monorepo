'use client'

import { Calendar, Clock, Video, Award, Users } from 'lucide-react'

export function WebinarDetailsBar() {
    const details = [
        {
            icon: Calendar,
            label: 'Fecha',
            value: 'Lunes 7 de Setiembre',
            sub: '2026'
        },
        {
            icon: Clock,
            label: 'Hora',
            value: '8:00 PM',
            sub: 'Hora Perú / Colombia (GMT-5)'
        },
        {
            icon: Video,
            label: 'Modalidad',
            value: 'En Vivo',
            sub: 'Zoom Privado + Q&A'
        },
        {
            icon: Award,
            label: 'Inversión',
            value: 'Gratuito',
            sub: 'Acceso libre con registro'
        }
    ]

    return (
        <section id="detalles" className="w-full py-10 bg-muted/40 border-y border-border/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
                    {details.map((item, idx) => {
                        const Icon = item.icon
                        return (
                            <div
                                key={idx}
                                className="flex flex-col items-start p-4 rounded-xl border border-border/60 bg-background shadow-none"
                            >
                                <div className="p-2.5 rounded-lg bg-medmind-cyan/10 text-medmind-cyan mb-3">
                                    <Icon className="w-5 h-5" />
                                </div>
                                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                                    {item.label}
                                </span>
                                <span className="text-base sm:text-lg font-semibold text-foreground mt-0.5">
                                    {item.value}
                                </span>
                                <span className="text-xs text-muted-foreground font-light mt-0.5">
                                    {item.sub}
                                </span>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    )
}
