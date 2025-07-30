import { templates } from '@mjs/emails';
import { ComponentProps, ReactElement } from 'react';
import { Resend } from 'resend';
import { env } from '../common/config/env';

type EmailTemplate = keyof typeof templates;
type EmailTemplateComponent = (typeof templates)[EmailTemplate];

/**
 * Configuration options for the email service
 */
export interface EmailServiceConfig {
  apiKey: string;
  defaultFrom: string;
}

/**
 * Represents an email recipient
 */
export interface EmailRecipient {
  email: string;
  name?: string;
}

/**
 * Represents an email attachment
 */
export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
}

/**
 * Data structure for sending an email
 */
export interface EmailData {
  from?: string;
  to: EmailRecipient | EmailRecipient[];
  cc?: EmailRecipient | EmailRecipient[];
  bcc?: EmailRecipient | EmailRecipient[];
  subject: string;
  html?: string;
  text?: string;
  react?: ReactElement;
  attachments?: EmailAttachment[];
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

/**
 * Result of sending an email
 */
export type EmailSingleResult =
  | {
      id: string;
      success: true;
    }
  | {
      success: false;
      error: Error;
    };

/**
 * Result of sending a batch of emails
 */
export type EmailBatchResult =
  | {
      ids: string[];
      success: true;
    }
  | {
      success: false;
      error: Error;
    };

export type EmailResult = EmailSingleResult | EmailBatchResult;

/**
 * Email service interface
 */
export interface IEmailService {
  /**
   * Send an email to a single recipient
   * @param emailData The email data to send
   * @returns A promise that resolves to the email result
   */
  sendEmail(
    emailData: EmailData & { to: EmailRecipient }
  ): Promise<EmailSingleResult>;

  /**
   * Send an email to multiple recipients
   * @param emailData The email data to send
   * @returns A promise that resolves to the batch email result
   */
  sendEmail(
    emailData: EmailData & { to: EmailRecipient[] }
  ): Promise<EmailBatchResult>;

  /**
   * Send an email to multiple recipients
   * @param emailData The email data to send
   * @returns A promise that resolves to the batch email result
   */
  sendEmail(emailData: EmailData): Promise<EmailResult>;

  /**
   * Send a template email to a single recipient
   * @param templateId The ID of the template to use
   * @param data The data to use for the template
   * @param emailData Additional email data
   * @returns A promise that resolves to the email result
   */
  sendTemplateEmail(
    templateId: string,
    data: Record<string, unknown>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'> & {
      to: EmailRecipient;
    }
  ): Promise<EmailSingleResult>;

  /**
   * Send a template email to multiple recipients
   * @param templateId The ID of the template to use
   * @param data The data to use for the template
   * @param emailData Additional email data
   * @returns A promise that resolves to the batch email result
   */
  sendTemplateEmail(
    templateId: string,
    data: Record<string, unknown>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'> & {
      to: EmailRecipient[];
    }
  ): Promise<EmailBatchResult>;
  sendTemplateEmail(
    templateId: string,
    data: Record<string, unknown>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'>
  ): Promise<EmailResult>;

  /**
   * Send a React-based email to a single recipient
   * @param template The template name from available templates
   * @param props The props for the template component
   * @param emailData Additional email data
   * @returns A promise that resolves to the email result
   */
  sendReactEmail<T extends EmailTemplate>(
    template: T,
    props: ComponentProps<(typeof templates)[T]>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'> & {
      to: EmailRecipient;
    }
  ): Promise<EmailSingleResult>;

  /**
   * Send a React-based email to multiple recipients
   * @param template The template name from available templates
   * @param props The props for the template component
   * @param emailData Additional email data
   * @returns A promise that resolves to the batch email result
   */
  sendReactEmail<T extends EmailTemplate>(
    template: T,
    props: ComponentProps<(typeof templates)[T]>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'> & {
      to: EmailRecipient[];
    }
  ): Promise<EmailBatchResult>;
  sendReactEmail<T extends EmailTemplate>(
    template: T,
    props: ComponentProps<(typeof templates)[T]>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'>
  ): Promise<EmailResult>;
}

