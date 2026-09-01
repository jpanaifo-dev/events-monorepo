import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service.js';

/**
 * @deprecated Use MailService from MailModule directly.
 */
@Injectable()
export class EmailService {
  constructor(private readonly mail: MailService) {}

  async send(to: string, subject: string, html: string) {
    return this.mail.send({ to, subject, html });
  }

  async credentials(to: string, name: string, password: string) {
    return this.mail.sendWelcome(to, { recipientName: name, email: to, temporaryPassword: password });
  }

  async reset(to: string, url: string) {
    return this.mail.sendResetPassword(to, { resetUrl: url });
  }

  async invitation(to: string, organization: string, role: string) {
    return this.mail.sendInvitation(to, { organizationName: organization, role });
  }
}
