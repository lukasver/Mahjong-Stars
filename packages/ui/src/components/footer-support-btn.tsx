'use client';

const appWindow = typeof window !== 'undefined' ? window : null;
const appNavigator = typeof window !== 'undefined' ? window?.navigator : null;

const sanitizeMailBody = (body: string) => body.replace(/(?:\r\n|\r|\n)/g, '%0D%0A');

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



export const FooterSupportButton = ({ supportEmail, businessName, title }: { supportEmail: string; businessName: string; title?: string }) => {
  const HELP_SUBJECT = `[${businessName}] Support Request`;

  const HELP_HREF = `mailto:${supportEmail}?subject=${HELP_SUBJECT}&body=${sanitizeMailBody(
    APP_INFO_TEXT,
  )}`;
  const openSupport = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    window.open(HELP_HREF, '_blank');
  };

  return (
    <a href="#" onClick={openSupport}>
      {title || 'Contact Support'}
    </a>
  );
};

FooterSupportButton.displayName = 'FooterSupportButton';


export default FooterSupportButton;
