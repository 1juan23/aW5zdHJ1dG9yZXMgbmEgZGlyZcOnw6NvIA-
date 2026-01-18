import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  onLogout: () => void;
}

export function AdminLayout({ children, activeSection, onLogout }: AdminLayoutProps) {
  // We attach a listener in the main dashboard to update activeSection
  // but for visual feedback, we might want to pass it to Sidebar.
  
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex transition-colors duration-300">
      <AdminSidebar onLogout={onLogout} />
      
      <div className="flex-1 pl-64 transition-all duration-300">
         {/* Top Header Mobile could go here */}
         <main className="p-8 max-w-7xl mx-auto animate-fade-in">
            {children}
         </main>
      </div>
    </div>
  );
}
