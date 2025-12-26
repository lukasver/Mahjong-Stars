import type { MetaRecord } from "nextra";
import { metadata } from "@/lib/site-config";
import { applyUTM } from "@/lib/utm";

const meta: MetaRecord = {
  _structure: {
    display: "hidden",
  },
  index: {
    type: "doc",
    display: "normal",
    theme: {
      breadcrumb: false,
    },
  },
  "#": {
    type: "separator",
    title: "Platform Overview",
  },
  "01-introduction": {
    title: "Introduction",
    type: "doc",
  },
  "02-market-opportunity": {
    title: "Market Opportunity",
    type: "doc",
  },
  "##": {
    type: "separator",
    title: "Platform Features",
  },
  "03-product-overview": {
    title: "Product Overview",
    type: "doc",
  },
  "04-player-experience": {
    title: "Player Experience",
    type: "doc",
  },
  "05-game-economy": {
    title: "Game Economy",
    type: "doc",
  },
  "###": {
    type: "separator",
    title: "Compliance & Strategy",
  },
  "06-regulatory-compliance": {
    title: "Regulatory Compliance",
    type: "doc",
  },
  "07-roadmap": {
    title: "Roadmap",
    type: "doc",
  },
  "08-team": {
    title: "Team",
    type: "doc",
  },
  "####": {
    type: "separator",
    title: "Resources",
  },
  "09-glossary": {
    title: "Glossary",
    type: "doc",
  },
  "10-conclusion": {
    title: "Conclusion",
    type: "doc",
  },
  "#####": {
    type: "separator",
  },
  contact: {
    title: "Contact Us",
    href: `mailto:${metadata.supportEmail}`,
    // applyUTM("/web/contact", {
    //   source: "docs",
    //   medium: "sidebar",
    //   campaign: "contact_inquiry",
    //   content: "sidebar_nav",
    // }),
  },
  subscribe: {
    title: "Subscribe",
    href: applyUTM("https://www.mahjongstars.com/#newsletter", {
      source: "docs.thetilescompany.io",
      medium: "sidebar",
      campaign: "newsletter_signup",
      content: "sidebar_nav",
    }),
  },
};

export default meta;
