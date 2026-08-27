import { Injectable, Logger } from '@nestjs/common';
import {
  GeneralNotificationEmailData,
  MailDeliveryResult,
  OrgInvitationEmailData,
  PasswordChangedEmailData,
  ResetPasswordEmailData,
  SendMailOptions,
  WelcomeEmailData,
} from './mail.types.js';
import { TemplateService } from './template.service.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly templateService: TemplateService) {}

  /**
   * Low level send method using Resend API
   */
  async send(options: SendMailOptions): Promise<MailDeliveryResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = options.fromEmail || process.env.RESEND_FROM_EMAIL;
    const fromName = options.fromName || process.env.RESEND_FROM_NAME || process.env.APP_NAME || 'Events Platform';
    const toRecipients = Array.isArray(options.to) ? options.to : [options.to];

    if (!apiKey || !fromEmail || apiKey.includes('xxxxxxxx') || apiKey.trim() === '') {
      this.logger.warn(
        `[DEV MODE - Email Simulado] Para: ${toRecipients.join(', ')} | Asunto: "${options.subject}"`
      );
      this.logger.debug(`[DEV MODE - Contenido]:\n${options.text || options.html}`);
      return { sent: true, reason: 'Modo desarrollo: simulado exitosamente en consola' };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: toRecipients,
          subject: options.subject,
          html: options.html,
          text: options.text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Resend falló al enviar correo a [${toRecipients.join(', ')}]: ${errorText}`);
        return { sent: false, reason: `Resend error: ${errorText}` };
      }

      const resData = (await response.json()) as { id?: string };
      this.logger.log(`Correo enviado exitosamente a [${toRecipients.join(', ')}] (ID: ${resData.id ?? 'ok'})`);
      return { sent: true, messageId: resData.id };
    } catch (error: any) {
      this.logger.error(`Error de red o excepción al enviar correo a [${toRecipients.join(', ')}]: ${error.message}`);
      return { sent: false, reason: error.message };
    }
  }

  /**
   * Welcome & credentials email
   */
  async sendWelcome(to: string, data: WelcomeEmailData): Promise<MailDeliveryResult> {
    const template = this.templateService.renderWelcome({ ...data, email: to });
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Password reset request email
   */
  async sendResetPassword(to: string, data: ResetPasswordEmailData): Promise<MailDeliveryResult> {
    const template = this.templateService.renderResetPassword(data);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Organization invitation email
   */
  async sendInvitation(to: string, data: OrgInvitationEmailData): Promise<MailDeliveryResult> {
    const template = this.templateService.renderInvitation(data);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Password changed notification email
   */
  async sendPasswordChanged(to: string, data: PasswordChangedEmailData): Promise<MailDeliveryResult> {
    const template = this.templateService.renderPasswordChanged(data);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  /**
   * Custom notification email
   */
  async sendNotification(to: string, data: GeneralNotificationEmailData): Promise<MailDeliveryResult> {
    const template = this.templateService.renderNotification(data);
    return this.send({
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // --- Backwards Compatibility Helpers ---
  async credentials(to: string, name: string, password: string): Promise<MailDeliveryResult> {
    return this.sendWelcome(to, { recipientName: name, email: to, temporaryPassword: password });
  }

  async reset(to: string, url: string): Promise<MailDeliveryResult> {
    return this.sendResetPassword(to, { resetUrl: url });
  }

  async invitation(to: string, organization: string, role: string): Promise<MailDeliveryResult> {
    return this.sendInvitation(to, { organizationName: organization, role });
  }
}
