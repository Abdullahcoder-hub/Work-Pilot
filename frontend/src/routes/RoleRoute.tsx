import { Navigate, Outlet } from 'react-router-dom';
import { Role } from '../types';
import { useAuth } from '../features/auth/AuthContext';

export function RoleRoute({ allow }: { allow: Role[] }) {
  const { hasRole } = useAuth();
  if (!hasRole(...allow)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <Outlet />;
}
