import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";

// Layout & Components
import { AdminLayout } from "@/components/admin/layout/AdminLayout";
import { Overview } from "@/components/admin/layout/Overview";
import { InstructorsTable } from "@/components/admin/instructors/InstructorsTable";
import { SalesHistory } from "@/components/admin/financial/SalesHistory";
import { SecurityLogsPanel } from "@/components/admin/SecurityLogsPanel";
import { SecurityAnalyticsDashboard } from "@/components/admin/SecurityAnalyticsDashboard";
import { AdminMetricsDashboard } from "@/components/admin/AdminMetricsDashboard";

// Modals
import { InstructorDetailsModal } from "@/components/admin/InstructorDetailsModal";
import { SuspendModal } from "@/components/admin/SuspendModal";
import { Loader2 } from "lucide-react";

// Modules
import { ReviewsTable } from "@/components/admin/reviews/ReviewsTable";
import { SupportTickets } from "@/components/admin/support/SupportTickets";
import { StudentsTable } from "@/components/admin/students/StudentsTable";
import { PlatformSettings } from "@/components/admin/settings/PlatformSettings";

import { VerificationQueue } from "@/components/admin/verification/VerificationQueue";
import { BroadcastCenter } from "@/components/admin/broadcast/BroadcastCenter";
import { BookingTimeline } from "@/components/admin/bookings/BookingTimeline";

// Types
type Instructor = Database["public"]["Tables"]["instructors"]["Row"];
type AdminActionLog = Database["public"]["Tables"]["admin_action_logs"]["Row"];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State
  const [activeSection, setActiveSection] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("");
  
  // Data State
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [students, setStudents] = useState<any[]>([]); // Using any for profile temporarily to match Table props
  const [totalLessons, setTotalLessons] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);

  // Modal State
  const [selectedInstructor, setSelectedInstructor] = useState<Instructor | null>(null);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  
  // Listen for sidebar navigation events
  useEffect(() => {
    const handleNav = (e: CustomEvent) => setActiveSection(e.detail);
    window.addEventListener('admin-nav', handleNav as EventListener);
    return () => window.removeEventListener('admin-nav', handleNav as EventListener);
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate('/admin/login'); return; }

      // Check Admin Role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleData) { navigate('/'); return; }

      setAdminName(user.user_metadata?.full_name || 'Administrador');

      // Fetch Instructors
      const { data: instData } = await supabase.from('instructors').select('*').order('created_at', { ascending: false });
      setInstructors(instData || []);

      // Fetch all profiles (students are users who have profiles but are not instructors)
      const { data: stdData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      setStudents(stdData || []);

      // Fetch Lessons/Financial Data for Charts (Mock/Real mix)
      const { data: lessonsData } = await supabase.from('lessons').select('created_at, price');
      
      if (lessonsData) {
        setTotalLessons(lessonsData.length);
        const revenue = lessonsData.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
        setTotalRevenue(revenue);
        
        // Simple Chart Data Build
        const last7Days = Array.from({length: 7}, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        const data = last7Days.map(date => ({
            name: new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
            aulas: lessonsData.filter((l: { created_at: string }) => l.created_at.startsWith(date)).length
        }));
        setChartData(data);
      }

    } catch (error) {
      console.error(error);
      toast({ title: "Erro", description: "Falha ao carregar dados.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [navigate, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Actions
  const handleAction = async (action: 'approve' | 'reject' | 'suspend', instructor: Instructor, reason?: string) => {
    try {
       const updates: any = {};
       if (action === 'approve') updates.status = 'approved';
       if (action === 'reject' || action === 'suspend') updates.status = 'suspended';

       const { error } = await supabase.from('instructors').update(updates).eq('id', instructor.id);
       if (error) throw error;

        // Log
       const { data: { user } } = await supabase.auth.getUser();
       await supabase.from('admin_action_logs').insert({
          action,
          admin_user_id: user?.id,
          target_instructor_id: instructor.id,
          new_status: updates.status,
          previous_status: instructor.status,
          notes: reason
       });

       toast({ title: "Sucesso", description: `Instrutor ${action === 'approve' ? 'aprovado' : 'suspenso/rejeitado'}.` });
       fetchData(); // Refresh list
       setSelectedInstructor(null);
       setShowSuspendDialog(false);

    } catch (err) {
       console.error(err);
       toast({ title: "Erro", description: "Não foi possível realizar a ação.", variant: "destructive" });
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <AdminLayout activeSection={activeSection} onLogout={async () => { await supabase.auth.signOut(); navigate('/admin/login'); }}>
      <Helmet>
        <title>Painel Admin - {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)}</title>
      </Helmet>

      {activeSection === "overview" && (
        <Overview 
           stats={{
             totalInstructors: instructors.length,
             activeStudents: students.length,
             totalLessons,
             totalRevenue
           }}
           chartData={chartData}
         />
      )}
      
      {activeSection === "metrics" && <AdminMetricsDashboard />}
      
      {activeSection === "verification" && <VerificationQueue />}

      {activeSection === "instructors" && (
        <InstructorsTable 
           instructors={instructors} 
           onOpenAction={(action, inst) => {
              setSelectedInstructor(inst);
              if (action === 'suspend') setShowSuspendDialog(true);
              else handleAction(action, inst);
           }}
           onViewDetails={(inst) => setSelectedInstructor(inst)} 
           onRefresh={fetchData}
        />
      )}

      {activeSection === "students" && <StudentsTable students={students} />}
      
      {activeSection === "reviews" && <ReviewsTable />}
      
      {activeSection === "financial" && <SalesHistory />}
      
      {activeSection === "broadcast" && <BroadcastCenter />}
      
      {activeSection === "security" && (
        <div className="space-y-6">
           <SecurityAnalyticsDashboard />
           <SecurityLogsPanel />
        </div>
      )}
      
      {activeSection === "support" && <SupportTickets />}
      
      {activeSection === "settings" && <PlatformSettings />}
      

      
      {activeSection === "bookings" && <BookingTimeline />}

      {/* Modals Reuse */}
      <SuspendModal 
        instructor={selectedInstructor}
        open={showSuspendDialog}
        onClose={() => setShowSuspendDialog(false)}
        onConfirm={(reason) => selectedInstructor && handleAction('suspend', selectedInstructor, reason)}
      />

      {selectedInstructor && !showSuspendDialog && (
         <InstructorDetailsModal 
            instructor={selectedInstructor}
            open={!!selectedInstructor}
            onClose={() => setSelectedInstructor(null)}
            onApprove={() => handleAction('approve', selectedInstructor!)}
            onReject={(i, r) => handleAction('reject', i, r)}
            onSuspend={() => setShowSuspendDialog(true)}
         />
      )}

    </AdminLayout>
  );
}
