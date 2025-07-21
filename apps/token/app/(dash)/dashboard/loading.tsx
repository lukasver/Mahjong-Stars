import { BottomSectionsLoading } from '@/components/skeletons/bottom-sections-loading';
import { FundraisingProgressLoading } from '@/components/skeletons/fundraising-progress-loading';
import { LargeCardsLoading } from '@/components/skeletons/large-cards-loading';
import { MetricCardsLoading } from '@/components/skeletons/metric-cards-loading';

function Loading() {
  return (
    <div className='flex-1 p-8 space-y-8'>
      <FundraisingProgressLoading />
      <MetricCardsLoading />
      <LargeCardsLoading />
      <BottomSectionsLoading />
    </div>
  );
}

export default Loading;
