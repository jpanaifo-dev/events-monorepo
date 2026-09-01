import type { EmailBlock } from "./EmailTemplateBuilderPage"

export interface EmailSectionTemplate {
  id: string
  name: string
  category: "all" | "headers" | "welcome" | "content" | "cta" | "footers"
  categoryLabel: string
  description: string
  badgeText?: string
  previewSvg: string
  blocks: Omit<EmailBlock, "id">[]
}

export const EMAIL_SECTION_CATEGORIES = [
  { id: "all", label: "Todas" },
  { id: "headers", label: "Cabeceras" },
  { id: "welcome", label: "Bienvenida & Verificación" },
  { id: "content", label: "Contenido & Servicios" },
  { id: "cta", label: "Llamados a la Acción" },
  { id: "footers", label: "Pies de Página & Soporte" },
] as const

export const EMAIL_SECTIONS: EmailSectionTemplate[] = [
  // =========================================================================
  // 1. CABECERAS (HEADERS)
  // =========================================================================
  {
    id: "sec-header-hubspot",
    name: "Cabecera Banner Naranja (Estilo HubSpot)",
    category: "headers",
    categoryLabel: "Cabeceras",
    description: "Franja de color corporativo naranja con logotipo blanco centrado y tipografía limpia.",
    badgeText: "HubSpot",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 60" width="280" height="60"><rect width="280" height="60" rx="8" fill="%23FF7A59"/><circle cx="140" cy="24" r="7" fill="%23ffffff"/><circle cx="152" cy="18" r="4" fill="%23ffffff"/><path d="M140 24 L152 18" stroke="%23ffffff" stroke-width="2"/><text x="140" y="46" fill="%23ffffff" font-family="sans-serif" font-weight="900" font-size="14" text-anchor="middle" letter-spacing="1">HubSpot</text></svg>`,
    blocks: [
      {
        type: "logo",
        label: "Cabecera HubSpot",
        options: {
          text: "HubSpot",
          imageUrl: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inverted-Logo.png",
          align: "center",
          bgColor: "#FF7A59",
          textColor: "#ffffff",
          isBanner: true,
          paddingY: 18,
        },
      },
    ],
  },
  {
    id: "sec-header-workangel",
    name: "Cabecera Circular Minimal (Estilo WorkAngel)",
    category: "headers",
    categoryLabel: "Cabeceras",
    description: "Insignia circular superior con icono de marca y saludo principal destacado.",
    badgeText: "WorkAngel",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 70" width="280" height="70"><rect width="280" height="70" rx="8" fill="%23f8fafc"/><circle cx="140" cy="24" r="16" fill="%230ea5e9"/><text x="140" y="30" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="14" text-anchor="middle">W</text><text x="140" y="55" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="11" text-anchor="middle">Hi Filippo, your account is approved</text></svg>`,
    blocks: [
      {
        type: "logo",
        label: "Insignia Circular",
        options: {
          text: "W",
          align: "center",
          bgColor: "#0ea5e9",
          textColor: "#ffffff",
          badgeShape: "circle",
          width: 52,
        },
      },
      {
        type: "heading",
        label: "Saludo Aprobación",
        options: {
          text: "Hi {{ contact.FIRSTNAME | default: 'Filippo' }},\nyour WorkAngel account has been approved!",
          align: "center",
          level: 1,
          color: "#1e293b",
          fontSize: 24,
        },
      },
    ],
  },
  {
    id: "sec-header-hellothere",
    name: "Cabecera Hero Azul (.hello there)",
    category: "headers",
    categoryLabel: "Cabeceras",
    description: "Fondo azul eléctrico con titular tipográfico moderno y diseño de avión de papel.",
    badgeText: "Hero Banner",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 85" width="280" height="85"><rect width="280" height="85" rx="8" fill="%232563eb"/><text x="140" y="32" fill="%23ffffff" font-family="sans-serif" font-weight="900" font-size="18" text-anchor="middle">.hello there</text><text x="140" y="48" fill="%23bfdbfe" font-family="sans-serif" font-size="8" text-anchor="middle">Agencia especializada de alto impacto</text><path d="M60 85 L140 55 L220 85 Z" fill="%23ffffff" opacity="0.95"/></svg>`,
    blocks: [
      {
        type: "heading",
        label: "Titular Hero",
        options: {
          text: ".hello there",
          subtitle: "Somos un equipo multidisciplinario enfocado en llevar tus eventos y proyectos al siguiente nivel.",
          align: "center",
          level: 1,
          color: "#ffffff",
          bgColor: "#2563eb",
          paddingY: 28,
          fontSize: 32,
        },
      },
      {
        type: "image",
        label: "Gráfico Origami / Avión",
        options: {
          imageUrl: "https://images.unsplash.com/photo-1517976487507-5b3df1429945?w=800&auto=format&fit=crop&q=80",
          alt: "Hero Header",
          align: "center",
        },
      },
    ],
  },
  {
    id: "sec-header-navigation",
    name: "Cabecera Corporativa con Enlaces",
    category: "headers",
    categoryLabel: "Cabeceras",
    description: "Logotipo alineado a la izquierda con barra de navegación superior (Inicio, Agenda, Ponentes).",
    badgeText: "Nav Bar",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 50" width="280" height="50"><rect width="280" height="50" rx="8" fill="%23ffffff" stroke="%23e2e8f0"/><rect x="15" y="16" width="50" height="18" rx="4" fill="%23009245"/><text x="40" y="29" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="9" text-anchor="middle">EVENTOS</text><text x="140" y="29" fill="%2364748b" font-family="sans-serif" font-size="9">Inicio</text><text x="180" y="29" fill="%2364748b" font-family="sans-serif" font-size="9">Agenda</text><text x="225" y="29" fill="%2364748b" font-family="sans-serif" font-size="9">Contacto</text></svg>`,
    blocks: [
      {
        type: "logo",
        label: "Logotipo Izquierda",
        options: {
          text: "IIAP EVENTOS",
          align: "left",
          width: 140,
        },
      },
      {
        type: "navigation",
        label: "Menú Superior",
        options: {
          links: [
            { label: "Inicio", url: "#" },
            { label: "Agenda", url: "#" },
            { label: "Ponentes", url: "#" },
            { label: "Entradas", url: "#" },
          ],
        },
      },
      {
        type: "divider",
        label: "Separador",
        options: { color: "#e2e8f0", height: 1, marginY: 16 },
      },
    ],
  },

  // =========================================================================
  // 2. BIENVENIDA & CONFIRMACIÓN (WELCOME & CONFIRMATION)
  // =========================================================================
  {
    id: "sec-welcome-hubspot-confirm",
    name: "Confirmación de Email (Estilo HubSpot)",
    category: "welcome",
    categoryLabel: "Bienvenida",
    description: "Ilustración de sobre de verificación, mensaje cordial, botón de confirmación y nota de seguridad.",
    badgeText: "HubSpot",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 120" width="280" height="120"><rect width="280" height="120" rx="8" fill="%23ffffff" stroke="%23e2e8f0"/><rect width="280" height="20" rx="4" fill="%23FF7A59"/><circle cx="140" cy="45" r="14" fill="%23ecfdf5" stroke="%2310b981"/><text x="140" y="49" fill="%2310b981" font-family="sans-serif" font-weight="bold" font-size="12" text-anchor="middle">✓</text><text x="140" y="72" fill="%231e293b" font-family="sans-serif" font-weight="bold" font-size="11" text-anchor="middle">Please confirm your email address</text><text x="140" y="85" fill="%2364748b" font-family="sans-serif" font-size="8" text-anchor="middle">Thanks for signing up. We're happy to have you.</text><rect x="80" y="94" width="120" height="18" rx="4" fill="%2333475B"/><text x="140" y="106" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="8" text-anchor="middle">Confirm your email address</text></svg>`,
    blocks: [
      {
        type: "logo",
        label: "Cabecera HubSpot Naranja",
        options: {
          text: "HubSpot",
          align: "center",
          bgColor: "#FF7A59",
          textColor: "#ffffff",
          isBanner: true,
          paddingY: 14,
        },
      },
      {
        type: "image",
        label: "Ilustración Sobre y Verificación",
        options: {
          imageUrl: "https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=600&auto=format&fit=crop&q=80",
          alt: "Confirmación de Correo",
          align: "center",
        },
      },
      {
        type: "heading",
        label: "Título de Verificación",
        options: {
          text: "Please confirm your email address",
          level: 1,
          align: "center",
          color: "#1e293b",
          fontSize: 24,
        },
      },
      {
        type: "text",
        label: "Mensaje de Confirmación",
        options: {
          text: "Thanks for signing up to HubSpot, {{ contact.FIRSTNAME | default: '' }}. We're happy to have you.\n\nPlease take a second to make sure we have your correct email address.",
          align: "center",
          color: "#475569",
          fontSize: 14,
          lineHeight: 1.6,
        },
      },
      {
        type: "button",
        label: "Botón Confirmar Correo",
        options: {
          text: "Confirm your email address",
          url: "https://ejemplo.com/confirm",
          align: "center",
          bgColor: "#33475B",
          textColor: "#ffffff",
          borderRadius: 6,
        },
      },
      {
        type: "text",
        label: "Nota de Pie HubSpot",
        options: {
          text: "Didn't sign up for HubSpot? <a href='#' style='color: #0284c7; text-decoration: underline;'>Let us know.</a>",
          align: "center",
          color: "#94a3b8",
          fontSize: 12,
        },
      },
    ],
  },
  {
    id: "sec-welcome-universe",
    name: "Bienvenida a la Plataforma (Estilo Universe)",
    category: "welcome",
    categoryLabel: "Bienvenida",
    description: "Saludo festivo con ilustración de mano, llamada a crear evento y bloque secundario para asistentes.",
    badgeText: "Universe",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 120" width="280" height="120"><rect width="280" height="120" rx="8" fill="%23ffffff" stroke="%23e2e8f0"/><circle cx="140" cy="35" r="18" fill="%23eff6ff"/><text x="140" y="40" fill="%233b82f6" font-family="sans-serif" font-size="16" text-anchor="middle">👋</text><text x="140" y="65" fill="%230f172a" font-family="sans-serif" font-weight="900" font-size="11" text-anchor="middle">Welcome to Universe, Smiles Davis!</text><rect x="75" y="76" width="130" height="18" rx="6" fill="%234f46e5"/><text x="140" y="88" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="8" text-anchor="middle">Create your event now</text><rect y="102" width="280" height="18" fill="%23f8fafc"/><text x="140" y="114" fill="%2364748b" font-family="sans-serif" font-size="7" text-anchor="middle">Have questions? We are here to help.</text></svg>`,
    blocks: [
      {
        type: "image",
        label: "Ilustración Saludo",
        options: {
          imageUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&auto=format&fit=crop&q=80",
          alt: "Bienvenido",
          align: "center",
        },
      },
      {
        type: "heading",
        label: "Titular Bienvenida Universe",
        options: {
          text: "Welcome to Universe, {{ contact.FIRSTNAME | default: 'Smiles Davis' }}!",
          level: 1,
          align: "center",
          color: "#0f172a",
          fontSize: 26,
        },
      },
      {
        type: "text",
        label: "Descripción Universe",
        options: {
          text: "We're glad to see you here! We have everything you need to launch your event today. <a href='#' style='color: #4f46e5; text-decoration: underline;'>Learn more</a> on how you can set up your best event yet.",
          align: "center",
          color: "#475569",
          fontSize: 14,
          lineHeight: 1.6,
        },
      },
      {
        type: "button",
        label: "Botón Crear Evento",
        options: {
          text: "Create your event now",
          url: "https://ejemplo.com/create",
          align: "center",
          bgColor: "#4f46e5",
          textColor: "#ffffff",
          borderRadius: 8,
        },
      },
      {
        type: "heading",
        label: "Subtítulo Asistir",
        options: {
          text: "Looking to attend an event?",
          level: 2,
          align: "center",
          color: "#1e293b",
          fontSize: 18,
        },
      },
      {
        type: "text",
        label: "Texto Descubrir Eventos",
        options: {
          text: "Use Universe to <a href='#' style='color: #4f46e5;'>discover events</a> happening near you.",
          align: "center",
          color: "#64748b",
          fontSize: 13,
        },
      },
    ],
  },
  {
    id: "sec-welcome-workangel-approved",
    name: "Cuenta Aprobada & Activación (Estilo WorkAngel)",
    category: "welcome",
    categoryLabel: "Bienvenida",
    description: "Tarjeta de aprobación con enlace de inicio de sesión y botón CTA 'Get started'.",
    badgeText: "WorkAngel",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 110" width="280" height="110"><rect width="280" height="110" rx="8" fill="%23f8fafc" stroke="%23e2e8f0"/><rect x="20" y="15" width="240" height="80" rx="8" fill="%23ffffff" stroke="%23e2e8f0"/><circle cx="140" cy="35" r="10" fill="%23ecfdf5"/><text x="140" y="39" fill="%2310b981" font-size="10" text-anchor="middle">✓</text><text x="140" y="58" fill="%23334155" font-family="sans-serif" font-size="8" text-anchor="middle">Your account has been approved and ready.</text><rect x="90" y="68" width="100" height="18" rx="4" fill="%230284c7"/><text x="140" y="80" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="8" text-anchor="middle">Get started</text></svg>`,
    blocks: [
      {
        type: "heading",
        label: "Encabezado Estado",
        options: {
          text: "¡Tu cuenta ha sido aprobada con éxito!",
          level: 2,
          align: "center",
          color: "#0f172a",
          fontSize: 20,
        },
      },
      {
        type: "text",
        label: "Instrucciones de Acceso",
        options: {
          text: "Ya puedes ingresar a la plataforma y explorar todos los beneficios, conferencias y talleres disponibles para tu pase.",
          align: "center",
          color: "#475569",
          fontSize: 14,
          lineHeight: 1.6,
        },
      },
      {
        type: "button",
        label: "Botón Comenzar",
        options: {
          text: "Comenzar ahora",
          url: "https://ejemplo.com/login",
          align: "center",
          bgColor: "#0284c7",
          textColor: "#ffffff",
          borderRadius: 6,
        },
      },
    ],
  },

  // =========================================================================
  // 3. CONTENIDO & SERVICIOS (CONTENT & SERVICES)
  // =========================================================================
  {
    id: "sec-content-hellothere-list",
    name: "Lista de Servicios y Ventajas (.hello there)",
    category: "content",
    categoryLabel: "Contenido",
    description: "Estructura limpia de puntos clave: qué ofrecemos y por qué elegirnos.",
    badgeText: "Features",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 110" width="280" height="110"><rect width="280" height="110" rx="8" fill="%23ffffff" stroke="%23e2e8f0"/><text x="140" y="24" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="11" text-anchor="middle">Вот что мы можем:</text><circle cx="30" cy="40" r="2.5" fill="%232563eb"/><text x="40" y="43" fill="%23475569" font-family="sans-serif" font-size="8">Organización integral y control de accesos QR</text><circle cx="30" cy="55" r="2.5" fill="%232563eb"/><text x="40" y="58" fill="%23475569" font-family="sans-serif" font-size="8">Emisión de certificados digitales verificados</text><circle cx="30" cy="70" r="2.5" fill="%232563eb"/><text x="40" y="73" fill="%23475569" font-family="sans-serif" font-size="8">Envío de recordatorios masivos y WhatsApp</text><rect x="80" y="84" width="120" height="18" rx="4" fill="%232563eb"/><text x="140" y="96" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="8" text-anchor="middle">Оставить заявку</text></svg>`,
    blocks: [
      {
        type: "heading",
        label: "Sección Qué Podemos Hacer",
        options: {
          text: "Esto es lo que podemos hacer por ti:",
          level: 2,
          align: "left",
          color: "#0f172a",
          fontSize: 20,
        },
      },
      {
        type: "text",
        label: "Lista de Puntos Clave",
        options: {
          text: "• <strong>Acreditación instantánea:</strong> Genera credenciales con código QR y valida la asistencia en tiempo real.<br/>• <strong>Certificados automáticos:</strong> Diseña y distribuye certificados oficiales firmados digitalmente.<br/>• <strong>Comunicaciones omnicanal:</strong> Envía confirmaciones personalizadas por correo electrónico y WhatsApp.<br/>• <strong>Analítica en vivo:</strong> Consulta aforos, métricas y reportes detallados en tu panel de control.",
          align: "left",
          color: "#334155",
          fontSize: 13,
          lineHeight: 1.8,
        },
      },
      {
        type: "heading",
        label: "Sección Ventajas",
        options: {
          text: "¿Por qué trabajar con nosotros?",
          level: 2,
          align: "left",
          color: "#0f172a",
          fontSize: 18,
        },
      },
      {
        type: "text",
        label: "Lista de Ventajas",
        options: {
          text: "• <strong>Disponibilidad 24/7:</strong> Plataforma en la nube segura, escalable y optimizada.<br/>• <strong>Soporte dedicado:</strong> Acompañamiento técnico antes, durante y después de tu evento.<br/>• <strong>Garantía de entrega:</strong> Correos transaccionales con alta tasa de apertura y sin spam.",
          align: "left",
          color: "#475569",
          fontSize: 13,
          lineHeight: 1.8,
        },
      },
      {
        type: "button",
        label: "Botón Contacto / Solicitud",
        options: {
          text: "Solicitar una demo gratuita",
          url: "https://ejemplo.com/demo",
          align: "center",
          bgColor: "#2563eb",
          textColor: "#ffffff",
          borderRadius: 8,
        },
      },
    ],
  },
  {
    id: "sec-content-app-download",
    name: "Descarga de App Móvil (Estilo WorkAngel)",
    category: "content",
    categoryLabel: "Contenido",
    description: "Caja promocional destacada con botones de descarga para App Store y Google Play.",
    badgeText: "Mobile App",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 90" width="280" height="90"><rect width="280" height="90" rx="8" fill="%23ffffff" stroke="%23e2e8f0"/><text x="140" y="26" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="12" text-anchor="middle">Get the WorkAngel app!</text><text x="140" y="42" fill="%2364748b" font-family="sans-serif" font-size="8" text-anchor="middle">Get the most by installing the mobile app.</text><rect x="50" y="54" width="80" height="24" rx="4" fill="%23000000"/><text x="90" y="69" fill="%23ffffff" font-family="sans-serif" font-size="7" text-anchor="middle">App Store</text><rect x="150" y="54" width="80" height="24" rx="4" fill="%23000000"/><text x="190" y="69" fill="%23ffffff" font-family="sans-serif" font-size="7" text-anchor="middle">Google Play</text></svg>`,
    blocks: [
      {
        type: "heading",
        label: "Titular Descarga App",
        options: {
          text: "¡Descarga la App oficial del evento!",
          level: 2,
          align: "center",
          color: "#0f172a",
          fontSize: 20,
        },
      },
      {
        type: "text",
        label: "Texto App Móvil",
        options: {
          text: "Accede a tu credencial QR offline, interactúa con los ponentes en tiempo real y recibe alertas de cambios de horario al instante.",
          align: "center",
          color: "#475569",
          fontSize: 13,
          lineHeight: 1.6,
        },
      },
      {
        type: "button",
        label: "Botón App Store / Google Play",
        options: {
          text: "Descargar en App Store & Google Play",
          url: "https://ejemplo.com/app",
          align: "center",
          bgColor: "#0f172a",
          textColor: "#ffffff",
          borderRadius: 8,
        },
      },
    ],
  },
  {
    id: "sec-content-ticket-promo",
    name: "Tarjeta de Entrada VIP / Producto",
    category: "content",
    categoryLabel: "Contenido",
    description: "Fila destacada con imagen, detalles de la entrada, precio en soles y botón de compra.",
    badgeText: "Tickets",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 70" width="280" height="70"><rect width="280" height="70" rx="8" fill="%23f8fafc" stroke="%23cbd5e1"/><rect x="15" y="15" width="40" height="40" rx="6" fill="%23009245"/><text x="35" y="39" fill="%23ffffff" font-weight="bold" font-size="12" text-anchor="middle">VIP</text><text x="70" y="30" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="10">Pase General VIP</text><text x="70" y="44" fill="%2364748b" font-family="sans-serif" font-size="8">Acceso total a sesiones y cena</text><text x="235" y="38" fill="%23009245" font-family="sans-serif" font-weight="bold" font-size="11" text-anchor="middle">S/ 150</text></svg>`,
    blocks: [
      {
        type: "product",
        label: "Entrada VIP",
        options: {
          title: "Pase VIP - Acceso Total",
          price: "S/ 150.00",
          description: "Incluye acceso a todas las conferencias magistrales, talleres prácticos y certificado con código QR verificado.",
          imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80",
          buttonText: "Comprar Entrada",
          buttonUrl: "https://ejemplo.com/tickets",
        },
      },
    ],
  },

  // =========================================================================
  // 4. LLAMADOS A LA ACCIÓN (CTA)
  // =========================================================================
  {
    id: "sec-cta-card",
    name: "Llamado a la Acción Principal (CTA)",
    category: "cta",
    categoryLabel: "Llamado a la Acción",
    description: "Bloque centrado con titular de impacto, resumen y botón con color de marca.",
    badgeText: "CTA",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 75" width="280" height="75"><rect width="280" height="75" rx="8" fill="%23ffffff" stroke="%23e2e8f0"/><text x="140" y="24" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="11" text-anchor="middle">¿Listo para unirte al evento?</text><text x="140" y="38" fill="%2364748b" font-family="sans-serif" font-size="8" text-anchor="middle">Los cupos son limitados. Asegura tu lugar hoy.</text><rect x="80" y="46" width="120" height="20" rx="6" fill="%23009245"/><text x="140" y="59" fill="%23ffffff" font-family="sans-serif" font-weight="bold" font-size="8" text-anchor="middle">Registrarme Ahora</text></svg>`,
    blocks: [
      {
        type: "heading",
        label: "Titular de Acción",
        options: {
          text: "¿Listo para ser parte de la experiencia?",
          level: 2,
          align: "center",
          color: "#0f172a",
          fontSize: 22,
        },
      },
      {
        type: "text",
        label: "Texto Urgencia",
        options: {
          text: "Los cupos presenciales son limitados y se agotan rápido. Confirma tu participación antes del cierre de inscripciones.",
          align: "center",
          color: "#475569",
          fontSize: 14,
        },
      },
      {
        type: "button",
        label: "Botón de Registro",
        options: {
          text: "Registrarme Ahora",
          url: "https://ejemplo.com/registro",
          align: "center",
          bgColor: "#009245",
          textColor: "#ffffff",
          borderRadius: 8,
        },
      },
    ],
  },

  // =========================================================================
  // 5. PIES DE PÁGINA & SOPORTE (FOOTERS & SUPPORT)
  // =========================================================================
  {
    id: "sec-footer-universe-help",
    name: "Caja de Ayuda y Preguntas (Estilo Universe)",
    category: "footers",
    categoryLabel: "Pies de Página",
    description: "Bloque gris suave con título 'Have questions?' y enlaces de contacto directo y ayuda.",
    badgeText: "Universe Support",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 65" width="280" height="65"><rect width="280" height="65" rx="8" fill="%23f8fafc" stroke="%23e2e8f0"/><text x="140" y="26" fill="%230f172a" font-family="sans-serif" font-weight="bold" font-size="11" text-anchor="middle">Have questions?</text><text x="140" y="44" fill="%2364748b" font-family="sans-serif" font-size="8" text-anchor="middle">We are here to help, learn more here or contact us.</text></svg>`,
    blocks: [
      {
        type: "heading",
        label: "¿Tienes preguntas?",
        options: {
          text: "Have questions? / ¿Tienes dudas?",
          level: 3,
          align: "center",
          color: "#0f172a",
          fontSize: 18,
        },
      },
      {
        type: "text",
        label: "Texto de Soporte",
        options: {
          text: "Estamos aquí para ayudarte. Revisa nuestra sección de <a href='#' style='color: #4f46e5; text-decoration: underline;'>preguntas frecuentes</a> o escríbenos directamente a <a href='mailto:soporte@iiap.gob.pe' style='color: #4f46e5; text-decoration: underline;'>soporte@iiap.gob.pe</a>.",
          align: "center",
          color: "#64748b",
          fontSize: 12,
        },
      },
    ],
  },
  {
    id: "sec-footer-social-legal",
    name: "Pie de Página con Redes Sociales y Desuscripción",
    category: "footers",
    categoryLabel: "Pies de Página",
    description: "Iconos circulares de redes sociales, dirección física y enlace legal de desuscripción.",
    badgeText: "Social & Legal",
    previewSvg: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 65" width="280" height="65"><rect width="280" height="65" rx="8" fill="%23ffffff"/><circle cx="115" cy="22" r="8" fill="%23f1f5f9"/><circle cx="140" cy="22" r="8" fill="%23f1f5f9"/><circle cx="165" cy="22" r="8" fill="%23f1f5f9"/><text x="140" y="44" fill="%2394a3b8" font-family="sans-serif" font-size="7" text-anchor="middle">© 2026 IIAP Eventos • Todos los derechos reservados</text><text x="140" y="55" fill="%2394a3b8" font-family="sans-serif" font-size="7" text-anchor="middle">Cancelar suscripción</text></svg>`,
    blocks: [
      {
        type: "divider",
        label: "Separador",
        options: { color: "#e2e8f0", height: 1, marginY: 20 },
      },
      {
        type: "social",
        label: "Redes Sociales",
        options: {
          align: "center",
          networks: [
            { name: "facebook", url: "https://facebook.com" },
            { name: "instagram", url: "https://instagram.com" },
            { name: "linkedin", url: "https://linkedin.com" },
            { name: "twitter", url: "https://x.com" },
          ],
        },
      },
      {
        type: "text",
        label: "Texto Legal y Desuscripción",
        options: {
          text: "© 2026 IIAP - Instituto de Investigaciones de la Amazonía Peruana.<br/>Av. Abelardo Quiñones Km. 2.5, Iquitos, Perú.<br/><a href='#' style='color: #94a3b8; text-decoration: underline;'>Preferencias de correo</a> • <a href='#' style='color: #94a3b8; text-decoration: underline;'>Cancelar suscripción</a>",
          align: "center",
          color: "#94a3b8",
          fontSize: 11,
          lineHeight: 1.5,
        },
      },
    ],
  },
]

/**
 * Utility to generate fresh block instances with unique IDs for canvas insertion
 */
export function createBlocksFromSection(section: EmailSectionTemplate): EmailBlock[] {
  return section.blocks.map((b) => ({
    ...b,
    id: `blk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    options: JSON.parse(JSON.stringify(b.options || {})),
  }))
}
