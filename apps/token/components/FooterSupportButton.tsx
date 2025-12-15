'use client';

import { metadata } from '@/common/config/site';


const appWindow = typeof window !== 'undefined' ? window : null;
const appNavigator = typeof window !== 'undefined' ? window?.navigator : null;

const sanitizeMailBody = (body: string) => body.replace(/(?:\r\n|\r|\n)/g, '%0D%0A');

export const SUPPORT_EMAIL = metadata.supportEmail;

export const APP_INFO_TEXT = `


-------------------
Please do not remove the information below.

Location: ${appWindow?.location.href}
Device Info: ${appNavigator?.userAgent}
Window Size: ${appWindow?.innerWidth} x ${appWindow?.innerHeight}
Platform: ${appNavigator?.platform}
Cookies Enabled: ${appNavigator?.cookieEnabled}
Connection: ${(
    appNavigator as unknown as {
      connection: {
        effectiveType: string;
      };
    }
  )?.connection?.effectiveType
  }
-------------------
`;

const HELP_SUBJECT = `[${metadata.businessName}] Support Request`;

export const HELP_HREF = `mailto:${SUPPORT_EMAIL}?subject=${HELP_SUBJECT}&body=${sanitizeMailBody(
  APP_INFO_TEXT,
)}`;

export const FooterSupportButton = () => {
  const openSupport = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.open(HELP_HREF, '_blank');
  };

  return (
    <a href="#" onClick={openSupport} className={'nav-link'}>
      Contact Support
    </a>
  );
};

export default FooterSupportButton;
