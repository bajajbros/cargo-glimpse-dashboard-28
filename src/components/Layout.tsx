
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FileText, LayoutDashboard, Menu, Plus, Users, LogOut, Building } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "Create Job",
    href: "/create-job",
    icon: Plus,
    requiredRole: "rms" as const,
    permission: "Create Job"
  },
  {
    title: "View Jobs",
    href: "/view-jobs",
    icon: FileText,
  },
  {
    title: "Manage Entities",
    href: "/manage-entities",
    icon: Building,
  },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
      navigate('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Filter navigation items based on user permissions
  const getFilteredNavigationItems = () => {
    const baseItems = [...navigationItems];
    
    // Add superadmin-only items
    if (user?.role === 'superadmin') {
      baseItems.push({
        title: "Manage Users",
        href: "/manage-users",
        icon: Users,
      });
    }

    // Filter items based on permissions
    return baseItems.filter(item => {
      if (item.requiredRole && item.permission) {
        // For superadmin, show all items regardless of permissions in database
        if (user?.role === 'superadmin') {
          return true;
        }
        // For other users, check if user has the required permission
        return user?.permissions?.[item.permission] === true;
      }
      return true;
    });
  };

  const allNavigationItems = getFilteredNavigationItems();

  const SidebarContent = () => (
    <div 
      className={cn(
        "flex h-full flex-col bg-gray-900 border-r border-gray-800 transition-all duration-300",
        sidebarHovered || sidebarOpen ? "w-64" : "w-16"
      )}
      onMouseEnter={() => setSidebarHovered(true)}
      onMouseLeave={() => setSidebarHovered(false)}
    >
      <div className="flex h-16 items-center border-b border-gray-800 px-4">
        <h2 className={cn(
          "text-xl font-bold text-white transition-all duration-300",
          sidebarHovered || sidebarOpen ? "opacity-100" : "opacity-0"
        )}>
          Logistics Hub
        </h2>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {allNavigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-gray-800 text-white shadow-sm"
                  : "text-gray-300 hover:bg-gray-800 hover:text-white"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className={cn(
                "transition-all duration-300",
                sidebarHovered || sidebarOpen ? "opacity-100" : "opacity-0 w-0"
              )}>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gray-800 p-4">
        <div className={cn(
          "transition-all duration-300",
          sidebarHovered || sidebarOpen ? "opacity-100" : "opacity-0"
        )}>
          <div className="text-xs text-gray-400 mb-1">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-xs text-gray-500 mb-4">
            {user?.email} • {user?.role}
          </div>
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className={cn(
            "text-gray-300 hover:bg-gray-800 hover:text-white transition-all duration-300",
            sidebarHovered || sidebarOpen ? "w-full justify-start" : "w-10 h-10 p-0 justify-center"
          )}
        >
          <LogOut className="h-4 w-4" />
          <span className={cn(
            "ml-2 transition-all duration-300",
            sidebarHovered || sidebarOpen ? "opacity-100" : "opacity-0 w-0"
          )}>
            Logout
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-gray-900">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b bg-white px-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>
            <h1 className="text-xl font-semibold text-gray-900">
              {allNavigationItems.find(item => item.href === location.pathname)?.title || "Dashboard"}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="text-xs text-gray-500 capitalize">{user?.role}</div>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}
