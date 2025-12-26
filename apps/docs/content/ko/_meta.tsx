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
    title: "플랫폼 개요",
  },
  "01-introduction": {
    title: "소개",
    type: "doc",
  },
  "02-market-opportunity": {
    title: "시장 기회",
    type: "doc",
  },
  "##": {
    type: "separator",
    title: "플랫폼 기능",
  },
  "03-product-overview": {
    title: "제품 개요",
    type: "doc",
  },
  "04-player-experience": {
    title: "플레이어 경험",
    type: "doc",
  },
  "05-game-economy": {
    title: "게임 경제",
    type: "doc",
  },
  "###": {
    type: "separator",
    title: "규정 준수 및 전략",
  },
  "06-regulatory-compliance": {
    title: "규정 준수",
    type: "doc",
  },
  "07-roadmap": {
    title: "로드맵",
    type: "doc",
  },
  "08-team": {
    title: "팀",
    type: "doc",
  },
  "####": {
    type: "separator",
    title: "자료",
  },
  "09-glossary": {
    title: "용어집",
    type: "doc",
  },
  "10-conclusion": {
    title: "결론",
    type: "doc",
  },
  "#####": {
    type: "separator",
  },
  contact: {
    title: "문의하기",
    href: `mailto:${metadata.supportEmail}`,
    // applyUTM("/web/contact", {
    //   source: "docs",
    //   medium: "sidebar",
    //   campaign: "contact_inquiry",
    //   content: "sidebar_nav",
    // }),
  },
  subscribe: {
    title: "구독하기",
    href: applyUTM("https://www.mahjongstars.com/#newsletter", {
      source: "docs.thetilescompany.io",
      medium: "sidebar",
      campaign: "newsletter_signup",
      content: "sidebar_nav",
    }),
  },
};

export default meta;
