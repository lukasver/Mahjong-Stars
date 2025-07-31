import 'server-only';
import { ONE_MINUTE } from '@/common/config/constants';
import { User } from '@prisma/client';
import { Cacheable } from 'cacheable';
import { prisma } from '../db/prisma';

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

/**
 * Gets/Sets user from Database into cache
 */
export const getUserFromCache = async (address: string) => {
  let user: Pick<User, 'id' | 'walletAddress' | 'email'> | undefined =
    await authCache.get(address);

  if (!user) {
    user =
      (await prisma.user.findUnique({
        where: {
          walletAddress: address,
        },
        select: {
          id: true,
          walletAddress: true,
          email: true,
        },
      })) || undefined;
    if (!user) {
      throw new Error('User not found');
    }
    await authCache.set(address, user);
  }
  return user;
};
