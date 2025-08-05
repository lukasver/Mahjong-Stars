import Link from 'next/link';
import React, { AnchorHTMLAttributes } from 'react';

export const AppLink = ({
  href,
  ...rest
}: React.ComponentProps<typeof Link> &
  AnchorHTMLAttributes<HTMLAnchorElement>) => {
  const isInternalLink = href && href.startsWith('/');
  const isAnchorLink = href && href.startsWith('#');

  if (isInternalLink) {
    return <Link prefetch={false} href={href} {...rest} />;
  }

  if (isAnchorLink) {
    return <a href={href} {...rest} />;
  }

  return <a target='_blank' rel='noopener noreferrer' href={href} {...rest} />;
};

export default AppLink;
