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
    title: "Aperçu de la plateforme",
  },
  "01-introduction": {
    title: "Introduction",
    type: "doc",
  },
  "02-market-opportunity": {
    title: "Opportunité de marché",
    type: "doc",
  },
  "##": {
    type: "separator",
    title: "Fonctionnalités de la plateforme",
  },
  "03-product-overview": {
    title: "Aperçu du produit",
    type: "doc",
  },
  "04-player-experience": {
    title: "Expérience joueur",
    type: "doc",
  },
  "05-game-economy": {
    title: "Économie du jeu",
    type: "doc",
  },
  "###": {
    type: "separator",
    title: "Conformité et stratégie",
  },
  "06-regulatory-compliance": {
    title: "Conformité réglementaire",
    type: "doc",
  },
  "07-roadmap": {
    title: "Feuille de route",
    type: "doc",
  },
  "08-team": {
    title: "Équipe",
    type: "doc",
  },
  "####": {
    type: "separator",
    title: "Ressources",
  },
  "09-glossary": {
    title: "Glossaire",
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
    title: "Nous contacter",
    href: `mailto:${metadata.supportEmail}`,
    // applyUTM("/web/contact", {
    //   source: "docs",
    //   medium: "sidebar",
    //   campaign: "contact_inquiry",
    //   content: "sidebar_nav",
    // }),
  },
  subscribe: {
    title: "S'abonner",
    href: applyUTM("https://www.mahjongstars.com/#newsletter", {
      source: "docs.thetilescompany.io",
      medium: "sidebar",
      campaign: "newsletter_signup",
      content: "sidebar_nav",
    }),
  },
};

export default meta;
