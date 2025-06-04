
import React from 'react';
import DustScoreMeter from './DustScoreMeter';
import DustBreakdownChart from './DustBreakdownChart';
import DustGameCard from './DustGameCard';

const DustAnalysis = () => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <DustScoreMeter />
      <DustBreakdownChart />
      <div className="lg:col-span-2">
        <DustGameCard />
      </div>
    </div>
  );
};

export default DustAnalysis;
