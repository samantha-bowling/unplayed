
import { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, TrendingDown, BarChart3, Info, Trophy } from "lucide-react";
import { useUnifiedSpendingDataV2 } from '@/hooks/useUnifiedSpendingDataV2';
import { useTopExpensiveUnplayedGames } from '@/hooks/useTopExpensiveUnplayedGames';
import CurrencyAmount from '@/components/ui/currency-amount';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const SpendPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const { data: spendingData, isLoading, refreshSpendingData } = useUnifiedSpendingDataV2();
  const { data: topExpensiveGames, isLoading: topGamesLoading } = useTopExpensiveUnplayedGames();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Format the date for better display
  const formatRefreshDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      await refreshSpendingData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold font-space text-unplayed-mint mb-2">
              Your Spending Report
            </h1>
            <p className="text-lg text-gray-300">
              A sobering look at your gaming investments.
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 text-unplayed-mint animate-spin" />
              <span className="ml-2 text-lg text-gray-300">Calculating your financial damage...</span>
            </div>
          ) : !user ? (
            <div className="terminal-container p-8 text-center">
              <DollarSign className="w-16 h-16 mx-auto text-unplayed-mint mb-4" />
              <h2 className="text-2xl font-bold text-white mb-2">Connect Your Account</h2>
              <p className="text-gray-400 mb-6">
                Sign in with Steam to see your personalized spending report.
              </p>
            </div>
          ) : (
            <>
              <Tabs 
                defaultValue="overview" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="space-y-6"
              >
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
                  <Card className="terminal-container">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-unplayed-mint" />
                            Spending Summary
                          </CardTitle>
                          <CardDescription>
                            Your Steam library spending breakdown
                          </CardDescription>
                        </div>
                        <Button 
                          onClick={handleRefresh} 
                          variant="outline"
                          size="sm"
                          disabled={isRefreshing}
                        >
                          <span className="mr-1">{isRefreshing ? 'Recalculating...' : 'Refresh Data'}</span>
                          <TrendingDown size={16} className={isRefreshing ? 'animate-pulse' : ''} />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div className="flex flex-col items-center p-8 bg-black/20 rounded-lg">
                            <span className="text-xs uppercase text-gray-400 mb-2">Total Library Value</span>
                            <span className="text-4xl font-bold mb-2">
                              <CurrencyAmount amount={spendingData.totalLibraryValue} currency={spendingData.currency} />
                            </span>
                            <span className="text-sm text-gray-400">
                              {spendingData.totalGames} games total
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-center p-6 bg-unplayed-red/10 border border-unplayed-red/20 rounded-lg">
                            <span className="text-xs uppercase text-gray-400 mb-2">Unplayed Games Value</span>
                            <span className="text-3xl font-bold mb-2 text-unplayed-red">
                              <CurrencyAmount amount={spendingData.unplayedSpent} currency={spendingData.currency} />
                            </span>
                            <span className="text-sm text-gray-400">
                              {spendingData.unplayedGames} unplayed games
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="p-4 bg-black/20 rounded-lg">
                            <h3 className="text-sm uppercase text-gray-400 mb-1">Free Games</h3>
                            <p className="text-2xl font-bold text-unplayed-mint">
                              {spendingData.freeGames}
                            </p>
                          </div>
                          
                          {spendingData.totalLibrarySaved && spendingData.totalLibrarySaved > 0 && (
                            <div className="p-4 bg-black/20 rounded-lg">
                              <h3 className="text-sm uppercase text-gray-400 mb-1">Money Saved From Sales</h3>
                              <p className="text-2xl font-bold text-unplayed-mint">
                                <CurrencyAmount amount={spendingData.totalLibrarySaved} currency={spendingData.currency} />
                              </p>
                            </div>
                          )}
                          
                          <div className="p-4 bg-black/20 rounded-lg">
                            <h3 className="text-sm uppercase text-gray-400 mb-1">Average Price Per Game</h3>
                            <p className="text-2xl font-bold">
                              <CurrencyAmount 
                                amount={spendingData.totalGames > 0 ? 
                                  spendingData.totalLibraryValue / spendingData.totalGames : 
                                  0
                                } 
                                currency={spendingData.currency} 
                              />
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Data Quality Information */}
                      <div className="border-t border-gray-800 pt-6">
                        <div className="flex items-center gap-2 mb-4">
                          <Info className="h-4 w-4 text-unplayed-mint" />
                          <h3 className="text-lg font-semibold text-white">Data Quality & Methodology</h3>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${
                              spendingData.confidence === 'high' ? 'bg-green-500' :
                              spendingData.confidence === 'medium' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                            <span className="text-sm text-gray-300">
                              {spendingData.confidence.charAt(0).toUpperCase() + spendingData.confidence.slice(1)} Confidence
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-400">
                            <span className="text-white">{spendingData.gamesWithPriceData}</span> games with price data
                          </div>
                          
                          <div className="text-sm text-gray-400">
                            <span className="text-white">{spendingData.gamesMissingPriceData}</span> games missing data
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-400 space-y-2">
                          <p>
                            <strong>Data Quality:</strong> {spendingData.dataQualityPercentage.toFixed(1)}% of games have current price data
                          </p>
                          <p>
                            <strong>Last Updated:</strong> {formatRefreshDate(spendingData.lastCalculated)}
                          </p>
                          <p className="text-xs">
                            Prices are current Steam store prices and may differ from what you actually paid due to sales, bundles, or regional pricing.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="insights" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="terminal-container">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart3 className="h-5 w-5 text-unplayed-pink" />
                          Spending Insights
                        </CardTitle>
                        <CardDescription>
                          Analysis of your gaming spending patterns
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-6">
                          <div className="p-6 bg-black/20 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Unplayed vs Played</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span>Unplayed Games:</span>
                                <span className="text-unplayed-red">{spendingData.unplayedGames}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Played Games:</span>
                                <span className="text-unplayed-mint">{spendingData.totalGames - spendingData.unplayedGames}</span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span>Unplayed Percentage:</span>
                                <span className="text-unplayed-amber">
                                  {spendingData.totalGames > 0 ? 
                                    Math.round((spendingData.unplayedGames / spendingData.totalGames) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-6 bg-black/20 rounded-lg">
                            <h3 className="text-lg font-semibold mb-4">Game Types</h3>
                            <div className="space-y-3">
                              <div className="flex justify-between">
                                <span>Free Games:</span>
                                <span className="text-unplayed-mint">{spendingData.freeGames}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Paid Games:</span>
                                <span className="text-unplayed-amber">{spendingData.paidGames}</span>
                              </div>
                              <div className="flex justify-between font-semibold">
                                <span>Free Percentage:</span>
                                <span className="text-unplayed-mint">
                                  {spendingData.totalGames > 0 ? 
                                    Math.round((spendingData.freeGames / spendingData.totalGames) * 100) : 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="terminal-container">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-unplayed-red" />
                          Top 3 Most Expensive Unplayed
                        </CardTitle>
                        <CardDescription>
                          Your priciest unplayed games
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {topGamesLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-unplayed-mint animate-spin" />
                            <span className="ml-2 text-sm text-gray-400">Loading...</span>
                          </div>
                        ) : topExpensiveGames.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No expensive unplayed games found</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {topExpensiveGames.map((game, index) => (
                              <div key={game.id} className="flex items-center space-x-4 p-4 bg-black/20 rounded-lg">
                                <div className="flex-shrink-0 w-8 h-8 bg-unplayed-red/20 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-bold text-unplayed-red">#{index + 1}</span>
                                </div>
                                {game.headerImage && (
                                  <img 
                                    src={game.headerImage} 
                                    alt={game.name}
                                    className="w-16 h-9 object-cover rounded"
                                  />
                                )}
                                <div className="flex-grow min-w-0">
                                  <h4 className="font-semibold text-white truncate">{game.name}</h4>
                                  <p className="text-sm text-unplayed-red font-bold">
                                    <CurrencyAmount amount={game.price} currency={game.currency} />
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default SpendPage;
