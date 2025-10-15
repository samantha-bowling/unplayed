
import React from 'react';
import MainLayout from './MainLayout';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin layout wrapper
 * 
 * NOTE: This component provides UI structure only.
 * Authorization is enforced at the route level via ProtectedRoute with RPC verification.
 * This separation ensures clean boundaries: routes enforce policy, layouts provide presentation.
 */
const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  // Development-only diagnostic: warn if rendered without admin context
  if (process.env.NODE_ENV === 'development') {
    // ESM-safe lazy check to avoid bundling auth hook in production
    import('@/hooks/use-auth-permission').then(({ useAuthPermission }) => {
      const Component = () => {
        const { isAdmin } = useAuthPermission();
        if (!isAdmin) {
          console.warn('[AdminLayout] Rendered without admin context - check route protection');
        }
        return null;
      };
      // Render diagnostic component
      const container = document.createElement('div');
      import('react-dom/client').then(({ createRoot }) => {
        const root = createRoot(container);
        root.render(<Component />);
        setTimeout(() => root.unmount(), 0);
      });
    });
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {children}
      </div>
    </MainLayout>
  );
};

export default AdminLayout;
