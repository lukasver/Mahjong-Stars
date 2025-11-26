import { Button } from "@mjs/ui/primitives/button";
import { Chain, defineChain } from "thirdweb";
import { base, bsc } from "thirdweb/chains";
import { useNetworkSwitcherModal } from "thirdweb/react";
import { client } from "@/lib/auth/thirdweb-client";
import { ALLOWED_CHAINS } from "@/lib/services/crypto/config";

interface SwitchNetworkButtonProps extends Omit<React.ComponentProps<typeof Button>, 'onClick'> {
  onSwitch?: (chain: Chain) => void;
  className?: string;
}
const SwitchNetworkButton = (props: SwitchNetworkButtonProps) => {
  const networkSwitcher = useNetworkSwitcherModal();
  const { onSwitch, ...rest } = props;

  const handleSwitchNetwork = () => {

    networkSwitcher.open({
      client,
      theme: "light",
      onSwitch,
      sections: [
        { label: "Recently used", chains: [bsc, base] },
        {
          label: "Popular",
          chains: ALLOWED_CHAINS.map((chain) => defineChain(chain.id)),
        },
      ],
    });
  };

  return <Button
    className={props.className}
    onClick={handleSwitchNetwork}
    {...rest}
  >Switch Network</Button>;
};

SwitchNetworkButton.displayName = "SwitchNetworkButton";

export { SwitchNetworkButton };
