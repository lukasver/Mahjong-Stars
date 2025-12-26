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
    title: "Обзор платформы",
  },
  "01-introduction": {
    title: "Введение",
    type: "doc",
  },
  "02-market-opportunity": {
    title: "Рыночные возможности",
    type: "doc",
  },
  "##": {
    type: "separator",
    title: "Функции платформы",
  },
  "03-product-overview": {
    title: "Обзор продукта",
    type: "doc",
  },
  "04-player-experience": {
    title: "Игровой опыт",
    type: "doc",
  },
  "05-game-economy": {
    title: "Экономика игры",
    type: "doc",
  },
  "###": {
    type: "separator",
    title: "Соответствие нормативным требованиям и стратегия",
  },
  "06-regulatory-compliance": {
    title: "Соответствие нормативным требованиям",
    type: "doc",
  },
  "07-roadmap": {
    title: "Дорожная карта",
    type: "doc",
  },
  "08-team": {
    title: "Команда",
    type: "doc",
  },
  "####": {
    type: "separator",
    title: "Ресурсы",
  },
  "09-glossary": {
    title: "Глоссарий",
    type: "doc",
  },
  "10-conclusion": {
    title: "Заключение",
    type: "doc",
  },
  "#####": {
    type: "separator",
  },
  contact: {
    title: "Свяжитесь с нами",
    href: `mailto:${metadata.supportEmail}`,
    // applyUTM("/web/contact", {
    //   source: "docs",
    //   medium: "sidebar",
    //   campaign: "contact_inquiry",
    //   content: "sidebar_nav",
    // }),
  },
  subscribe: {
    title: "Подписаться",
    href: applyUTM("https://www.mahjongstars.com/#newsletter", {
      source: "docs.thetilescompany.io",
      medium: "sidebar",
      campaign: "newsletter_signup",
      content: "sidebar_nav",
    }),
  },
};

export default meta;
