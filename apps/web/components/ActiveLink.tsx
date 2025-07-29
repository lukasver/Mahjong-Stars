'use client';

import { useActiveLink } from '@mjs/ui/hooks/use-active-link';
import { usePathname } from 'next/navigation';
import React, { useState, useEffect, Children } from 'react';
import Link from './Link';

type ActiveLinkProps = {
  children: React.ReactElement;
  activeClassName: string;
  className?: string;
  href: string;
  as?: string;
  scroll?: boolean;
};

const ActiveLink = ({
  children,
  activeClassName,
  ...props
}: ActiveLinkProps) => {
  const routePathname = usePathname();
  const { activeLink, setActiveLink } = useActiveLink();

  const child = Children.only(children);
  const childClassName = child.props.className || '';
  const [className, setClassName] = useState(childClassName);

  useEffect(() => {
    const newClassName =
      activeLink === props.href
        ? `${childClassName} ${activeClassName}`.trim()
        : childClassName;

    if (newClassName !== className) {
      setClassName(newClassName);
    }
  }, [
    routePathname,
    props.as,
    props.href,
    childClassName,
    activeClassName,
    setClassName,
    className,
    activeLink,
  ]);

  const handleHashChange = (href: string) => () => {
    setActiveLink(href);
    // if (href.includes('#')) {
    //   const hash = href.split('#')[1];
    //   setActiveLink(`#${hash}`);
    // }
  };

  return (
    <Link {...props} href={props.href} onClick={handleHashChange(props.href)}>
      {React.cloneElement(child, {
        className: className || null,
      })}
    </Link>
  );
};

export default ActiveLink;
