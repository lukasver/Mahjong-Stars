import { Icons } from "@mjs/ui/components/icons";
import { cn } from "@mjs/ui/lib/utils";
import { Button } from "@mjs/ui/primitives/button";
import {
  BoxesIcon, MailIcon
} from "lucide-react";
import Image from "next/image";
import { metadata as siteConfig } from "@/common/config/site";
import Logo from "@/public/assets/icon.png";
import ActiveLink from "./ActiveLink";
import FooterSupportButton from "./FooterSupportButton";
import AppLink from "./link";

export const footerLinks: Array<{
  columnName: string;
  links: Array<{
    href: string;
    title: string;
  }>;
}> = [
    {
      columnName: "Company",
      links: [
        { href: "/", title: "Home" },
        // { href: '/about', title: 'About' },
      ],
    },
    { columnName: "Product", links: [] },
    {
      columnName: "Docs",
      links: [{ href: "https://docs.thetilescompany.io", title: "White paper" }],
    },
    {
      columnName: "Support",
      links: [{ href: "#support", title: "Support" }],
    },
  ];

export const Footer = ({ className }: { className?: string }) => {
  const columnNumber = footerLinks.filter(({ links }) => links.length).length;

  return (
    <footer
      className={cn(
        "mt-auto w-full bg-linear-to-r from-white/5 via-white/60 to-white/5 backdrop-blur-xs dark:from-slate-700/5 dark:via-slate-700/60 dark:to-slate-700/5",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 justify-between items-center w-full md:my-10 p-6",
        )}
      >
        <div className="w-full flex flex-col md:flex-row justify-between gap-6 mt-12  p-6 max-w-full container-wide">
          <div className="w-full flex flex-col gap-4 md:max-w-xs lg:max-w-sm">
            <AppLink href="/" aria-label={siteConfig.title}>
              <div className="flex items-center gap-3 justify-start">
                <Image
                  {...Logo}
                  alt="The Tiles Company logo"
                  height={29}
                  width={29}
                  className="group-hover:animate-wiggle "
                />
              </div>
            </AppLink>

            {typeof siteConfig.title === "string" ? (
              <div className="text-lg font-semibold">{siteConfig.title}</div>
            ) : null}

            {siteConfig.description ? (
              <p className="text-sm opacity-70">{siteConfig.description}</p>
            ) : null}

            <p className="text-xs">Copyright © {siteConfig.businessName}</p>
          </div>

          <div
            className={cn(
              "grid md:grid-cols-2 gap-12 items-start mt-6 md:mt-0",
              columnNumber === 3 ? "md:grid-cols-3" : "",
              columnNumber === 4 ? "lg:grid-cols-4" : "",
            )}
          >
            {footerLinks
              .filter(({ links }) => links.length)
              .map((column, index) => {
                return (
                  <ul
                    key={index}
                    className={cn(
                      "flex flex-col flex-wrap gap-4 justify-center w-full text-xs",
                    )}
                  >
                    {column.columnName ? (
                      <li>
                        <p className="text-slate-900 dark:text-slate-100 font-light text-base">
                          {column.columnName}
                        </p>
                      </li>
                    ) : null}

                    {column.links.map((link, index) => {
                      if (!link.href) {
                        return null;
                      }

                      if (link.href === "#support") {
                        return (
                          <li key={index}>
                            <FooterSupportButton />
                          </li>
                        );
                      }

                      return (
                        <li key={index}>
                          <ActiveLink
                            href={link.href}
                            className={"nav-link"}
                            activeClassName={"nav-link-active"}
                          >
                            <span>{link.title}</span>
                          </ActiveLink>
                        </li>
                      );
                    })}
                  </ul>
                );
              })}
          </div>
        </div>
      </div>

      <div>
        <hr
          className="w-full my-4 border-0 bg-linear-to-r from-white/5 via-black/10 to-white/5 dark:from-black/5 dark:via-white/30 darK:to-black/5"
          style={{ height: "1px" }}
        />

        <div className="py-8 px-2 flex flex-col items-center">
          <div className="mb-3 flex flex-wrap justify-center gap-4">
            {siteConfig.supportEmail && (
              <a href={`mailto:${siteConfig.supportEmail}`}>
                <Button variant="ghost" size="icon" aria-label="Email">
                  <MailIcon className="w-6 h-6" />
                </Button>
              </a>
            )}

            {siteConfig.twitter && (
              <a href={siteConfig.twitter}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="𝕏 (formerly Twitter)"
                >
                  <Icons.xTwitter className="w-5 h-5" />
                </Button>
              </a>
            )}

            {siteConfig.instagram && (
              <a href={siteConfig.instagram}>
                <Button variant="ghost" size="icon" aria-label="Instagram">
                  <Icons.instagram className="w-5 h-5" />
                </Button>
              </a>
            )}

            {/* {siteConfig.tiktok && (
              <a href={siteConfig.tiktok}>
                <Button variant="ghost" size="icon" aria-label="TikTok">
                  <TiktokIcon className="w-5 h-5" />
                </Button>
              </a>
            )} */}

            {siteConfig.github && (
              <a href={siteConfig.github}>
                <Button variant="ghost" size="icon" aria-label="GitHub">
                  <Icons.github className="w-6 h-6" />
                </Button>
              </a>
            )}

            {siteConfig.linkedin && (
              <a href={siteConfig.linkedin}>
                <Button variant="ghost" size="icon" aria-label="LinkedIn">
                  <Icons.linkedin className="w-6 h-6" />
                </Button>
              </a>
            )}

            {siteConfig.youtube && (
              <a href={siteConfig.youtube}>
                <Button variant="ghost" size="icon" aria-label="YouTube">
                  <Icons.youtube className="w-7 h-7" />
                </Button>
              </a>
            )}

            {siteConfig.facebook && (
              <a href={siteConfig.facebook}>
                <Button variant="ghost" size="icon" aria-label="Facebook">
                  <Icons.facebook className="w-6 h-6" />
                </Button>
              </a>
            )}

            {/* {siteConfig.threads && (
              <a href={siteConfig.threads}>
                <Button variant="ghost" size="icon" aria-label="Threads">
                  <ThreadsIcon className="w-6 h-6" />
                </Button>
              </a>
            )} */}

            {siteConfig.mastodon && (
              <a href={siteConfig.mastodon}>
                <Button variant="ghost" size="icon" aria-label="Mastodon">
                  <BoxesIcon className="w-6 h-6" />
                </Button>
              </a>
            )}
          </div>
          <div className="w-full text-center lg:flex lg:justify-center p-4 mb-2 space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <span>{`© ${new Date().getFullYear()}`}</span>
            <span>{` • `}</span>
            <AppLink href="/">{siteConfig.businessName}</AppLink>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
