import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageLoader } from '@/components/ui/Spinner';
import { homeForRole, useAuth } from '@/lib/auth';
import type { Role } from '@/lib/types';

export function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper">
        <PageLoader label="Verificando tu sesión…" />
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-paper">
        <PageLoader label="Verificando tu sesión…" />
      </div>
    );
  }
  if (user) return <Navigate to={homeForRole(user.role)} replace />;
  return <Outlet />;
}
