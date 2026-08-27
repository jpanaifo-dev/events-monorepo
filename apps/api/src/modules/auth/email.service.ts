import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(to: string, subject: string, html: string) {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (!apiKey || !from || apiKey.includes('xxxxxxxx')) {
      this.logger.warn(`Correo no enviado a ${to}: configura RESEND_API_KEY y RESEND_FROM_EMAIL válidos.`);
      return { sent: false, reason: 'Email no configurado' };
    }
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: `${process.env.RESEND_FROM_NAME || 'Events'} <${from}>`, to: [to], subject, html }) });
    if (!response.ok) {
      const error = await response.text();
      this.logger.error(`Resend rechazó el correo a ${to}: ${error}`);
      return { sent: false, reason: 'Proveedor de correo rechazó el envío' };
    }
    return { sent: true };
  }

  credentials(to: string, name: string, password: string) { return this.send(to, 'Tus credenciales de acceso', `<p>Hola ${name || 'usuario'},</p><p>Tu cuenta fue creada.</p><p><strong>Correo:</strong> ${to}<br/><strong>Contraseña temporal:</strong> ${password}</p><p>Cámbiala al iniciar sesión.</p>`); }
  reset(to: string, url: string) { return this.send(to, 'Restablece tu contraseña', `<p>Solicitaste restablecer tu contraseña.</p><p><a href="${url}">Restablecer contraseña</a></p><p>Este enlace vence en 15 minutos.</p>`); }
  invitation(to: string, organization: string, role: string) { return this.send(to, `Invitación a ${organization}`, `<p>Has sido invitado a <strong>${organization}</strong> con el rol <strong>${role}</strong>.</p><p>Inicia sesión para acceder.</p>`); }
}
