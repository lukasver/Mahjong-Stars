"use client";
import { useEffect, useState } from "react";
import { defineChain, getContract, NATIVE_TOKEN_ADDRESS, prepareContractCall, PreparedTransaction, prepareTransaction, PrepareTransactionOptions, resolveMethod, toUnits } from "thirdweb";
import { client } from "@/lib/auth/thirdweb-client";
import { NETWORK_TO_TOKEN_MAPPING } from '@/lib/services/crypto/config';
import { transfer } from 'thirdweb/extensions/erc20';
import useActiveAccount from '@/components/hooks/use-active-account';


type UsePrepareTransactionProps = {
  /**
   * Token contract address
   */
  address: string;

  /**
   * Amount to send
   */
  value: string;
  /**
   * Recipient address
   */
  to: string;
  /**
   * Token decimals
   */
  decimals?: number;
};

export const usePrepareTransaction = ({ address, value, to, decimals: _decimals }: UsePrepareTransactionProps) => {
  const { activeAccount: account, chainId } = useActiveAccount();
  const [tx, setTx] = useState<PreparedTransaction<[], any, PrepareTransactionOptions> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (address && chainId && value && to) {

      function prepareTx() {
        if (!chainId) {
          throw new Error('Chain ID not found');
        }
        const chain = defineChain(chainId);
        let decimals: number | undefined = _decimals;
        if (!decimals) {
          decimals = Object.values(NETWORK_TO_TOKEN_MAPPING[chain.id]!).find((t) => t.contract === address)?.decimals;
          if (!decimals) {
            throw new Error('Token decimals not found');
          }
        }
        const formattedAmount = toUnits(value, decimals);

        if (address === NATIVE_TOKEN_ADDRESS || address.toLowerCase() === NATIVE_TOKEN_ADDRESS) {
          const _tx = prepareTransaction({
            chain: chain,
            client,
            value: formattedAmount,
            to,
          });
          setTx(_tx);
          return;
        }

        const contract = getContract({
          client: client,
          chain,
          address,
        });

        // ERC-20
        if (decimals === 18) {
          const _tx = transfer({
            contract,
            amount: value,
            to,
          });
          setTx(_tx);
          return;
          // ERC-20 with different decimals (USDC or BTC for example)
        } else {
          if (!account?.address) {
            throw new Error('Account address not found');
          }
          const _tx = prepareContractCall({
            contract,
            method: resolveMethod("transfer"),
            params: [
              account.address,
              to,
              formattedAmount,
            ],
          });
          setTx(_tx);
          return;
        }
      }

      try {
        prepareTx()
      } catch (e) {
        setError(e instanceof Error ? e.message : "An error occurred while preparing the transaction");
      }
    }

  }, []);

  if (error) {
    throw new Error(error);
  }
  return tx;
};
