import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { 
  Link as LinkIcon, 
  FileText, 
  Search, 
  Menu, 
  X,
  Merge
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: "URL Resolver",
    href: "/",
    icon: LinkIcon,
    description: "Resolve shortened and redirected URLs"
  },
  {
    name: "File Merger",
    href: "/file-merger",
    icon: Merge,
    description: "Merge multiple TXT files into one unique set"
  },
  {
    name: "Duplicate Checker",
    href: "/duplicate-checker",
    icon: Search,
    description: "Find and remove duplicate URLs from files"
  }
];

export default function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 shadow-sm lg:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className="bg-primary rounded-lg p-2">
              <FileText className="text-primary-foreground text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">URL Tools</h1>
              <p className="text-slate-600 text-sm">Multi-tool URL utilities</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* Logo - Hidden on mobile, shown on desktop */}
            <div className="hidden lg:flex items-center space-x-3 px-6 py-6 border-b border-slate-200">
              <div className="bg-primary rounded-lg p-2">
                <FileText className="text-primary-foreground text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">URL Tools</h1>
                <p className="text-slate-600 text-sm">Multi-tool utilities</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 space-y-2">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Card className={cn(
                      "p-4 cursor-pointer transition-all duration-200 hover:shadow-md",
                      isActive 
                        ? "bg-primary/5 border-primary/20 shadow-sm" 
                        : "hover:bg-slate-50 border-slate-200"
                    )}>
                      <div className="flex items-start space-x-3">
                        <div className={cn(
                          "p-2 rounded-lg",
                          isActive 
                            ? "bg-primary/10 text-primary" 
                            : "bg-slate-100 text-slate-600"
                        )}>
                          <item.icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={cn(
                            "font-medium text-sm",
                            isActive ? "text-primary" : "text-slate-900"
                          )}>
                            {item.name}
                          </h3>
                          <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </nav>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200">
              <p className="text-slate-500 text-xs">
                Built for efficient URL management and file processing
              </p>
            </div>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-1 lg:ml-0">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}