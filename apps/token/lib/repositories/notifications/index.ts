import createEmailService, {
  EmailData,
  EmailResult,
  IEmailService,
} from '@/lib/email';
import { templates } from '@mjs/emails';
import { ComponentProps } from 'react';

type NotificationTransportName =
  | 'Email'
  | 'Push'
  | 'SMS'
  | 'Whatsapp'
  | 'Telegram';

type BaseEmail = EmailData;

type TemplateEmail = {
  templateId: string;
  templateData?: Record<string, unknown>;
};

type ReactEmail = {
  template: keyof typeof templates;
  props: ComponentProps<(typeof templates)[keyof typeof templates]>;
};

type Notification =
  | BaseEmail
  | (BaseEmail & TemplateEmail)
  | (BaseEmail & ReactEmail);

interface NotificationTransport {
  name: NotificationTransportName;
  send(dtos: Notification): Promise<EmailResult>;
}

class EmailTransport implements NotificationTransport {
  readonly name: NotificationTransportName = 'Email';
  private readonly service: IEmailService;

  constructor(_service?: IEmailService) {
    this.service = _service || createEmailService();
  }

  async send(dtos: Notification): Promise<EmailResult> {
    if ('templateId' in dtos) {
      const { templateId, templateData, ...rest } = dtos;
      return this.service.sendTemplateEmail(
        dtos.templateId,
        dtos.templateData || {},
        rest
      );
    }
    if ('template' in dtos) {
      const { props, ...rest } = dtos;
      return this.service.sendReactEmail(dtos.template, dtos.props || {}, rest);
    }
    return this.service.sendEmail(dtos);
  }
}

export class Notificator {
  private transports: NotificationTransport[] = [];

  constructor(transports: NotificationTransport[]) {
    this.transports = transports;
  }

  public addTransport = (transport: NotificationTransport) => {
    this.transports.push(transport);
  };
  public getTransports = () => {
    return this.transports;
  };
  public removeTransport = (name: NotificationTransportName) => {
    this.transports = this.transports.filter((t) => t.name !== name);
  };

  async send(dtos: Notification): Promise<void> {
    this.transports.forEach((transport) => {
      transport.send(dtos);
    });
  }
}

export default new Notificator([new EmailTransport()]);
