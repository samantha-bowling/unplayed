
import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DustScoreMeter from "@/components/DustScoreMeter";
import DustAnalysis from "@/components/DustAnalysis";
import DustTierDistribution from "@/components/DustTierDistribution";
import DustContributors from "@/components/DustContributors";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DustPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-space text-unplayed-mint mb-2">
              Dust Score Analysis
            </h1>
            <p className="text-lg text-gray-300">
              Discover which games in your library are gathering the most dust and why.
            </p>
          </div>

          <Tabs defaultValue="analysis" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3 bg-black/40 border border-unplayed-mint/20">
              <TabsTrigger 
                value="analysis"
                className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
              >
                Analysis
              </TabsTrigger>
              <TabsTrigger 
                value="distribution"
                className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
              >
                Distribution
              </TabsTrigger>
              <TabsTrigger 
                value="contributors"
                className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
              >
                Top Contributors
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="analysis" className="space-y-4">
              <div className="w-full">
                <DustTierDistribution />
              </div>
              <DustAnalysis />
            </TabsContent>
            
            <TabsContent value="distribution" className="space-y-4">
              <DustScoreMeter />
              <DustTierDistribution />
            </TabsContent>
            
            <TabsContent value="contributors" className="space-y-4">
              <DustContributors />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DustPage;
