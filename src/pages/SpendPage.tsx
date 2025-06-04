
import React, { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign } from "lucide-react";
import SpendingMeter from "@/components/SpendingMeter";
import PriceDistributionChart from "@/components/PriceDistributionChart";
import TopExpensiveUnplayedGames from "@/components/TopExpensiveUnplayedGames";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useUnifiedSpendingDataV2 } from '@/hooks/useUnifiedSpendingDataV2';

const SpendPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: spendingData, isLoading } = useUnifiedSpendingDataV2();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-space text-unplayed-mint mb-2">
              Spending Analysis
            </h1>
            <p className="text-lg text-gray-300">
              Deep dive into your Steam spending patterns and unplayed game value.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-unplayed-mint animate-spin" />
              <span className="ml-2 text-lg text-gray-300">Loading spending data...</span>
            </div>
          ) : !user ? (
            <div className="terminal-container p-8 text-center">
              <DollarSign className="w-16 h-16 mx-auto text-unplayed-mint mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Account</h2>
              <p className="text-gray-400 mb-6">
                Sign in with Steam to see your personalized spending analysis.
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
                  value="insights"
                  className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
                >
                  Insights
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="max-w-2xl mx-auto">
                  <SpendingMeter
                    amount={spendingData.unplayedSpent}
                    currency={spendingData.currency}
                    isLoading={isLoading}
                    showDetailsLink={false}
                    totalSaved={spendingData.unplayedSaved}
                    hasUser={!!user}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="insights" className="space-y-6">
                {/* Two column layout for spending insights and top games */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="terminal-container">
                    <SpendingMeter
                      amount={spendingData.unplayedSpent}
                      currency={spendingData.currency}
                      isLoading={isLoading}
                      showDetailsLink={false}
                      totalSaved={spendingData.unplayedSaved}
                      hasUser={!!user}
                    />
                  </div>
                  
                  <TopExpensiveUnplayedGames />
                </div>
                
                {/* Full width price distribution chart */}
                <div className="terminal-container">
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-unplayed-mint mb-2">
                      Price Distribution
                    </h3>
                    <p className="text-sm text-gray-400">
                      How your games are distributed across price ranges
                    </p>
                  </div>
                  <PriceDistributionChart />
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SpendPage;
