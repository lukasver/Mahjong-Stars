"use client";
import { EnterAnimation, FadeAnimation } from "@mjs/ui/components/motion";
import { Coins } from "lucide-react";
import { SaleWithToken } from "@/common/types/sales";
import { BuyTokenButtonClient } from "@/components/buy-token-button/buy-token-button.client";
import { PulseLoader } from "@/components/pulse-loader";
import { useActiveSale } from "@/lib/services/api";
// import { EditImage, FieldDescription } from './components';
import { OverviewProject } from "../../../../components/buy/overview";
import { ComingSoon } from "../../../../components/coming-soon";
import { Invest } from "../../../../components/invest";
import { SaleCoverImage } from "./cover-image";
import { ProjectInformation } from "./information";

export const TokenSale = () => {
  const { data: sale, isLoading, status } = useActiveSale();

  if (!sale && status === "error") {
    throw new Error("Sale not found");
  }

  if (isLoading) {
    return <PulseLoader />;
  }

  if (!sale) {
    return <ComingSoon />;
  }

  return (
    <div className="h-full w-full px-4 py-8">
      <FadeAnimation delay={0.1}>
        <Header sale={sale} />
      </FadeAnimation>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_375px] gap-4 ">
        <EnterAnimation delay={0.2}>
          <section id="information">
            <ProjectInformation sale={sale}>
              <>
                <div id="hero">
                  <SaleCoverImage
                    src={sale?.banner?.url}
                    className="overflow-hidden rounded-t-lg shadow"
                  />
                </div>
              </>
            </ProjectInformation>
          </section>
        </EnterAnimation>
        <EnterAnimation delay={0.4}>
          <section id="overview">
            <OverviewFormInvest sale={sale} />
          </section>
        </EnterAnimation>
      </div>
    </div>
  );
};

const OverviewFormInvest = ({ sale }: { sale: SaleWithToken }) => {
  return (
    <div className="flex flex-col gap-4" data-testid="overview-section">
      <div className="sm:hidden">
        <BuyTokenButtonClient symbol={sale.tokenSymbol}
          className='w-full'
        />
      </div>
      <FadeAnimation delay={0.1}>
        <OverviewProject sale={sale} />
      </FadeAnimation>
      <FadeAnimation delay={0.2}>
        <Invest sale={sale} />
      </FadeAnimation>
    </div>
  );
};

const Header = ({ sale }: { sale: SaleWithToken }) => {
  const description =
    sale?.catchPhrase ||
    "Join our exclusive presale and be part of the future of decentralized finance";
  return (
    <div className="text-center mb-8" data-testid="sale-header">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Coins className="h-8 w-8 text-accent" />
        <h1 className="text-4xl font-bold text-white">{sale.name}</h1>
      </div>
      <p className="text-xl text-gray-300 max-w-2xl mx-auto">{description}</p>
    </div>
  );
};
