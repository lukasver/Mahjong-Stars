import 'server-only';
import { ONE_MINUTE, ROLES } from '@/common/config/constants';
import { Prisma } from '@prisma/client';
import { Cacheable } from 'cacheable';
import { prisma } from '../db/prisma';

const UserWithRoles = Prisma.validator<Prisma.UserDefaultArgs>()({
  select: {
    id: true,
    walletAddress: true,
    email: true,
  },
});
export type UserWithRoles = Prisma.UserGetPayload<typeof UserWithRoles> & {
  roles: Record<keyof typeof ROLES, string>;
};

const cacheTTL = ONE_MINUTE * 2;

export const authCache = new Cacheable({
  namespace: 'auth::action:',
  // 2 minutes
  ttl: cacheTTL,
});

export const adminCache = new Cacheable({
  namespace: 'admin::action:',
  // 2 minutes
  ttl: cacheTTL,
});

export const agreementCache = new Cacheable({
  namespace: 'agreement::action:',
  // 2 minutes
  ttl: '1d',
});

/**
 * Gets/Sets user from Database into cache
 */
export const getUserFromCache = async (address: string) => {
  let user: UserWithRoles | undefined = await authCache.get(address);

  if (!user) {
    const _user =
      (await prisma.user.findUnique({
        where: {
          walletAddress: address,
        },
        select: {
          id: true,
          walletAddress: true,
          email: true,
          userRole: {
            select: {
              role: {
                select: {
                  name: true,
                  id: true,
                },
              },
            },
          },
        },
      })) || undefined;
    if (!_user) {
      throw new Error('User not found');
    }
    const { userRole, ...rest } = _user;
    const roles = userRole.reduce(
      (acc, role) => {
        acc[role.role.name as keyof typeof ROLES] = role.role.id;
        return acc;
      },
      {} as Record<keyof typeof ROLES, string>
    );
    user = { ...rest, roles };
    await authCache.set(address, user);
  }
  return user;
};
