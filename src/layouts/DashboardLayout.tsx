
import React from 'react';
import MainLayout from './MainLayout';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Dashboard layout
 * Extends MainLayout with dashboard-specific features
 * Will include sidebar navigation in the future
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* Dashboard-specific layout elements could be added here */}
        {children}
      </div>
    </MainLayout>
  );
};

export default DashboardLayout;
