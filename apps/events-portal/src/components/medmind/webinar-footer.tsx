'use client'

import Link from 'next/link'
import { LogoRender } from '@/components/app/logo-render'

export function WebinarFooter() {
    return (
        <footer className="w-full py-12 bg-background border-t border-border">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center justify-center">
                <Link href="/" className="inline-flex items-center mb-3">
                    <LogoRender
                        variant="full"
                        className="w-28 text-foreground"
                        classNameImg="text-foreground"
                    />
                </Link>
                <p className="text-xs sm:text-sm text-muted-foreground font-light">
                    Webinar gratuito · 7 de setiembre de 2026 · 8:00 PM (Perú)
                </p>
            </div>
        </footer>
    )
}
