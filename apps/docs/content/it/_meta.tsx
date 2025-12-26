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
    title: "Panoramica della Piattaforma",
  },
  "01-introduction": {
    title: "Introduzione",
    type: "doc",
  },
  "02-market-opportunity": {
    title: "Opportunità di Mercato",
    type: "doc",
  },
  "##": {
    type: "separator",
    title: "Funzionalità della Piattaforma",
  },
  "03-product-overview": {
    title: "Panoramica del Prodotto",
    type: "doc",
  },
  "04-player-experience": {
    title: "Esperienza del Giocatore",
    type: "doc",
  },
  "05-game-economy": {
    title: "Economia del Gioco",
    type: "doc",
  },
  "###": {
    type: "separator",
    title: "Conformità e Strategia",
  },
  "06-regulatory-compliance": {
    title: "Conformità Normativa",
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
    title: "Risorse",
  },
  "09-glossary": {
    title: "Glossario",
    type: "doc",
  },
  "10-conclusion": {
    title: "Conclusione",
    type: "doc",
  },
  "#####": {
    type: "separator",
  },
  contact: {
    title: "Contattaci",
    href: `mailto:${metadata.supportEmail}`,
    // applyUTM("/web/contact", {
    //   source: "docs",
    //   medium: "sidebar",
    //   campaign: "contact_inquiry",
    //   content: "sidebar_nav",
    // }),
  },
  subscribe: {
    title: "Iscriviti",
    href: applyUTM("https://www.mahjongstars.com/#newsletter", {
      source: "docs.thetilescompany.io",
      medium: "sidebar",
      campaign: "newsletter_signup",
      content: "sidebar_nav",
    }),
  },
};

export default meta;
