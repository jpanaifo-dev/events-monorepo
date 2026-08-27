import { Injectable } from '@nestjs/common';
import {
  GeneralNotificationEmailData,
  OrgInvitationEmailData,
  PasswordChangedEmailData,
  ResetPasswordEmailData,
  WelcomeEmailData,
} from './mail.types.js';
import { emailTemplates } from './templates/email-templates.js';

@Injectable()
export class TemplateService {
  renderWelcome(data: WelcomeEmailData) {
    return emailTemplates.welcome(data);
  }

  renderResetPassword(data: ResetPasswordEmailData) {
    return emailTemplates.resetPassword(data);
  }

  renderInvitation(data: OrgInvitationEmailData) {
    return emailTemplates.invitation(data);
  }

  renderPasswordChanged(data: PasswordChangedEmailData) {
    return emailTemplates.passwordChanged(data);
  }

  renderNotification(data: GeneralNotificationEmailData) {
    return emailTemplates.notification(data);
  }
}
