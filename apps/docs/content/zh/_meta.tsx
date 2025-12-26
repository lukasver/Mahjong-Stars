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
    title: "平台概述",
  },
  "01-introduction": {
    title: "简介",
    type: "doc",
  },
  "02-market-opportunity": {
    title: "市场机遇",
    type: "doc",
  },
  "##": {
    type: "separator",
    title: "平台功能",
  },
  "03-product-overview": {
    title: "产品概述",
    type: "doc",
  },
  "04-player-experience": {
    title: "玩家体验",
    type: "doc",
  },
  "05-game-economy": {
    title: "游戏经济",
    type: "doc",
  },
  "###": {
    type: "separator",
    title: "合规与策略",
  },
  "06-regulatory-compliance": {
    title: "法规遵从",
    type: "doc",
  },
  "07-roadmap": {
    title: "路线图",
    type: "doc",
  },
  "08-team": {
    title: "团队",
    type: "doc",
  },
  "####": {
    type: "separator",
    title: "资源",
  },
  "09-glossary": {
    title: "术语表",
    type: "doc",
  },
  "10-conclusion": {
    title: "结论",
    type: "doc",
  },
  "#####": {
    type: "separator",
  },
  contact: {
    title: "联系我们",
    href: `mailto:${metadata.supportEmail}`,
  },
  subscribe: {
    title: "订阅",
    href: applyUTM("https://www.mahjongstars.com/#newsletter", {
      source: "docs.thetilescompany.io",
      medium: "sidebar",
      campaign: "newsletter_signup",
      content: "sidebar_nav",
    }),
  },
};

export default meta;
