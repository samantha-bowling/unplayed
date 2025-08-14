import { lazy, Suspense } from 'react';
import LoadingFallback from '@/components/LoadingFallback';

const PriceDistributionChart = lazy(() => import('@/components/PriceDistributionChart'));

const LazyPriceDistributionChart = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading chart..." />}>
    <PriceDistributionChart {...props} />
  </Suspense>
);

export default LazyPriceDistributionChart;