
import { usePriceDistribution } from '@/hooks/usePriceDistribution';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

const chartConfig = {
  count: {
    label: "Games",
    color: "#A3F7BF",
  },
};

const PriceDistributionChart = () => {
  const { data, isLoading } = usePriceDistribution();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 text-unplayed-mint animate-spin" />
        <span className="ml-2 text-sm text-gray-400">Loading distribution...</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400">
        <p>No price distribution data available</p>
      </div>
    );
  }

  return (
    <ChartContainer config={chartConfig} className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <XAxis 
            dataKey="priceRange" 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
          />
          <YAxis 
            tick={{ fill: '#9CA3AF', fontSize: 12 }}
            axisLine={{ stroke: '#374151' }}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />}
            cursor={{ fill: 'rgba(163, 247, 191, 0.1)' }}
          />
          <Bar 
            dataKey="count" 
            fill="#A3F7BF"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
};

export default PriceDistributionChart;
