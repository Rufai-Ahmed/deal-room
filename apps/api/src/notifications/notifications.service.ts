import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { AppConfig } from '../config/app-config';
import { documentOpenedEmail, newCommentEmail } from './email-templates';

export interface DocumentOpenedPayload {
  to: string;
  founderName: string;
  documentName: string;
  viewerLabel: string;
  recipientName: string | null;
  openedAt: Date;
  documentUrl: string;
}

export interface NewCommentPayload {
  to: string;
  recipientName: string;
  documentName: string;
  authorLabel: string;
  body: string;
  url: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly resend: Resend | null;

  constructor(private readonly config: ConfigService<AppConfig, true>) {
    const apiKey = config.get('mail', { infer: true }).apiKey;
    this.resend = apiKey ? new Resend(apiKey) : null;
  }

  /// Never awaited by request handlers. A mail outage must not delay or fail
  /// the investor's redirect into the document.
  documentOpened(payload: DocumentOpenedPayload): void {
    void this.send(
      payload.to,
      `${payload.viewerLabel} opened ${payload.documentName}`,
      documentOpenedEmail(payload),
    );
  }

  newComment(payload: NewCommentPayload): void {
    void this.send(
      payload.to,
      `${payload.authorLabel} commented on ${payload.documentName}`,
      newCommentEmail(payload),
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    if (!this.resend) {
      this.logger.log(`Mail suppressed (no API key): "${subject}" to ${to}`);
      return;
    }

    try {
      await this.resend.emails.send({
        from: this.config.get('mail', { infer: true }).from,
        to,
        subject,
        html,
      });
    } catch (error) {
      this.logger.error(`Failed to send "${subject}" to ${to}`, error as Error);
    }
  }
}
