import { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, TrendingDown, BarChart3, Info } from "lucide-react";
import { useEnhancedSpendingData } from "@/hooks/use-spending-data-enhanced";
import useTotalLibrarySpending from "@/hooks/use-total-library-spending";
import { DemoModeIndicator } from '@/components/DemoModeIndicator';
import CurrencyAmount from '@/components/ui/currency-amount';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Cell } from 'recharts';
import { getBestGameImage } from '@/utils/image-utils';
import { AspectRatio } from '@/components/ui/aspect-ratio';

const SpendPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const { data: unplayedSpendingData, isLoading: isUnplayedLoading, refreshPrices, isRefreshing } = useEnhancedSpendingData();
  const { data: totalLibraryData, isLoading: isTotalLibraryLoading } = useTotalLibrarySpending();

  const isLoading = isUnplayedLoading || isTotalLibraryLoading;

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

  // Handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder.svg';
  };

  // Create price distribution data for charts
  const priceDistribution = [
    { range: 'Free', count: unplayedSpendingData.freeGamesCount, totalValue: 0 },
    { range: '$0.01-$4.99', count: 0, totalValue: 0 },
    { range: '$5-$9.99', count: 0, totalValue: 0 },
    { range: '$10-$19.99', count: 0, totalValue: 0 },
    { range: '$20-$39.99', count: 0, totalValue: 0 },
    { range: '$40-$59.99', count: 0, totalValue: 0 },
    { range: '$60+', count: 0, totalValue: 0 }
  ];

  // Calculate distribution from top spending games
  unplayedSpendingData.topSpendingGames.forEach(game => {
    const price = game.price;
    if (price === 0) {
      priceDistribution[0].count++;
    } else if (price <= 4.99) {
      priceDistribution[1].count++;
      priceDistribution[1].totalValue += price;
    } else if (price <= 9.99) {
      priceDistribution[2].count++;
      priceDistribution[2].totalValue += price;
    } else if (price <= 19.99) {
      priceDistribution[3].count++;
      priceDistribution[3].totalValue += price;
    } else if (price <= 39.99) {
      priceDistribution[4].count++;
      priceDistribution[4].totalValue += price;
    } else if (price <= 59.99) {
      priceDistribution[5].count++;
      priceDistribution[5].totalValue += price;
    } else {
      priceDistribution[6].count++;
      priceDistribution[6].totalValue += price;
    }
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <DemoModeIndicator />

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
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-black/40 border border-unplayed-mint/20">
                  <TabsTrigger 
                    value="overview"
                    className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="topGames"
                    className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
                  >
                    Top Games
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
                          onClick={() => refreshPrices()} 
                          variant="outline"
                          size="sm"
                          disabled={isRefreshing}
                        >
                          <span className="mr-1">Refresh Prices</span>
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
                              <CurrencyAmount amount={totalLibraryData.totalLibraryValue} currency={totalLibraryData.currency} />
                            </span>
                            <span className="text-sm text-gray-400">
                              {totalLibraryData.totalGames} games total
                            </span>
                          </div>
                          
                          <div className="flex flex-col items-center p-6 bg-unplayed-red/10 border border-unplayed-red/20 rounded-lg">
                            <span className="text-xs uppercase text-gray-400 mb-2">Unplayed Games Value</span>
                            <span className="text-3xl font-bold mb-2 text-unplayed-red">
                              <CurrencyAmount amount={unplayedSpendingData.totalSpent} currency={unplayedSpendingData.currency} />
                            </span>
                            <span className="text-sm text-gray-400">
                              {unplayedSpendingData.paidGamesCount} unplayed paid games
                            </span>
                          </div>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="p-4 bg-black/20 rounded-lg">
                            <h3 className="text-sm uppercase text-gray-400 mb-1">Free Games</h3>
                            <p className="text-2xl font-bold text-unplayed-mint">
                              {unplayedSpendingData.freeGamesCount}
                            </p>
                          </div>
                          
                          {totalLibraryData.totalSaved && totalLibraryData.totalSaved > 0 && (
                            <div className="p-4 bg-black/20 rounded-lg">
                              <h3 className="text-sm uppercase text-gray-400 mb-1">Money Saved From Sales</h3>
                              <p className="text-2xl font-bold text-unplayed-mint">
                                <CurrencyAmount amount={totalLibraryData.totalSaved} currency={totalLibraryData.currency} />
                              </p>
                            </div>
                          )}
                          
                          <div className="p-4 bg-black/20 rounded-lg">
                            <h3 className="text-sm uppercase text-gray-400 mb-1">Average Price Per Game</h3>
                            <p className="text-2xl font-bold">
                              <CurrencyAmount 
                                amount={totalLibraryData.totalGames > 0 ? 
                                  totalLibraryData.totalLibraryValue / totalLibraryData.totalGames : 
                                  0
                                } 
                                currency={totalLibraryData.currency} 
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
                              unplayedSpendingData.confidence === 'high' ? 'bg-green-500' :
                              unplayedSpendingData.confidence === 'medium' ? 'bg-yellow-500' :
                              'bg-red-500'
                            }`} />
                            <span className="text-sm text-gray-300">
                              {unplayedSpendingData.confidence.charAt(0).toUpperCase() + unplayedSpendingData.confidence.slice(1)} Confidence
                            </span>
                          </div>
                          
                          <div className="text-sm text-gray-400">
                            <span className="text-white">{unplayedSpendingData.dataQuality.gamesWithPriceData}</span> games with price data
                          </div>
                          
                          <div className="text-sm text-gray-400">
                            <span className="text-white">{unplayedSpendingData.dataQuality.gamesWithMissingData}</span> games missing data
                          </div>
                        </div>
                        
                        <div className="text-sm text-gray-400 space-y-2">
                          <p>
                            <strong>Pricing Data:</strong> {unplayedSpendingData.displayInfo.displayText}
                          </p>
                          {unplayedSpendingData.displayInfo.warningText && (
                            <p className="text-yellow-400">
                              <strong>Note:</strong> {unplayedSpendingData.displayInfo.warningText}
                            </p>
                          )}
                          <p>
                            <strong>Last Updated:</strong> {formatRefreshDate(unplayedSpendingData.refreshedAt)}
                          </p>
                          <p className="text-xs">
                            Prices are current Steam store prices and may differ from what you actually paid due to sales, bundles, or regional pricing.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="topGames" className="space-y-6">
                  <Card className="terminal-container">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-unplayed-amber" />
                        Top Unplayed Investments
                      </CardTitle>
                      <CardDescription>
                        Your most valuable unplayed games by current store price
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead className="uppercase text-xs text-gray-400 border-b border-gray-800">
                            <tr>
                              <th className="px-4 py-3">Game</th>
                              <th className="px-4 py-3 text-right">Current Price</th>
                              <th className="px-4 py-3 hidden md:table-cell text-right">Original Price</th>
                              <th className="px-4 py-3 hidden md:table-cell text-right">Discount</th>
                              <th className="px-4 py-3 hidden lg:table-cell text-center">Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {unplayedSpendingData.topSpendingGames.slice(0, 20).map((game) => (
                              <tr key={game.id} className="border-b border-gray-800 hover:bg-gray-900/20">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="w-16 h-9 flex-shrink-0">
                                      <AspectRatio ratio={16 / 9}>
                                        <img 
                                          src={getBestGameImage(null, game.imageUrl, game.id)} 
                                          alt={game.title}
                                          className="w-full h-full object-cover rounded shadow-sm"
                                          onError={handleImageError}
                                        />
                                      </AspectRatio>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <span 
                                        className="font-medium text-white block"
                                        title={game.title}
                                        style={{
                                          overflow: 'hidden',
                                          textOverflow: 'ellipsis',
                                          whiteSpace: 'nowrap',
                                          maxWidth: '250px'
                                        }}
                                      >
                                        {game.title}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <span className={`font-mono ${game.price >= 20 ? 'text-unplayed-red' : game.price >= 10 ? 'text-unplayed-amber' : 'text-unplayed-mint'}`}>
                                    <CurrencyAmount amount={game.price} currency={game.currency} />
                                  </span>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell text-right text-gray-400">
                                  {game.originalPrice ? (
                                    <CurrencyAmount amount={game.originalPrice} currency={game.currency} />
                                  ) : '—'}
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell text-right">
                                  {game.discount ? (
                                    <span className="text-unplayed-mint">-{game.discount}%</span>
                                  ) : '—'}
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell text-center">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge variant="outline" className="text-xs">
                                          Current
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Current Steam store price</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {unplayedSpendingData.topSpendingGames.length === 0 && (
                          <div className="text-center py-12 text-gray-400">
                            <p>No unplayed games found in your library.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="insights" className="space-y-6">
                  <Card className="terminal-container">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-unplayed-pink" />
                        Price Distribution
                      </CardTitle>
                      <CardDescription>
                        Breakdown of unplayed games by price range
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {priceDistribution.some(range => range.count > 0) ? (
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={priceDistribution}>
                              <XAxis dataKey="range" tick={{ fill: '#9ca3af' }} />
                              <YAxis tick={{ fill: '#9ca3af' }} />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: '#1e1e1e', 
                                  borderColor: '#374151',
                                  borderRadius: '0.5rem' 
                                }}
                                formatter={(value: number, name: string) => {
                                  if (name === 'count') return [value, 'Games'];
                                  if (name === 'totalValue') return [`$${value.toFixed(2)}`, 'Total Value'];
                                  return [value, name];
                                }}
                                labelFormatter={(label) => `Price Range: ${label}`}
                              />
                              <Bar 
                                name="count"
                                dataKey="count" 
                                fill="#22c55e" 
                                radius={[4, 4, 0, 0]}
                              >
                                {priceDistribution.map((entry, index) => (
                                  <Cell 
                                    key={`cell-${index}`} 
                                    fill={
                                      entry.range === 'Free' ? '#6b7280' :
                                      entry.range === '$0.01-$4.99' ? '#10b981' :
                                      entry.range === '$5-$9.99' ? '#22c55e' :
                                      entry.range === '$10-$19.99' ? '#eab308' :
                                      entry.range === '$20-$39.99' ? '#f97316' :
                                      entry.range === '$40-$59.99' ? '#ef4444' :
                                      '#dc2626'
                                    }
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-400">
                          <p>Not enough price data available to generate a chart.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
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
