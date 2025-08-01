import { KycStatusSchema } from '@/common/schemas/generated';
import { Prisma, PrismaClient } from '@prisma/client';

export async function seedUsers(
  _users: Array<Prisma.UserCreateInput>,
  prisma: PrismaClient
) {
  return prisma.user
    .createManyAndReturn({
      skipDuplicates: true,
      data: _users.map((user) => ({
        ...user,
        walletAddress: user.walletAddress,
        isSiwe: true,
      })),
    })
    .then(async (users) => {
      await prisma.kycVerification.createMany({
        data: users.map((user) => ({
          userId: user.id,
          status: KycStatusSchema.enum.NOT_STARTED,
        })),
      });
      return users;
    });
}
