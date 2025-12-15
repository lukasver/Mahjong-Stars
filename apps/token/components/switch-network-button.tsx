import { Button } from "@mjs/ui/primitives/button";
import { Chain, defineChain } from "thirdweb";
import { base, polygon } from "thirdweb/chains";
import { useNetworkSwitcherModal } from "thirdweb/react";
import { client } from "@/lib/auth/thirdweb-client";
import { useBlockchains } from "@/lib/services/api";

interface SwitchNetworkButtonProps
  extends Omit<React.ComponentProps<typeof Button>, "onClick"> {
  onSwitch?: (chain: Chain) => void;
  className?: string;
}
const SwitchNetworkButton = (props: SwitchNetworkButtonProps) => {
  const networkSwitcher = useNetworkSwitcherModal();
  const { data: c, isLoading } = useBlockchains();
  const { onSwitch, ...rest } = props;
  const chains = c?.chains.filter((chain) => chain.isEnabled);
  const handleSwitchNetwork = () => {
    networkSwitcher.open({
      client,
      theme: "light",
      onSwitch,
      sections: [
        // { label: "Recently used", chains: [bsc, base] },
        {
          label: "Popular",
          chains: chains?.map((chain) => defineChain(chain.chainId)) || [
            polygon,
            base,
          ],
        },
      ],
    });
  };

  return (
    <Button
      loading={isLoading}
      className={props.className}
      onClick={handleSwitchNetwork}
      {...rest}
    >
      Switch Network
    </Button>
  );
};

SwitchNetworkButton.displayName = "SwitchNetworkButton";

export { SwitchNetworkButton };
