
import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Zap } from "lucide-react";
import DustScoreMeter from "@/components/DustScoreMeter";
import CleanScoreMeter from "@/components/CleanScoreMeter";
import DustScoreBreakdown from "@/components/dust/DustScoreBreakdown";
import CleanScoreBreakdown from "@/components/dust/CleanScoreBreakdown";
import TopDustContributors from "@/components/dust/TopDustContributors";
import DustTierDistribution from "@/components/dust/DustTierDistribution";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useDustScoreData } from '@/hooks/use-dust-score-data';

const DustPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: dustData, isLoading } = useDustScoreData();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-space text-unplayed-mint mb-2">
              Dust Analysis
            </h1>
            <p className="text-lg text-gray-300">
              Analyze your gaming patterns and see where the dust is settling.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-unplayed-mint animate-spin" />
              <span className="ml-2 text-lg text-gray-300">Loading dust analysis...</span>
            </div>
          ) : !user ? (
            <div className="terminal-container p-8 text-center">
              <Zap className="w-16 h-16 mx-auto text-unplayed-mint mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Account</h2>
              <p className="text-gray-400 mb-6">
                Sign in with Steam to see your personalized dust analysis.
              </p>
              <Button onClick={() => navigate("/")}>
                Return to Home
              </Button>
            </div>
          ) : (
            <Tabs 
              defaultValue="overview" 
              value={activeTab} 
              onValueChange={setActiveTab}
              className="space-y-6"
            >
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-black/40 border border-gray-700">
                <TabsTrigger 
                  value="overview"
                  className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="analysis"
                  className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
                >
                  Analysis
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-6">
                {/* Two column layout for meters */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="terminal-container">
                    <DustScoreMeter />
                  </div>
                  <div className="terminal-container">
                    <CleanScoreMeter />
                  </div>
                </div>
                
                {/* Full width breakdown components */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <DustScoreBreakdown />
                  <CleanScoreBreakdown />
                </div>
              </TabsContent>
              
              <TabsContent value="analysis" className="space-y-6">
                {/* Dust tier distribution - full width */}
                <DustTierDistribution />
                
                {/* Top contributors - full width */}
                <TopDustContributors />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default DustPage;
