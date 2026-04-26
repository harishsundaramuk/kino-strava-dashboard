import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useStrava } from "@/hooks/useStrava";
import KinoDashboard from "@/components/KinoDashboard";

/**
 * DashboardPage
 *
 * Route guard + data orchestration layer.
 * The actual UI lives in <KinoDashboard> to keep this page thin.
 */
export default function DashboardPage() {
  const navigate        = useNavigate();
  const { isLoggedIn, loading: authLoading } = useAuth();
  const { activities, stats, streams, loading, error, refetch } = useStrava();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isLoggedIn) {
      navigate("/", { replace: true });
    }
  }, [authLoading, isLoggedIn, navigate]);

  if (authLoading) return null; // Let AuthProvider resolve first

  return (
    <KinoDashboard
      activities={activities}
      stats={stats}
      streams={streams}
      loading={loading}
      error={error}
      onRefetch={refetch}
    />
  );
}
