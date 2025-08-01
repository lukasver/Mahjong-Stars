import 'server-only';
import { getSessionCookie } from '../auth/cookies';
import { verifyJwt } from '../auth/thirdweb';
import users from '../repositories/users';
import transactions from '../repositories/transactions';
import sales from '../repositories/sales';

import { getUserFromCache } from '../auth/cache';
import { isAdmin } from '../actions/admin';

const getUserFromSession = async () => {
  const verified = await getSessionCookie().then((d) => verifyJwt(d || ''));
  if (!verified || !verified.valid) {
    throw new Error('Invalid session');
  }
  return getUserFromCache(verified.parsedJWT.sub);
};

export const getCurrentUser = async () => {
  const user = await getUserFromSession();
  const result = await users.getMe({
    address: user.walletAddress,
  });
  if (result.success) {
    return { data: result.data, error: null };
  } else {
    return { data: null, error: result };
  }
};

export const getUserTransactions = async () => {
  const user = await getUserFromSession();
  const result = await transactions.getUserTransactions(
    {},
    {
      userId: user.id,
      address: user.walletAddress,
    }
  );
  if (result.success) {
    return { data: result.data, error: null };
  } else {
    return { data: null, error: result };
  }
};

export const getAllTransactions = async () => {
  const user = await getUserFromSession();
  const isAdminUser = await isAdmin(user.walletAddress);
  const result = await transactions.getAllTransactions(
    {},
    {
      address: user.walletAddress,
      userId: user.id,
      isAdmin: !!isAdminUser,
    }
  );
  if (result.success) {
    return { data: result.data, error: null };
  } else {
    return { data: null, error: result };
  }
};

export const getActiveSale = async () => {
  const user = await getUserFromSession();
  const result = await sales.getSales(
    { active: true },
    {
      address: user.walletAddress,
      userId: user.id,
    }
  );
  if (result.success) {
    return { data: result.data, error: null };
  } else {
    return { data: null, error: result };
  }
};
