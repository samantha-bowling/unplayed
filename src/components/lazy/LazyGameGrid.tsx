import { lazy, Suspense } from 'react';
import LoadingFallback from '@/components/LoadingFallback';

const GameGrid = lazy(() => import('@/components/GameGrid'));

const LazyGameGrid = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading game grid..." />}>
    <GameGrid {...props} />
  </Suspense>
);

export default LazyGameGrid;