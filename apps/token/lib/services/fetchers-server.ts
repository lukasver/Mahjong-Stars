import 'server-only';
import { getSessionCookie } from '../auth/cookies';
import { verifyJwt } from '../auth/thirdweb';
import usersController from '../repositories/users';

export const getCurrentUser = async () => {
  const verified = await getSessionCookie().then((d) => verifyJwt(d || ''));
  if (!verified || !verified.valid) {
    throw new Error('Invalid session');
  }
  const result = await usersController.getMe({
    address: verified.parsedJWT.sub,
  });
  if (result.success) {
    return { data: result.data, error: null };
  } else {
    return { data: null, error: result };
  }
};
