"use client";

import { Skeleton } from "@mjs/ui/primitives/skeleton";
import Image from "next/image";
import {
  TokenIcon as TokenIconThirdweb,
  TokenName as TokenNameThirdweb,
  TokenSymbol as TokenSymbolThirdweb,
} from "thirdweb/react";
import { TokenWithRelations } from "@/common/types/tokens";
import { useTokens } from "@/lib/services/api";

export function TokenIcon({
  symbol,
  chainId,
}: {
  symbol: string;
  chainId: number;
}) {
  const {
    data: tokens,
    isLoading,
    error,
  } = useTokens({
    symbol,
    chainId,
  });

  if (error) {
    return null;
  }
  if (isLoading) {
    return <Skeleton className="size-5 sm:size-6" />;
  }

  const token: TokenWithRelations | undefined = tokens?.tokens[0];

  return (
    <TokenIconThirdweb
      className="size-5 sm:size-6"
      fallbackComponent={
        isLoading ? (
          <Skeleton className="size-5 sm:size-6" />
        ) : (
          token?.image ? <Image src={token?.image} alt={token?.symbol || symbol} height={20} width={20} /> : <span className='hidden' />
        )
      }
      iconResolver={token?.image ? token?.image : undefined}
      loadingComponent={<Skeleton className="size-5 sm:size-6" />}
    />
  );
}

export function TokenSymbol({
  symbol,
  chainId,
}: {
  symbol: string;
  chainId: number;
}) {
  const {
    data: tokens,
    isLoading,
    error,
  } = useTokens({
    symbol,
    chainId,
  });

  if (error) {
    return null;
  }
  if (isLoading) {
    return <Skeleton className="size-5 sm:size-6" />;
  }
  const token: TokenWithRelations | undefined = tokens?.tokens[0];

  return (
    <TokenSymbolThirdweb
      fallbackComponent={
        isLoading ? (
          <Skeleton className="w-14 h-8" />
        ) : (
          <span>{token?.symbol || symbol}</span>
        )
      }
      loadingComponent={<Skeleton className="w-14 h-8" />}
    />
  );
}

export const TokenName = ({
  symbol,
  chainId,
}: {
  symbol: string;
  chainId: number;
}) => {
  const {
    data: tokens,
    isLoading,
    error,
  } = useTokens({
    symbol,
    chainId,
  });

  if (error) {
    return null;
  }
  if (isLoading) {
    return <Skeleton className="w-14 h-8" />;
  }

  const token: TokenWithRelations | undefined = tokens?.tokens[0];
  return <TokenNameThirdweb
    fallbackComponent={
      isLoading ? (
        <Skeleton className="w-14 h-8" />
      ) : (
        token?.name ? <span>{token?.name}</span> : <span className='hidden' />
      )
    }
    loadingComponent={<Skeleton className="w-14 h-8" />}
  />;
};
