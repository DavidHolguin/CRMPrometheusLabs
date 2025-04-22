import React from "react";
import { Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { MarketingNavigationMenu } from "@/components/marketing/MarketingNavigationMenu";
import { UserProfileMenu } from "@/components/dashboard/UserProfileMenu";

export function HeaderNavigation() {
  return (
    <div className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <div className="flex-1 flex items-center gap-2">
        <form className="max-w-sm lg:max-w-lg w-full">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar..."
              className="w-full appearance-none bg-background pl-8 shadow-none md:w-2/3 lg:w-full"
            />
          </div>
        </form>
      </div>
      <div className="flex items-center gap-4">
        <MarketingNavigationMenu />
        <Separator orientation="vertical" className="h-8" />
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs">
            3
          </Badge>
        </Button>
        <UserProfileMenu />
      </div>
    </div>
  );
}