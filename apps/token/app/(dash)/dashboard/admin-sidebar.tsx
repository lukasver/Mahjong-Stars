"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
} from "@mjs/ui/primitives/sidebar";
import { useUser } from "@/lib/services/api";
import { isAdmin } from "@/lib/utils";
import { NavAdmin } from "../../../components/nav/nav-admin";

const items = [
  {
    title: "Sales",
    url: "/admin/sales",
    icon: "sale",
    items: [
      {
        title: "List",
        url: "/admin/sales",
      },
      {
        title: "New sale",
        url: "/admin/sales/create",
      },
    ],
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: "transaction",
    items: [
      {
        title: "List",
        url: "/admin/transactions",
      },
    ],
  },
  {
    title: "Users",
    url: "/admin/users",
    icon: "users",
    items: [
      {
        title: "List",
        url: "/admin/users",
      },
    ],
  },
];
export default function AdminSidebar() {
  const { data } = useUser();

  const isAllowed = isAdmin(data?.roles);
  if (!isAllowed) return null;
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Administration</SidebarGroupLabel>
      <SidebarMenu>
        <NavAdmin items={items} />
      </SidebarMenu>
    </SidebarGroup>
  );
}
