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
    title: "Visão Geral da Plataforma",
  },
  "01-introduction": {
    title: "Introdução",
    type: "doc",
  },
  "02-market-opportunity": {
    title: "Oportunidade de Mercado",
    type: "doc",
  },
  "##": {
    type: "separator",
    title: "Recursos da Plataforma",
  },
  "03-product-overview": {
    title: "Visão Geral do Produto",
    type: "doc",
  },
  "04-player-experience": {
    title: "Experiência do Jogador",
    type: "doc",
  },
  "05-game-economy": {
    title: "Economia do Jogo",
    type: "doc",
  },
  "###": {
    type: "separator",
    title: "Conformidade e Estratégia",
  },
  "06-regulatory-compliance": {
    title: "Conformidade Regulatória",
    type: "doc",
  },
  "07-roadmap": {
    title: "Roteiro",
    type: "doc",
  },
  "08-team": {
    title: "Equipe",
    type: "doc",
  },
  "####": {
    type: "separator",
    title: "Recursos",
  },
  "09-glossary": {
    title: "Glossário",
    type: "doc",
  },
  "10-conclusion": {
    title: "Conclusão",
    type: "doc",
  },
  "#####": {
    type: "separator",
  },
  contact: {
    title: "Contate-nos",
    href: `mailto:${metadata.supportEmail}`,
    // applyUTM("/web/contact", {
    //   source: "docs",
    //   medium: "sidebar",
    //   campaign: "contact_inquiry",
    //   content: "sidebar_nav",
    // }),
  },
  subscribe: {
    title: "Inscreva-se",
    href: applyUTM("https://www.mahjongstars.com/#newsletter", {
      source: "docs.thetilescompany.io",
      medium: "sidebar",
      campaign: "newsletter_signup",
      content: "sidebar_nav",
    }),
  },
};

export default meta;
