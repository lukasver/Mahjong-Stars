import { JWT_EXPIRATION_TIME, ONE_DAY, ROLES } from '@/common/config/constants';
import { publicUrl } from '@/common/config/env';
import { ActionCtx } from '@/common/schemas/dtos/sales';
import { CreateUserDto, GetUserDto } from '@/common/schemas/dtos/users';
import { Failure, Success } from '@/common/schemas/dtos/utils';
import { Profile, UserUpdateInputSchema } from '@/common/schemas/generated';
import { prisma } from '@/db';
import { getIpAddress, getUserAgent } from '@/lib/geo';
import logger from '@/services/logger.server';
import { invariant } from '@epic-web/invariant';
import { DateTime } from 'luxon';
import { headers } from 'next/headers';

class UsersController {
  async getMe({ address }: GetUserDto) {
    try {
      const user = await prisma.user.findUnique({
        where: {
          walletAddress: address,
        },
        select: {
          id: true,
          email: true,
          name: true,
          externalId: true,
          walletAddress: true,
          emailVerified: true,
          isSiwe: true,
          image: true,
          profile: {
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              address: true,
            },
          },
          userRole: {
            select: {
              role: true,
            },
          },
          // sessions: {
          //   select: {},
          // },
        },
      });
      invariant(user, 'User not found');
      const { userRole, ...rest } = user;
      const roles = userRole.reduce((acc, role) => {
        acc[role.role.name as keyof typeof ROLES] = role.role.id;
        return acc;
      }, {} as Record<keyof typeof ROLES, string>);
      return Success({ ...rest, roles });
    } catch (error) {
      logger(error);
      return Failure(error);
    }
  }

  async createSession(
    address: string,
    { jwt, expirationTime }: { jwt: string; expirationTime: number }
  ) {
    const h = await headers();

    const expiresAt = DateTime.now()
      .plus({
        seconds: expirationTime || JWT_EXPIRATION_TIME,
      })
      .toJSDate();

    const session = await prisma.session.create({
      data: {
        token: jwt,
        expiresAt,
        ipAddress: getIpAddress(new Headers(h)),
        userAgent: getUserAgent(new Headers(h)),
        user: {
          connect: {
            walletAddress: address,
          },
        },
      },
    });
    return session;
  }

  async createUser(payload: CreateUserDto) {
    try {
      invariant(payload, 'User data missing');
      //todo: promoCode implementation
      const {
        address,
        promoCode,
        session: { jwt, expirationTime } = {},
        chainId,
        ..._data
      } = payload;

      if (promoCode) {
        // checkAndAssignRole({ code: promoCode, user: payload });
      }

      const h = new Headers(await headers());

      const email = `temp_${address}@${new URL(publicUrl).hostname}`;
      const ipAddress = getIpAddress(h);
      const userAgent = getUserAgent(h);

      const expiresAt = DateTime.now()
        .plus({
          seconds: expirationTime || JWT_EXPIRATION_TIME,
        })
        .toJSDate();

      const user = await prisma.user.upsert({
        where: {
          walletAddress: address,
        },
        update: {
          ...(jwt && {
            sessions: {
              connectOrCreate: {
                where: {
                  token: jwt,
                },
                create: {
                  token: jwt,
                  expiresAt,
                  ipAddress,
                  userAgent,
                },
              },
            },
          }),
        },
        create: {
          externalId: address,
          walletAddress: address,
          email,
          emailVerified: false,
          name: 'Anonymous',
          isSiwe: true,
          profile: {
            create: {},
          },
          ...(jwt && {
            sessions: {
              create: {
                token: jwt,
                expiresAt: new Date(expirationTime || Date.now() + ONE_DAY),
                ipAddress,
                userAgent,
              },
            },
          }),
          ...(chainId
            ? {
                WalletAddress: {
                  connectOrCreate: {
                    where: {
                      walletAddress_chainId: {
                        chainId: chainId,
                        walletAddress: address,
                      },
                    },
                    create: {
                      chainId: chainId,
                    },
                  },
                },
              }
            : {}),
          //TODO!
          // userRole: {
          //   connect: {

          //   }
          // }
        },
      });

      invariant(user, 'User could not be created');

      return Success({
        user,
      });
    } catch (error) {
      logger(error);
      return Failure(error);
    }
  }

  /**
   * Update user and profile information.
   * @param dto - The update data for user and/or profile.
   * @param ctx - The action context.
   * @returns Success with updated user/profile, or Failure on error.
   */
  async updateUser(
    dto: {
      user: typeof UserUpdateInputSchema._type;
      profile?: Partial<Omit<Profile, 'userId'>>;
    },
    ctx: ActionCtx
  ) {
    try {
      invariant(dto.user, 'User data missing');

      const _user = await prisma.user.findUniqueOrThrow({
        where: {
          walletAddress: ctx.address,
        },
        select: {
          id: true,
        },
      });

      const promises = [];
      if (dto.profile) {
        promises.push(
          prisma.profile.upsert({
            where: {
              userId: _user.id,
            },
            create: {
              userId: _user.id,
              ...dto.profile,
            },
            update: { ...dto.profile },
          })
        );
      }
      promises.push(
        prisma.user.update({
          where: { id: _user.id },
          data: { ...dto.user },
        })
      );
      const [user, profile] = (await Promise.allSettled(promises))
        .filter((p) => p.status === 'fulfilled')
        .map((p) => p.value);
      return Success({ user, ...(profile && { profile }) });
    } catch (e) {
      logger(e);
      return Failure(e);
    }
  }
}

export default new UsersController();
// const cleanData = (obj: Record<string, unknown>) => {
//   for (const key in obj) {
//     if (obj[key] === null || obj[key] === undefined) {
//       delete obj[key];
//     }
//   }
// };
