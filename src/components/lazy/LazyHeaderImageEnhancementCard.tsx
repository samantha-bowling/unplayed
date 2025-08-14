import { lazy, Suspense } from 'react';
import LoadingFallback from '@/components/LoadingFallback';

const HeaderImageEnhancementCard = lazy(() => import('@/components/admin/HeaderImageEnhancementCard'));

const LazyHeaderImageEnhancementCard = (props: any) => (
  <Suspense fallback={<LoadingFallback message="Loading enhancement tools..." />}>
    <HeaderImageEnhancementCard {...props} />
  </Suspense>
);

export default LazyHeaderImageEnhancementCard;