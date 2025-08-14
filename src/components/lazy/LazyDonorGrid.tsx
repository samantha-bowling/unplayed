import { lazy, Suspense } from 'react';
import LoadingFallback from '@/components/LoadingFallback';

const DonorGrid = lazy(() => import('@/components/DonorGrid'));

const LazyDonorGrid = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading donors..." />}>
    <DonorGrid {...props} />
  </Suspense>
);

export default LazyDonorGrid;