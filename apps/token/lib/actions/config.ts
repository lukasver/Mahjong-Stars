// https://next-safe-action.dev/docs/safe-action-client/extend-a-client
// import { auth } from '../auth/better-auth/auth';

import { invariant } from '@epic-web/invariant';
import { createSafeActionClient } from 'next-safe-action';
import log from '../services/logger.server';

import { getUserFromCache } from '../auth/cache';
import { getSessionCookie } from '../auth/cookies';
import { verifyJwt } from '../auth/thirdweb';

const isE2ETest = process.env.E2E_TEST_MODE === 'true';

export const loginActionClient = createSafeActionClient({
  // Can also be an async function.
  handleServerError(e, _utils) {
    // You can accesse these properties inside the `utils` object.
    // const { clientInput, bindArgsClientInputs, metadata, ctx } = _utils;
    return e?.message || 'Something went wrong';
  },
}).use(async ({ next, ctx }) => {
  const result = await next({
    ctx: {
      ...ctx,
    },
  });
  if (!result.success) {
    log(`[ERROR loginActionClient]: ${JSON.stringify(result)}`);
  }
  return result;
});

/**
 * This action client is used with service actions that require an authed call.
 */
export const authActionClient = createSafeActionClient({
  // Can also be an async function.
  handleServerError(e, _utils) {
    // You can accesse these properties inside the `utils` object.
    // const { clientInput, bindArgsClientInputs, metadata, ctx } = _utils;
    return e?.message || 'Something went wrong';
  },
})
  .use(async ({ next }) => {
    let address = '';
    if (isE2ETest) {
      address = process.env.E2E_TEST_USER_ADDRESS!;
    } else {
      const token = await getSessionCookie();
      invariant(token, 'Forbidden');
      const verified = await verifyJwt(token);
      invariant(verified.valid, 'Invalid jwt');
      address = verified.parsedJWT.sub;
    }
    const user = await getUserFromCache(address);
    return next({
      ctx: {
        address: user.walletAddress,
        email: user.email,
        userId: user.id,
      },
    });
  })
  .use(async ({ next, ctx }) => {
    const result = await next({
      ctx,
    });

    if (!result.success) {
      log(`[ERROR authActionClient]: ${JSON.stringify(result)}`);
    }

    return result;
  });
