export interface SendMailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  fromName?: string;
  fromEmail?: string;
}

export interface MailDeliveryResult {
  sent: boolean;
  messageId?: string;
  reason?: string;
}

export interface WelcomeEmailData {
  recipientName?: string;
  email: string;
  temporaryPassword?: string;
  loginUrl?: string;
  organizationName?: string;
  role?: string;
}

export interface ResetPasswordEmailData {
  recipientName?: string;
  resetUrl: string;
  expiresInMinutes?: number;
}

export interface OrgInvitationEmailData {
  recipientName?: string;
  organizationName: string;
  role: string;
  inviterName?: string;
  acceptUrl?: string;
}

export interface PasswordChangedEmailData {
  recipientName?: string;
  email: string;
  changedAt?: string;
}

export interface GeneralNotificationEmailData {
  recipientName?: string;
  title: string;
  subtitle?: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
  details?: Array<{ label: string; value: string }>;
}
