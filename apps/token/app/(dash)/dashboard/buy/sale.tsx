'use client';
import { useActiveSale } from '@/lib/services/api';
// import { EditImage, FieldDescription } from './components';
import { OverviewProject } from '../../../../components/buy/overview';
import { Coins } from 'lucide-react';
import { ProjectInformation } from './information';
import { SaleCoverImage } from './cover-image';
import { Invest } from './invest';
import { SaleWithToken } from '@/common/types/sales';
import { invariant } from '@epic-web/invariant';

export const TokenSale = () => {
  const { data: sale } = useActiveSale();

  console.debug('🚀 ~ sale.tsx:15 ~ sale:', sale);

  // invariant(!error, 'Sale not found');
  invariant(sale, 'Sale not found');

  return (
    <div className='h-full w-full px-4 py-8'>
      <Header sale={sale} />
      <div className='grid grid-cols-1 lg:grid-cols-[1fr_375px] gap-4 '>
        <section id='information'>
          <ProjectInformation sale={sale}>
            <div id='hero'>
              <SaleCoverImage
                src={sale?.banner?.url}
                className='overflow-hidden rounded-t-lg shadow'
              />
            </div>
          </ProjectInformation>
        </section>
        <section id='overview'>
          <OverviewFormInvest sale={sale} />
        </section>
      </div>
    </div>
  );
};

const OverviewFormInvest = ({ sale }: { sale: SaleWithToken }) => {
  return (
    <div className='flex flex-col gap-4'>
      <OverviewProject sale={sale} />
      {/* TODO ADD invest-form.tsx component */}
      <Invest sale={sale} />
    </div>
  );
};

const Header = ({ sale }: { sale: SaleWithToken }) => {
  const description =
    sale?.catchPhrase ||
    'Join our exclusive presale and be part of the future of decentralized finance';
  return (
    <div className='text-center mb-8'>
      <div className='flex items-center justify-center gap-2 mb-4'>
        <Coins className='h-8 w-8 text-accent' />
        <h1 className='text-4xl font-bold text-white'>{sale.name}</h1>
      </div>
      <p className='text-xl text-gray-300 max-w-2xl mx-auto'>{description}</p>
    </div>
  );
};
