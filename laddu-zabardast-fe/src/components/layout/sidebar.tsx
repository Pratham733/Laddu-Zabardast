"use client";

import Link from "next/link";
import { useAuth } from "@/hooks";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export default function Sidebar() {
  const { user, isUserAdmin } = useAuth();

  return (
    <SidebarMenu>
      {user && isUserAdmin() && (
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Link href="/admin">Admin Dashboard</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