/**
 * Email service implementation using Resend
 */
export class ResendEmailService implements IEmailService {
  private resend: Resend;
  private defaultFrom: string;

  /**
   * Create a new ResendEmailService
   * @param config The configuration for the email service
   */
  constructor(config: EmailServiceConfig) {
    this.resend = new Resend(config.apiKey);
    this.defaultFrom = config.defaultFrom;
  }

  /**
   * Format recipients to Resend's expected format
   * @param recipients The recipients to format
   * @returns The formatted recipients
   */
  private formatRecipients(
    recipients: EmailRecipient | EmailRecipient[] | undefined
  ): string[] | undefined {
    if (!recipients) return undefined;

    const recipientArray = Array.isArray(recipients)
      ? recipients
      : [recipients];
    return recipientArray.map((recipient) => {
      if (recipient.name) {
        return `${recipient.name} <${recipient.email}>`;
      }
      return recipient.email;
    });
  }

  /**
   * Send an email
   * @param emailData The email data to send
   * @returns A promise that resolves to the email result
   */
  public async sendEmail(
    emailData: Omit<EmailData, 'react'> & { to: EmailRecipient }
  ): Promise<EmailSingleResult>;
  public async sendEmail(
    emailData: Omit<EmailData, 'react'> & { to: EmailRecipient[] }
  ): Promise<EmailBatchResult>;
  public async sendEmail(
    emailData: Omit<EmailData, 'react'>
  ): Promise<EmailResult> {
    if (Array.isArray(emailData.to)) {
      try {
        const bulkData = emailData as Omit<EmailData, 'to'> & {
          to: EmailRecipient[];
        };

        if (!emailData.text && !emailData.html) {
          throw new Error('Text or HTML is required');
        }
        const batch = await this.resend.batch.send(
          bulkData.to.map((recipient) => ({
            from: emailData.from || this.defaultFrom,
            to: this.formatRecipients(recipient) as string[],
            cc: this.formatRecipients(emailData.cc),
            bcc: this.formatRecipients(emailData.bcc),
            subject: emailData.subject,
            ...(emailData.text
              ? { text: emailData.text }
              : { html: emailData.html! }),
            attachments: emailData.attachments?.map((attachment) => ({
              filename: attachment.filename,
              content: attachment.content,
              content_type: attachment.contentType,
            })),
            tags: emailData.tags,
          }))
        );

        if (batch.error) {
          throw batch.error;
        }

        return {
          ids: batch?.data?.data?.map((item) => item.id) || [],
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error as Error,
        };
      }
    }

    try {
      if (!emailData.text && !emailData.html) {
        throw new Error('Text or HTML is required');
      }
      const { data, error } = await this.resend.emails.send({
        from: emailData.from || this.defaultFrom,
        to: this.formatRecipients(emailData.to) as string[],
        cc: this.formatRecipients(emailData.cc),
        bcc: this.formatRecipients(emailData.bcc),
        subject: emailData.subject,
        replyTo: emailData.replyTo,
        ...(emailData.text
          ? { text: emailData.text! }
          : { html: emailData.html! }),
        attachments: emailData.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          content_type: attachment.contentType,
        })),
        tags: emailData.tags,
      });

      if (error) {
        throw error;
      }

      return {
        id: data?.id || '',
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Send a template email
   * @param templateId The ID of the template to use
   * @param data The data to use for the template
   * @param emailData Additional email data
   * @returns A promise that resolves to the email result
   */
  public async sendTemplateEmail(
    templateId: string,
    templateData: Record<string, unknown>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'> & {
      to: EmailRecipient;
    }
  ): Promise<EmailSingleResult>;
  public async sendTemplateEmail(
    templateId: string,
    templateData: Record<string, unknown>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'> & {
      to: EmailRecipient[];
    }
  ): Promise<EmailBatchResult>;
  public async sendTemplateEmail(
    templateId: string,
    templateData: Record<string, unknown>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'>
  ): Promise<EmailResult> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: emailData.from || this.defaultFrom,
        to: this.formatRecipients(emailData.to) as string[],
        cc: this.formatRecipients(emailData.cc),
        bcc: this.formatRecipients(emailData.bcc),
        subject: emailData.subject,
        replyTo: emailData.replyTo,
        attachments: emailData.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          content_type: attachment.contentType,
        })),
        tags: emailData.tags,
        html: `<!-- Template: ${templateId} -->`,
        headers: {
          'X-Template-Id': templateId,
          'X-Template-Data': JSON.stringify(templateData),
        },
      });

      if (error) {
        throw error;
      }

      return {
        id: data?.id || '',
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }

  /**
   * Send a React-based email
   * @param template The template name from available templates
   * @param props The props for the template component
   * @param emailData Additional email data
   * @returns A promise that resolves to the email result
   */
  public async sendReactEmail<T extends EmailTemplate>(
    template: T,
    props: ComponentProps<(typeof templates)[T]>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'> & {
      to: EmailRecipient;
    }
  ): Promise<EmailSingleResult>;
  public async sendReactEmail<T extends EmailTemplate>(
    template: T,
    props: ComponentProps<(typeof templates)[T]>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'> & {
      to: EmailRecipient[];
    }
  ): Promise<EmailBatchResult>;
  public async sendReactEmail<T extends EmailTemplate>(
    template: T,
    props: ComponentProps<(typeof templates)[T]>,
    emailData: Omit<EmailData, 'html' | 'text' | 'react'>
  ): Promise<EmailResult> {
    if (Array.isArray(emailData.to)) {
      try {
        const bulkData = emailData as Omit<
          EmailData,
          'html' | 'text' | 'react' | 'to'
        > & {
          to: EmailRecipient[];
        };

        // Get the email component
        const EmailComponent: EmailTemplateComponent = templates[template];

        const batch = await this.resend.batch.send(
          bulkData.to.map((recipient) => ({
            from: emailData.from || this.defaultFrom,
            to: this.formatRecipients(recipient) as string[],
            cc: this.formatRecipients(emailData.cc),
            bcc: this.formatRecipients(emailData.bcc),
            subject: emailData.subject,
            replyTo: emailData.replyTo,
            attachments: emailData.attachments?.map((attachment) => ({
              filename: attachment.filename,
              content: attachment.content,
              content_type: attachment.contentType,
            })),
            tags: emailData.tags,
            // @ts-expect-error - TODO: fix this
            react: EmailComponent(props),
          }))
        );

        if (batch.error) {
          throw batch.error;
        }

        return {
          ids: batch?.data?.data?.map((item) => item.id) || [],
          success: true,
        };
      } catch (error) {
        return {
          success: false,
          error: error as Error,
        };
      }
    }

    try {
      // Get the email component
      const EmailComponent: EmailTemplateComponent = templates[template];

      const { data, error } = await this.resend.emails.send({
        from: emailData.from || this.defaultFrom,
        to: this.formatRecipients(emailData.to) as string[],
        cc: this.formatRecipients(emailData.cc),
        bcc: this.formatRecipients(emailData.bcc),
        subject: emailData.subject,
        replyTo: emailData.replyTo,
        // @ts-expect-error - TODO: fix this
        react: EmailComponent(props),
        attachments: emailData.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          content_type: attachment.contentType,
        })),
        tags: emailData.tags,
      });

      if (error) {
        throw error;
      }

      return {
        id: data?.id || '',
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
      };
    }
  }
}

/**
 * Factory for creating email services
 */
export class EmailServiceFactory {
  /**
   * Create a Resend email service
   * @param config The configuration for the email service
   * @returns A new ResendEmailService
   */
  public static createResendService(config: EmailServiceConfig): IEmailService {
    return new ResendEmailService(config);
  }
}

/**
 * Create and configure the default email service
 * @param apiKey Resend API key
 * @param defaultFrom Default sender email address
 * @returns Configured email service
 */
export const createEmailService = (
  apiKey: string = env.EMAIL_API_KEY || '',
  defaultFrom: string = env.EMAIL_FROM || 'noreply@example.com'
): IEmailService => {
  return EmailServiceFactory.createResendService({
    apiKey,
    defaultFrom,
  });
};

export default createEmailService;
