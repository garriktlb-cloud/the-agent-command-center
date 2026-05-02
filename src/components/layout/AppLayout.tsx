import { Outlet, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "./AppSidebar";
import { VoiceCaptureButton } from "@/components/orders/VoiceCaptureButton";

export default function AppLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="flex min-h-screen">
      <AppSidebar />
      <main className="flex-1 ml-[220px] transition-all duration-200">
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <Outlet />
        </div>
      </main>
      <VoiceCaptureButton />
    </div>
  );
}
