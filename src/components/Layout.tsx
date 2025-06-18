
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
        // Check if user has the required permission
        return user?.permissions?.[item.permission] === true;
      }
      return true;
    });
  };

  const allNavigationItems = getFilteredNavigationItems();

  const SidebarContent = () => (
    <div className="flex h-full flex-col bg-gradient-to-b from-blue-600 to-blue-800 border-r shadow-lg">
      <div className="flex h-16 items-center border-b border-blue-500 px-6">
        <h2 className="text-xl font-bold text-white">Logistics Hub</h2>
      </div>
      <nav className="flex-1 space-y-2 p-4">
        {allNavigationItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center space-x-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                location.pathname === item.href
                  ? "bg-white text-blue-800 shadow-md"
                  : "text-blue-100 hover:bg-blue-700 hover:text-white"
              )}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-blue-500 p-4">
        <div className="text-xs text-blue-200 mb-1">
          {user?.firstName} {user?.lastName}
        </div>
        <div className="text-xs text-blue-300 mb-4">
          {user?.email} • {user?.role}
        </div>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-blue-100 hover:bg-blue-700 hover:text-white"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 lg:block">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
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
