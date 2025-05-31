
import React from 'react';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import DatabaseSchemaFixer from '@/components/admin/DatabaseSchemaFixer';

const TestDustMigrationPage: React.FC = () => {
  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              Dust Score Migration Testing
            </h1>
            <p className="text-gray-400">
              Phase 2: Testing the enhanced 5-factor dust score system
            </p>
          </div>

          <DatabaseSchemaFixer />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TestDustMigrationPage;
