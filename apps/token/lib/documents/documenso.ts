import 'server-only';
import { Documenso } from '@documenso/sdk-typescript';
import { invariant } from '@epic-web/invariant';
import { env } from '@/common/config/env';

export class DocumensoSdk extends Documenso {
  constructor(config: typeof env) {
    invariant(config.DOCUMENSO_API_KEY, 'DOCUMENSO_API_KEY is required');
    try {
      super({
        apiKey: config.DOCUMENSO_API_KEY,
      });
    } catch (error) {
      console.error('Error instantiating DocumensoSdk:', error);
      throw error;
    }
  }

  getSignatureUrl(token: string) {
    if (!token) {
      return null;
    }
    return `https://app.documenso.com/sign/${token}`;
  }
}
