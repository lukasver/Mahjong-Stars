import sales from '@/lib/controllers/sales';
import users from '@/lib/controllers/users';
import { withAuth } from './_auth';
import { NextResponse } from 'next/server';

/**
 * Handles GET requests for the proxy route with authentication.
 */
export const GET = withAuth(async (req, context, auth) => {
  const { all } = await context.params;
  const qParams = req.nextUrl.searchParams;
  const qParamsObject = Object.fromEntries(qParams.entries());

  const controller = all[0];
  const identifier = all[1];
  const subIdentifier = all[2];

  if (!controller) {
    return NextResponse.json({ error: 'Bad request' }, { status: 404 });
  }

  switch (controller) {
    case 'sales': {
      if (identifier) {
        if (subIdentifier === 'saft') {
          const data = await sales.getSaleSaftContract(identifier);
          return NextResponse.json(data);
        }
        if (subIdentifier === 'documents') {
          const data = await sales.getSaleDocuments(identifier);
          return NextResponse.json(data);
        }

        const data = await sales.getSale(
          { id: identifier },
          { address: auth.address }
        );

        return NextResponse.json(data);
      }

      const data = await sales.getSales(
        { active: qParamsObject.active === 'true' },
        { address: auth.address }
      );

      console.debug('🚀 ~ route.ts:39 ~ GET ~ data:', data);

      return NextResponse.json(data);
    }

    case 'users': {
      if (identifier === 'me') {
        const data = await users.getMe({ address: auth.address });
        return NextResponse.json(data);
      }
    }
  }

  return NextResponse.json({ error: 'Bad request' }, { status: 404 });
});
