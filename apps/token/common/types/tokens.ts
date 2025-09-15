import { Prisma } from "@prisma/client";

const tokenWithRelations = Prisma.validator<Prisma.TokenDefaultArgs>()({
	select: {
		symbol: true,
		image: true,
		id: true,
		TokensOnBlockchains: {
			select: {
				chainId: true,
				contractAddress: true,
				name: true,
				decimals: true,
				isNative: true,
			},
		},
	},
});

type TokenPayload = Prisma.TokenGetPayload<typeof tokenWithRelations>;
export type TokenWithRelations = Omit<TokenPayload, "TokensOnBlockchains"> &
	TokenPayload["TokensOnBlockchains"][number];
