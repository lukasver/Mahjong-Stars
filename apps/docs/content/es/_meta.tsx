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
    title: "Descripción general de la plataforma",
  },
  "01-introduction": {
    title: "Introducción",
    type: "doc",
  },
  "02-market-opportunity": {
    title: "Oportunidad de mercado",
    type: "doc",
  },
  "##": {
    type: "separator",
    title: "Características de la plataforma",
  },
  "03-product-overview": {
    title: "Descripción general del producto",
    type: "doc",
  },
  "04-player-experience": {
    title: "Experiencia del jugador",
    type: "doc",
  },
  "05-game-economy": {
    title: "Economía del juego",
    type: "doc",
  },
  "###": {
    type: "separator",
    title: "Cumplimiento y estrategia",
  },
  "06-regulatory-compliance": {
    title: "Cumplimiento normativo",
    type: "doc",
  },
  "07-roadmap": {
    title: "Hoja de ruta",
    type: "doc",
  },
  "08-team": {
    title: "Equipo",
    type: "doc",
  },
  "####": {
    type: "separator",
    title: "Recursos",
  },
  "09-glossary": {
    title: "Glosario",
    type: "doc",
  },
  "10-conclusion": {
    title: "Conclusión",
    type: "doc",
  },
  "#####": {
    type: "separator",
  },
  contact: {
    title: "Contáctanos",
    href: `mailto:${metadata.supportEmail}`,
    // applyUTM("/web/contact", {
    //   source: "docs",
    //   medium: "sidebar",
    //   campaign: "contact_inquiry",
    //   content: "sidebar_nav",
    // }),
  },
  subscribe: {
    title: "Suscríbete",
    href: applyUTM("https://www.mahjongstars.com/#newsletter", {
      source: "docs.thetilescompany.io",
      medium: "sidebar",
      campaign: "newsletter_signup",
      content: "sidebar_nav",
    }),
  },
};

export default meta;
