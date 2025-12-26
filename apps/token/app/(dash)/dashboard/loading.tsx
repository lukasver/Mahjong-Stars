import { BottomSectionsLoading } from '@/components/skeletons/bottom-sections-loading';
import { FundraisingProgressLoading } from '@/components/skeletons/fundraising-progress-loading';
import { LargeCardsLoading } from '@/components/skeletons/large-cards-loading';
import { MetricCardsLoading } from '@/components/skeletons/metric-cards-loading';

function Loading() {
  return (
    <div className='flex-1 p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 md:space-y-8'>
      <FundraisingProgressLoading />
      <MetricCardsLoading />
      <LargeCardsLoading />
      <BottomSectionsLoading />
    </div>
  );
}

export default Loading;
