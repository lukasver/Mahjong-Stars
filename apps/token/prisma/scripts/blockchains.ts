import { ALLOWED_CHAINS } from '@/services/crypto/config';
import { invariant } from '@epic-web/invariant';
import { PrismaClient } from '@prisma/client';
import { createThirdwebClient } from 'thirdweb';

const secretKey = process.env.THIRDWEB_API_SECRET;
invariant(secretKey, 'THIRDWEB_API_SECRET is not set');

// secretKey for serverside usage, wont be available in client
export const client = createThirdwebClient({
  secretKey,
  teamId: process.env.THIRDWEB_TEAM_ID,
});

export async function seedBlockchains(prisma: PrismaClient) {
  await prisma.blockchain.createManyAndReturn({
    data: ALLOWED_CHAINS.map((c) => ({
      name: c.name || '',
      chainId: c.id,
      rpcUrl: c.rpc,
      explorerUrl: c.blockExplorers?.[0]?.url,
      isTestnet: c.testnet || c.name?.toLowerCase()?.includes('testnet'),
      isEnabled: true,
    })),
    skipDuplicates: true,
  });

  const nativeTokens = ALLOWED_CHAINS.map(({ nativeCurrency, id }) => ({
    symbol: nativeCurrency?.symbol,
    decimals: nativeCurrency?.decimals,
    chainId: id,
    name: nativeCurrency?.name,
  })).filter(Boolean);

  await Promise.all([
    ...nativeTokens.map((t) =>
      prisma.token.create({
        data: {
          symbol: t.symbol!,
          TokensOnBlockchains: {
            create: {
              blockchain: {
                connect: {
                  chainId: t.chainId,
                },
              },
              name: t.name!,
              decimals: t.decimals!,
              isNative: true,
            },
          },
        },
      })
    ),
    // Testnet tokens
    prisma.token.create({
      data: {
        symbol: 'tMJS',
        totalSupply: '888888888',
        image:
          'https://d391b93f5f62d9c15f67142e43841acc.ipfscdn.io/ipfs/QmZegnyup388YaXGfRfCZotLguFZyEZXjhDsn2N5pvx7to/Star%20Point.png',
        TokensOnBlockchains: {
          create: {
            chainId: 97,
            name: 'MJS BNB Testnet',
            decimals: 18,
            contractAddress: '0x8699210141B710c46eC211cDD39D2C2edDA7A63c',
          },
        },
      },
    }),
  ]);
}
