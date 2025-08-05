'use client';

import { ChevronRight } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@mjs/ui/primitives/collapsible';
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from '@mjs/ui/primitives/sidebar';

import { Icon } from '@mjs/ui/components/icons';
import AppLink from '../link';

export function NavAdmin({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: string;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <>
      {items.map((item) => (
        <Collapsible
          key={item.title}
          asChild
          defaultOpen={item.isActive}
          className='group/collapsible'
        >
          <SidebarMenuItem>
            <CollapsibleTrigger asChild>
              <SidebarMenuButton tooltip={item.title}>
                <Icon icon={item.icon} />
                <span>{item.title}</span>
                <ChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarMenuSub>
                {item.items?.map((subItem) => (
                  <SidebarMenuSubItem key={subItem.title}>
                    <SidebarMenuSubButton asChild>
                      <AppLink href={subItem.url} prefetch={true}>
                        <span>{subItem.title}</span>
                      </AppLink>
                    </SidebarMenuSubButton>
                  </SidebarMenuSubItem>
                ))}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      ))}
    </>
  );
}
