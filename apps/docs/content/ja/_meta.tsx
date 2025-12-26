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
    title: "プラットフォーム概要",
  },
  "01-introduction": {
    title: "はじめに",
    type: "doc",
  },
  "02-market-opportunity": {
    title: "市場機会",
    type: "doc",
  },
  "##": {
    type: "separator",
    title: "プラットフォーム機能",
  },
  "03-product-overview": {
    title: "製品概要",
    type: "doc",
  },
  "04-player-experience": {
    title: "プレイヤーエクスペリエンス",
    type: "doc",
  },
  "05-game-economy": {
    title: "ゲームエコノミー",
    type: "doc",
  },
  "###": {
    type: "separator",
    title: "コンプライアンスと戦略",
  },
  "06-regulatory-compliance": {
    title: "規制遵守",
    type: "doc",
  },
  "07-roadmap": {
    title: "ロードマップ",
    type: "doc",
  },
  "08-team": {
    title: "チーム",
    type: "doc",
  },
  "####": {
    type: "separator",
    title: "リソース",
  },
  "09-glossary": {
    title: "用語集",
    type: "doc",
  },
  "10-conclusion": {
    title: "結論",
    type: "doc",
  },
  "#####": {
    type: "separator",
  },
  contact: {
    title: "お問い合わせ",
    href: `mailto:${metadata.supportEmail}`,
    // applyUTM("/web/contact", {
    //   source: "docs",
    //   medium: "sidebar",
    //   campaign: "contact_inquiry",
    //   content: "sidebar_nav",
    // }),
  },
  subscribe: {
    title: "購読",
    href: applyUTM("https://www.mahjongstars.com/#newsletter", {
      source: "docs.thetilescompany.io",
      medium: "sidebar",
      campaign: "newsletter_signup",
      content: "sidebar_nav",
    }),
  },
};

export default meta;
