'use client'

import Image from 'next/image'

export function WebinarSpeakers() {
    return (
        <section id="mentores" className="w-full py-16 md:py-24 bg-background border-b border-border/60 relative overflow-hidden">
            {/* Ambient subtle glow behind speakers */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[600px] h-[300px] bg-[#00b49d]/5 blur-[140px] pointer-events-none rounded-full" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                
                {/* Section Title & Subtitle - Left Aligned */}
                <div className="max-w-3xl mb-12 sm:mb-16 text-left">
                    <span className="text-[#00a2b6] text-xs sm:text-sm tracking-widest uppercase font-mono font-medium block mb-2">
                        EXPOSITORES
                    </span>
                    <h2 className="text-2xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground uppercase leading-tight mb-4">
                        ¿QUIÉNES TE ACOMPAÑARÁN EN ESTE <span className="text-[#00b49d]">WEBINAR?</span>
                    </h2>
                    <p className="text-sm sm:text-base text-muted-foreground font-normal leading-relaxed">
                        Dos médicos con experiencia real y resultados comprobados en el Residentado Médico, listos para compartir su estrategia y responder tus dudas en vivo.
                    </p>
                </div>

                {/* Speakers Grid - Left Aligned with Image on the Right */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
                    
                    {/* Speaker 1: Dra. María Reneé Montesinos */}
                    <div className="flex flex-row items-start justify-between gap-5 sm:gap-6 text-left">
                        {/* Text Content */}
                        <div className="flex-1 space-y-2">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                                    Dra. Maria Reneé Montesinos
                                </h3>
                                <p className="text-xs sm:text-sm font-mono font-medium text-[#00b49d] tracking-wide uppercase mt-1">
                                    Médica · Cofundadora de MedMind
                                </p>
                            </div>

                            <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground font-light leading-relaxed pt-1">
                                <p className="font-medium text-foreground">
                                    Ingresó al Residentado en su primera postulación mientras trabajaba.
                                </p>
                                <p className="text-xs text-foreground/80 font-mono">
                                    2.º puesto ENAM · Internado Rebagliati · Cardiología INCOR
                                </p>
                            </div>
                        </div>

                        {/* Image on Right */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-[#00b49d]/30 shadow-md shrink-0">
                            <Image
                                src="/media/diego.jpg"
                                alt="Dra. Maria Reneé Montesinos"
                                fill
                                sizes="(max-width: 768px) 112px, 128px"
                                className="object-cover object-top"
                                priority
                            />
                        </div>
                    </div>

                    {/* Speaker 2: Diego */}
                    <div className="flex flex-row items-start justify-between gap-5 sm:gap-6 text-left">
                        {/* Text Content */}
                        <div className="flex-1 space-y-2">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight">
                                    Diego
                                </h3>
                                <p className="text-xs sm:text-sm font-mono font-medium text-[#00a2b6] tracking-wide uppercase mt-1">
                                    Médico · Cofundador de MedMind
                                </p>
                            </div>

                            <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground font-light leading-relaxed pt-1">
                                <p className="font-medium text-foreground">
                                    Pasó de no ingresar a alcanzar el 1.er puesto nacional.
                                </p>
                                <p className="text-xs text-foreground/80 font-mono">
                                    1.er puesto nacional · Internado Rebagliati · Cardiología INCOR
                                </p>
                            </div>
                        </div>

                        {/* Image on Right */}
                        <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-[#00a2b6]/30 shadow-md shrink-0">
                            <Image
                                src="/media/maria_rene.jpg"
                                alt="Diego"
                                fill
                                sizes="(max-width: 768px) 112px, 128px"
                                className="object-cover object-top"
                                priority
                            />
                        </div>
                    </div>

                </div>

            </div>
        </section>
    )
}
