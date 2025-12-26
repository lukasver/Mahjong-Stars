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
    title: "Plattformübersicht",
  },
  "01-introduction": {
    title: "Einleitung",
    type: "doc",
  },
  "02-market-opportunity": {
    title: "Marktchance",
    type: "doc",
  },
  "##": {
    type: "separator",
    title: "Plattformfunktionen",
  },
  "03-product-overview": {
    title: "Produktübersicht",
    type: "doc",
  },
  "04-player-experience": {
    title: "Spielererlebnis",
    type: "doc",
  },
  "05-game-economy": {
    title: "Spielökonomie",
    type: "doc",
  },
  "###": {
    type: "separator",
    title: "Compliance & Strategie",
  },
  "06-regulatory-compliance": {
    title: "Regulatorische Compliance",
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
    title: "Ressourcen",
  },
  "09-glossary": {
    title: "Glossar",
    type: "doc",
  },
  "10-conclusion": {
    title: "Schlussfolgerung",
    type: "doc",
  },
  "#####": {
    type: "separator",
  },
  contact: {
    title: "Kontaktieren Sie uns",
    href: `mailto:${metadata.supportEmail}`,
    // applyUTM("/web/contact", {
    //   source: "docs",
    //   medium: "sidebar",
    //   campaign: "contact_inquiry",
    //   content: "sidebar_nav",
    // }),
  },
  subscribe: {
    title: "Abonnieren",
    href: applyUTM("https://www.mahjongstars.com/#newsletter", {
      source: "docs.thetilescompany.io",
      medium: "sidebar",
      campaign: "newsletter_signup",
      content: "sidebar_nav",
    }),
  },
};

export default meta;
