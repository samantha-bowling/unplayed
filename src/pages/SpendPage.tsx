import React from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SpendingMeter from "@/components/spend/SpendingMeter";
import UnplayedCounter from "@/components/spend/UnplayedCounter";
import SpendingEstimate from "@/components/spend/SpendingEstimate";
import PriceDistributionChart from "@/components/spend/PriceDistributionChart";
import { useSpendingData } from '@/hooks/use-spending-data';
import { Skeleton } from "@/components/ui/skeleton";

const SpendPage = () => {
  const { user } = useAuth();
  const { data: spendingData, isLoading } = useSpendingData();

  const expensiveUnplayedGames = spendingData?.expensiveUnplayedGames || [];

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-space text-unplayed-mint mb-2">
              Your Spending Report™
            </h1>
            <p className="text-lg text-gray-300">
              A breakdown of your gaming expenses and unplayed value.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Skeleton className="w-64 h-8 bg-gray-700" />
            </div>
          ) : !user ? (
            <div className="terminal-container p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Account</h2>
              <p className="text-gray-400 mb-6">
                Sign in with Steam to see your personalized spending report.
              </p>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-black/40 border border-unplayed-mint/20">
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
              
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40">
                      <CardHeader>
                        <CardTitle className="text-unplayed-mint">
                          Library Value Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <SpendingMeter 
                          totalSpent={spendingData?.totalSpent || 0}
                          unplayedValue={spendingData?.unplayedValue || 0}
                          currency={spendingData?.currency || 'USD'}
                        />
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="space-y-6">
                    <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40 hover:shadow-[0_0_30px_rgba(163,247,191,0.25)] transition-all duration-300">
                      <CardContent className="p-6">
                        <UnplayedCounter 
                          unplayedGames={spendingData?.unplayedGames || 0}
                          totalGames={spendingData?.totalGames || 0}
                        />
                      </CardContent>
                    </Card>
                    
                    <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40 hover:shadow-[0_0_30px_rgba(163,247,191,0.25)] transition-all duration-300">
                      <CardContent className="p-6">
                        <SpendingEstimate 
                          avgMonthlySpending={spendingData?.avgMonthlySpending || 0}
                          projectedYearlySpending={spendingData?.projectedYearlySpending || 0}
                          currency={spendingData?.currency || 'USD'}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40">
                  <CardHeader>
                    <CardTitle className="text-unplayed-mint">
                      Price Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PriceDistributionChart />
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="insights" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40 hover:shadow-[0_0_30px_rgba(163,247,191,0.25)] transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-unplayed-mint">
                        Most Expensive Unplayed Games
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {expensiveUnplayedGames.length > 0 ? (
                        <div className="space-y-3">
                          {expensiveUnplayedGames.slice(0, 5).map((game, index) => (
                            <div 
                              key={game.id}
                              className="flex items-center justify-between p-3 bg-black/30 rounded-lg border border-gray-700/50 hover:border-unplayed-mint/30 transition-all duration-300"
                            >
                              <div className="flex items-center space-x-3">
                                <span className="text-unplayed-mint font-bold">
                                  #{index + 1}
                                </span>
                                <div>
                                  <p className="font-medium text-gray-300">{game.name}</p>
                                  <p className="text-sm text-gray-400">
                                    ${(game.price / 100).toFixed(2)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400">No expensive unplayed games found</p>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card className="terminal-container border border-unplayed-mint/20 shadow-[0_0_20px_rgba(163,247,191,0.15)] bg-black/40 hover:shadow-[0_0_30px_rgba(163,247,191,0.25)] transition-all duration-300">
                    <CardHeader>
                      <CardTitle className="text-unplayed-mint">
                        Spending Insights
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-3 bg-black/30 rounded-lg">
                          <div className="text-lg font-bold text-green-400">
                            {spendingData?.completionRate || 0}%
                          </div>
                          <div className="text-sm text-gray-400">
                            Library completion rate
                          </div>
                        </div>
                        
                        <div className="p-3 bg-black/30 rounded-lg">
                          <div className="text-lg font-bold text-orange-400">
                            ${((spendingData?.unplayedValue || 0) / 100).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-400">
                            Value in unplayed games
                          </div>
                        </div>
                        
                        <div className="p-3 bg-black/30 rounded-lg">
                          <div className="text-lg font-bold text-blue-400">
                            ${((spendingData?.avgGamePrice || 0) / 100).toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-400">
                            Average game price
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
