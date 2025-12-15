"use client";

import { usePathname } from "next/navigation";

import React, {
  Children,
  ReactElement,
  ReactNode,
  useEffect,
  useState,
} from "react";
import AppLink from "./link";

interface ActiveLinkProps {
  children: ReactNode;
  activeClassName: string;
  href: string;
  as?: string;
  [key: string]: unknown;
}

export const ActiveLink = ({
  children,
  activeClassName,
  ...props
}: ActiveLinkProps) => {
  const routePathname = usePathname();
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    // Check if the router fields are updated client-side
    // Dynamic route will be matched via props.as
    // Static route will be matched via props.href
    const linkPathname = new URL(props.as || props.href, location.href)
      .pathname;

    // Using URL().pathname to get rid of query and hash
    const activePathname = new URL(routePathname, location.href).pathname;

    const newIsActive = linkPathname === activePathname;

    if (newIsActive !== isActive) {
      setIsActive(newIsActive);
    }
  }, [routePathname, props.as, props.href, isActive]);

  const processChildren = (children: ReactNode): ReactNode => {
    return Children.map(children, (child) => {
      if (!React.isValidElement(child)) {
        return child;
      }

      const childElement = child as ReactElement<{ className?: string }>;
      const childClassName = childElement.props.className || "";
      const newClassName = isActive
        ? `${childClassName} ${activeClassName}`.trim()
        : childClassName;

      return React.cloneElement(childElement, {
        ...childElement.props,
        className: newClassName || undefined,
      });
    });
  };

  return (
    <AppLink {...props} href={props.href}>
      {processChildren(children)}
    </AppLink>
  );
};

export default ActiveLink;
