'use client';

import { Globe, LayoutDashboard } from 'lucide-react';
import * as React from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@mjs/ui/primitives/sidebar';
import { metadata } from '../common/config/site';
import { Logo } from './logo';
import { NavMain } from './nav/nav-main';
import { NavUser } from './nav/nav-user';
import { TeamSwitcher } from './nav/team-switcher';

// This is sample data.
const data = {
  user: {
    name: 'Anonymous',
    email: 'anonymous@example.com',
    avatar: '/static/images/avatars/anonymous.png',
  },
  teams: [
    {
      name: metadata.businessName,
      logo: (props: React.SVGProps<SVGSVGElement>) => (
        <Logo variant='icon' {...props} />
      ),
      plan: '',
    },
  ],
  navMain: [
    {
      title: 'Overview',
      url: '#',
      icon: LayoutDashboard,
      isActive: true,
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
          isActive: true,
        },
        {
          title: 'Buy',
          url: '/dashboard/buy',
        },
        {
          title: 'Transactions',
          url: '/dashboard/transactions',
        },
      ],
    },
    {
      title: 'ICO',
      url: '#',
      icon: Globe,
      items: [
        {
          title: 'Token Info',
          url: '/token',
        },
        {
          title: 'Schedule',
          url: '/schedule',
        },
        {
          title: 'Whitepaper',
          url: '/whitepaper',
        },
      ],
    },
  ],
};

export function DashboardSidebar({
  children,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  children?: React.ReactNode;
}) {
  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        {children}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
