import { LayoutDashboard, LogOut } from 'lucide-react';
import type { MouseEventHandler, ReactNode } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { authClient } from '@/lib/auth-client';

type Props = {
  username: string;
  email: string;
};

function AdminSidebar({ username, email }: Props) {
  const handleSignOut: MouseEventHandler<HTMLButtonElement> = async (e) => {
    e.preventDefault();
    await authClient.signOut();
    window.location.href = '/login';
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarTrigger className="self-end" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <a href="/admin">
                  <LayoutDashboard />
                  <span>Агляд</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <div className="flex items-center gap-2 overflow-hidden">
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="bg-primary text-primary-foreground rounded-lg">
                  {username
                    .split(' ')
                    .slice(0, 2)
                    .map((name) => name[0])
                    .join('')}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{username}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="hover:text-destructive"
                title="Выйсці"
                onClick={handleSignOut}
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

type WrapperProps = Props & { children: ReactNode };

function AdminSidebarWrapper({ username, email, children }: WrapperProps) {
  return (
    <SidebarProvider>
      <AdminSidebar username={username} email={email} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}

export default AdminSidebarWrapper;
