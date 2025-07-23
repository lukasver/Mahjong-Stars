import 'server-only';
import { JWT_EXPIRATION_TIME } from '@/common/config/constants';
import { env, publicUrl } from '@/common/config/env';
import { createThirdwebClient } from 'thirdweb';
import { createAuth } from 'thirdweb/auth';
import { privateKeyToAccount } from 'thirdweb/wallets';
import { LoginParams } from '../actions';
import { refreshJWT as refreshJWTUtils } from 'thirdweb/utils';

// secretKey for serverside usage, wont be available in client
export const serverClient = createThirdwebClient({
  secretKey: env.THIRDWEB_API_SECRET,
  teamId: 'team_cmbakugit008e9j0kq3a1l0c0',
  clientId: env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID,
});

const auth = createAuth({
  domain: publicUrl,
  client: serverClient,
  adminAccount: privateKeyToAccount({
    client: serverClient,
    privateKey: env.THIRDWEB_ADMIN_PRIVATE_KEY,
  }),
  jwt: {
    // One day
    expirationTimeSeconds: JWT_EXPIRATION_TIME,
  },
  // login: {
  //   payloadExpirationTimeSeconds: Duration.fromObject({ days: 1 }).as(
  //     'seconds'
  //   ),
  //   uri: publicUrl,
  // },
});

export const generateAuthPayload = async ({
  address,
  chainId,
}: {
  address: string;
  chainId: number;
}) => {
  return auth.generatePayload({ address, chainId });
};

export const verifyAuthPayload = async (payload: LoginParams) => {
  return auth.verifyPayload(payload);
};

export const verifyJwt = async (jwt: string) => {
  return auth.verifyJWT({ jwt });
};

export const generateJWT = async (
  payload: Extract<
    Awaited<ReturnType<typeof verifyAuthPayload>>,
    { valid: true }
  >['payload'],
  ctx?: Record<string, string>
) => {
  return auth.generateJWT({ payload, context: ctx });
};

//Todo should check if is ok to use the admin account.
export const refreshJWT = async (jwt: string) => {
  return await refreshJWTUtils({
    account: privateKeyToAccount({
      client: serverClient,
      privateKey: env.THIRDWEB_ADMIN_PRIVATE_KEY,
    }),
    jwt,
    expirationTime: JWT_EXPIRATION_TIME,
  });
};
