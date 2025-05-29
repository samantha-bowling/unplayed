
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { Navigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { AdminLayout } from '@/layouts';
import BatchProcessingControls from '@/components/admin/BatchProcessingControls';
import QueueStatsCard from '@/components/admin/QueueStatsCard';
import SmartPrioritizationCard from '@/components/admin/SmartPrioritizationCard';
import MetadataConsistencyCard from '@/components/admin/MetadataConsistencyCard';
import { useAuthPermission } from '@/hooks/use-auth-permission';

const QueueManagerPage: React.FC = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useAuthPermission();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <AdminLayout>
      <div className="min-h-screen flex flex-col">
        <Header />
        
        <main className="flex-grow px-4 py-8 header-spacing">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Queue Manager</h1>
              <p className="text-gray-600">
                Manage the Steam app processing queue and data consistency
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <QueueStatsCard 
                stats={{
                  pending: 0,
                  processing: 0,
                  completed: 0,
                  failed: 0
                }}
                onRefresh={() => {}}
              />
              <MetadataConsistencyCard />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <SmartPrioritizationCard />
              <BatchProcessingControls 
                batchSize={50}
                onBatchSizeChange={() => {}}
              />
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    </AdminLayout>
  );
};

export default QueueManagerPage;
