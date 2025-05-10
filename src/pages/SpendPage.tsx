
import { useState } from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, DollarSign, TrendingDown, BarChart3 } from "lucide-react";
import useSpendingData from "@/hooks/use-spending-data";
import { DemoModeIndicator } from '@/components/DemoModeIndicator';
import CurrencyAmount from '@/components/ui/currency-amount';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';

const SpendPage = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuth();
  const { data, isLoading, refreshPrices, isRefreshing } = useSpendingData();

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
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-3">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="topGames">Top Games</TabsTrigger>
                  <TabsTrigger value="charts">Charts</TabsTrigger>
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
                            The total value of your unplayed games
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
                        <div className="flex flex-col items-center p-8 bg-black/20 rounded-lg">
                          <span className="text-xs uppercase text-gray-400 mb-2">Total Value</span>
                          <span className="text-5xl font-bold mb-4">
                            <CurrencyAmount amount={data.totalSpent} currency={data.currency} />
                          </span>
                          <span className="text-sm text-gray-400 mt-2">
                            Last updated: {formatRefreshDate(data.refreshedAt)}
                          </span>
                        </div>
                        
                        <div className="space-y-6">
                          <div className="p-4 bg-black/20 rounded-lg">
                            <h3 className="text-sm uppercase text-gray-400 mb-1">Unplayed Games</h3>
                            <p className="text-2xl font-bold">
                              {data.topSpendingGames.length}
                            </p>
                          </div>
                          
                          {data.totalSaved && data.totalSaved > 0 && (
                            <div className="p-4 bg-black/20 rounded-lg">
                              <h3 className="text-sm uppercase text-gray-400 mb-1">Money Saved From Sales</h3>
                              <p className="text-2xl font-bold text-unplayed-mint">
                                <CurrencyAmount amount={data.totalSaved} currency={data.currency} />
                              </p>
                            </div>
                          )}
                          
                          <div className="p-4 bg-black/20 rounded-lg">
                            <h3 className="text-sm uppercase text-gray-400 mb-1">Average Price Per Game</h3>
                            <p className="text-2xl font-bold">
                              <CurrencyAmount 
                                amount={data.topSpendingGames.length > 0 ? 
                                  data.totalSpent / data.topSpendingGames.length : 
                                  0
                                } 
                                currency={data.currency} 
                              />
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-400 border-t border-gray-800 pt-4">
                        <p className="mb-2">
                          <strong>Note:</strong> This is an estimated value based on current Steam store pricing, and does not reflect your actual transaction history.
                        </p>
                        <p>
                          Prices shown are the current store prices, which may differ from what you actually paid due to sales, bundles, or other discounts.
                        </p>
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
                        Your most valuable unplayed games by price
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
                            </tr>
                          </thead>
                          <tbody>
                            {data.topSpendingGames.slice(0, 20).map((game) => (
                              <tr key={game.id} className="border-b border-gray-800 hover:bg-gray-900/20">
                                <td className="px-4 py-3">
                                  <div className="flex items-center">
                                    {game.imageUrl && (
                                      <img 
                                        src={game.imageUrl} 
                                        alt={game.title}
                                        className="w-10 h-10 mr-3 rounded"
                                      />
                                    )}
                                    <span className="font-medium truncate max-w-[200px]">{game.title}</span>
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
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        
                        {data.topSpendingGames.length === 0 && (
                          <div className="text-center py-12 text-gray-400">
                            <p>No unplayed games found in your library.</p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="charts" className="space-y-6">
                  <Card className="terminal-container">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-unplayed-pink" />
                        Price Distribution
                      </CardTitle>
                      <CardDescription>
                        Number of games by price range
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {data.priceDistribution.some(range => range.count > 0) ? (
                        <div className="h-[350px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={data.priceDistribution}>
                              <XAxis dataKey="range" tick={{ fill: '#9ca3af' }} />
                              <YAxis tick={{ fill: '#9ca3af' }} />
                              <Tooltip 
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
                                {data.priceDistribution.map((entry, index) => (
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
