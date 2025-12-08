import { LogOut, User } from 'lucide-react';
import type { MouseEventHandler } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { authClient } from '@/lib/auth-client';

type Props = {
  username: string;
  email: string;
};

function AdminHeader({ username, email }: Props) {
  const handleSignOut: MouseEventHandler<HTMLDivElement> = async (e) => {
    e.preventDefault();
    await authClient.signOut();
    window.location.href = '/login';
  };

  const initials = username
    .split(' ')
    .slice(0, 2)
    .map((name) => name[0])
    .join('');

  return (
    <header className="bg-background/95 supports-backdrop-filter:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <a href="/admin" className="text-foreground hover:text-foreground/80 font-semibold tracking-wide">
          PLACES ADMIN
        </a>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col space-y-0.5">
                  <p className="text-sm font-medium">{username}</p>
                  <p className="text-muted-foreground text-xs">{email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Галоўная сайта
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              Выйсці
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default AdminHeader;
