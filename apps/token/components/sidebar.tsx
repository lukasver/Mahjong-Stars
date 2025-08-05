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
import ErrorBoundary from '@mjs/ui/components/error-boundary';

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
      title: 'More info',
      url: '#',
      icon: Globe,
      items: [
        {
          title: 'Tokenomics',
          url: `/docs/${process.env.NEXT_PUBLIC_TOKENOMICS_SLUG}`,
        },
        {
          title: 'Schedule',
          url: `/docs/${process.env.NEXT_PUBLIC_SCHEDULE_SLUG}`,
        },
        {
          title: 'Whitepaper',
          url: process.env.NEXT_PUBLIC_WHITEPAPER_SLUG || '',
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
        <ErrorBoundary fallback={null}>
          <TeamSwitcher teams={data.teams} />
        </ErrorBoundary>
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
