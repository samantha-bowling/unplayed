
import React from 'react';
import DustScoreMeter from './DustScoreMeter';
import DustTierDistribution from '@/components/dust/DustTierDistribution';
import TopDustContributors from '@/components/dust/TopDustContributors';

const DustAnalysis = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DustScoreMeter />
      <DustTierDistribution />
      <div className="lg:col-span-2">
        <TopDustContributors />
      </div>
    </div>
  );
};

export default DustAnalysis;
