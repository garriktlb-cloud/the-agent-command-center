import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Home,
  FileText,
  Handshake,
  ShoppingCart,
  Users,
  CheckSquare,
  Contact,
  Megaphone,
  GraduationCap,
  BarChart3,
  Briefcase,
  CreditCard,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

const coreNav: NavItem[] = [
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Listings", path: "/listings", icon: Home },
  { label: "Transactions", path: "/transactions", icon: Handshake },
  { label: "Orders", path: "/orders", icon: ShoppingCart },
];

const executionNav: NavItem[] = [
  { label: "Vendors", path: "/vendors", icon: Users },
  { label: "Tasks", path: "/tasks", icon: CheckSquare },
  { label: "Contacts", path: "/contacts", icon: Contact },
];

const growthNav: NavItem[] = [
  { label: "Marketing", path: "/marketing", icon: Megaphone },
  { label: "Coaching", path: "/coaching", icon: GraduationCap },
  { label: "Performance", path: "/performance", icon: BarChart3 },
  { label: "Business Tracker", path: "/business-tracker", icon: Briefcase },
];

const financialNav: NavItem[] = [
  { label: "Billing", path: "/billing", icon: CreditCard },
];

const accountNav: NavItem[] = [
  { label: "Profile", path: "/profile", icon: User },
  { label: "Settings", path: "/settings", icon: Settings },
];

function SidebarSection({
  title,
  items,
  collapsed,
}: {
  title: string;
  items: NavItem[];
  collapsed: boolean;
}) {
  const location = useLocation();

  return (
    <div className="mb-4">
      {!collapsed && (
        <p className="px-4 mb-1.5 text-[10px] font-medium uppercase tracking-widest text-sidebar-muted">
          {title}
        </p>
      )}
      <nav className="flex flex-col gap-0.5 px-2">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {item.label === "Orders" && !collapsed && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-sidebar-primary text-[10px] font-bold text-sidebar-primary-foreground">
                  3
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 flex h-screen flex-col bg-sidebar border-r border-sidebar-border transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-sidebar-border">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary font-heading text-sm font-bold text-sidebar-primary-foreground">
          LB
        </div>
        {!collapsed && (
          <span className="font-heading text-base font-semibold text-sidebar-foreground tracking-tight">
            The List Bar
          </span>
        )}
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin">
        <SidebarSection title="Core" items={coreNav} collapsed={collapsed} />
        <SidebarSection title="Execution" items={executionNav} collapsed={collapsed} />
        <SidebarSection title="Growth" items={growthNav} collapsed={collapsed} />
        <SidebarSection title="Financial" items={financialNav} collapsed={collapsed} />
        <SidebarSection title="Account" items={accountNav} collapsed={collapsed} />
      </div>

      {/* User info & sign out */}
      <div className="border-t border-sidebar-border px-3 py-3">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground uppercase">
              {displayName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-[10px] text-sidebar-muted truncate">{displayEmail}</p>
            </div>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-1.5 rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={signOut}
            title="Sign out"
            className="flex w-full items-center justify-center p-1.5 rounded-md text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center border-t border-sidebar-border py-3 text-sidebar-muted hover:text-sidebar-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
