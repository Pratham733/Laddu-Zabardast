// //src/components/layout/sidebar.tsx
// import { useAuth } from "@/context/auth-context";
// import Link from "next/link";



// export default function Sidebar() {
//     // Get the token and the isUserAdmin function from the authentication context.
//     const { token, isUserAdmin } = useAuth();

//     return (
//         <>
            
//             {token && isUserAdmin() && (
//                 <Link href="/admin">Admin Dashboard</Link>
//             )}
//         </>
//     )
// }

"use client";

import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export default function Sidebar() {
  const { token, isUserAdmin } = useAuth();

  return (
    <SidebarMenu>
      {/* ✅ Other sidebar items can go here */}

      {/* ✅ Conditionally show Admin Dashboard only if logged in and is admin */}
      {token && isUserAdmin() && (
        <SidebarMenuItem>
          <SidebarMenuButton>
            <Link href="/admin">Admin Dashboard</Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )}
    </SidebarMenu>
  );
}
