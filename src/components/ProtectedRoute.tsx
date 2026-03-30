import { Navigate, Outlet } from 'react-router-dom';

interface Props {
  isAuthenticated: boolean;
}

export default function ProtectedRoute({ isAuthenticated }: Props) {
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" />;
}