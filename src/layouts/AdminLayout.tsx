
import React from 'react';
import MainLayout from './MainLayout';
import { useAuthPermission } from '@/hooks/use-auth-permission';
import { Navigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: React.ReactNode;
  requiredRole?: string;
}

/**
 * Admin layout with role-based access control
 * Extends MainLayout with admin-specific features
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  requiredRole = 'admin' 
}) => {
  const { isAdmin, hasRole } = useAuthPermission();
  
  // Verify admin access before rendering
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Admin-specific layout elements could be added here */}
        {children}
      </div>
    </MainLayout>
  );
};

export default AdminLayout;
