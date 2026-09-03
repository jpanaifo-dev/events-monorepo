'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { ArrowRight, Calendar, Clock, Video } from 'lucide-react'

export function WebinarHero() {
    const scrollToRegistration = () => {
        const el = document.getElementById('registro')
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    const scrollToAgenda = () => {
        const el = document.getElementById('temario')
        if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
        }
    }

    return (
        <section className="relative w-full min-h-screen lg:h-screen pt-24 pb-12 lg:py-0 overflow-hidden bg-background text-foreground flex flex-col justify-center border-b border-border/60">

            {/* Background Ambient Lighting (Dark & Light Mode Adaptive) */}
            <div className="absolute inset-0 bg-[radial-gradient(#00b49d_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.06] dark:opacity-[0.08] pointer-events-none" />
            <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00b49d]/10 dark:bg-[#00b49d]/15 blur-[140px] pointer-events-none rounded-full" />
            <div className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-[#00a2b6]/10 dark:bg-[#00a2b6]/15 blur-[140px] pointer-events-none rounded-full" />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 my-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">

                    {/* Left Column: Headline, Subtitle, Facts, CTA */}
                    <div className="lg:col-span-7 flex flex-col items-start text-left">

                        {/* Live Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-medmind-primary/30 dark:border-white/15 bg-white dark:bg-white/5 text-xs font-mono font-medium tracking-wider uppercase mb-5 text-medmind-primary dark:text-[#abd456]"
                        >
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                            <span>WEBINAR GRATUITO · EN VIVO</span>
                        </motion.div>

                        {/* Main Headline */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
                            className="text-3xl sm:text-5xl md:text-6xl uppercase leading-[1.08] tracking-tight mb-5"
                        >
                            <span className="font-extrabold text-foreground">¿CÓMO PREPARARME PARA EL </span>
                            <span className="font-extrabold text-[#00b49d]">ENAM Y EL RESIDENTADO 2027</span>
                            <span className="block font-normal text-foreground/85 dark:text-slate-200 tracking-wide text-xl sm:text-3xl md:text-4xl mt-2 sm:mt-3">
                                CON UNA SOLA ESTRATEGIA?
                            </span>
                        </motion.h1>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
                            className="text-sm sm:text-base md:text-lg text-muted-foreground font-light max-w-2xl leading-relaxed mb-6"
                        >
                            Una sesión en vivo y gratuita para que sepas exactamente en qué enfocar tu preparación desde hoy y llegues con estrategia—no con improvisación—a tu postulación al Residentado Médico 2027.
                        </motion.p>

                        {/* Facts Bar */}
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
                            className="flex flex-wrap items-center gap-3 sm:gap-4 mb-8"
                        >
                            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-card border border-border text-xs sm:text-sm text-foreground">
                                <Calendar className="w-4 h-4 text-[#00b49d]" />
                                <div>
                                    <span className="font-medium text-foreground block">7 de setiembre, 2026</span>
                                    <span className="text-[10px] text-muted-foreground font-light">Lunes</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-card border border-border text-xs sm:text-sm text-foreground">
                                <Clock className="w-4 h-4 text-[#00b49d]" />
                                <div>
                                    <span className="font-medium text-foreground block">8:00 PM (Perú)</span>
                                    <span className="text-[10px] text-muted-foreground font-light">Hora exacta de inicio</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-card border border-border text-xs sm:text-sm text-foreground">
                                <Video className="w-4 h-4 text-[#00b49d]" />
                                <div>
                                    <span className="font-medium text-foreground block">100% Online</span>
                                    <span className="text-[10px] text-muted-foreground font-light">Vía transmisión en vivo</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* CTA Buttons */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
                            className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
                        >
                            <button
                                onClick={scrollToRegistration}
                                className="w-full sm:w-auto h-13 px-9 rounded-full bg-[#00b49d] hover:bg-[#00a2b6] text-white font-medium text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-none"
                            >
                                <span>Quiero mi cupo gratis</span>
                                <ArrowRight className="w-4 h-4" />
                            </button>

                            <button
                                onClick={scrollToAgenda}
                                className="w-full sm:w-auto h-13 px-9 rounded-full border border-border bg-card hover:bg-muted text-foreground font-medium text-base flex items-center justify-center gap-2 transition-all cursor-pointer shadow-none"
                            >
                                <span>Explorar temario</span>
                            </button>
                        </motion.div>

                    </div>

                    {/* Right Column: Mascot Image */}
                    <div className="lg:col-span-5 flex items-center justify-center relative">
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                            className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl 2xl:max-w-2xl aspect-square flex items-center justify-center"
                        >
                            {/* Ambient circle glow */}
                            <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#00b49d]/20 to-transparent blur-2xl pointer-events-none" />

                            <div className="relative w-full h-full flex items-center justify-center">
                                <Image
                                    src="/assets/images/webinar_pet_hero.webp"
                                    alt="Mascota MedMind Webinar"
                                    fill
                                    className="object-contain"
                                    sizes="(max-width: 1024px) 100vw, 45vw"
                                    priority
                                />
                            </div>
                        </motion.div>
                    </div>

                </div>
            </div>
        </section>
    )
}
