import sales from '@/lib/controllers/sales';
import users from '@/lib/controllers/users';
import { withAuth } from './_auth';
import { NextResponse } from 'next/server';
import rates from '@/lib/controllers/feeds/rates';
import { env } from '@/common/config/env';
import transactions from '@/lib/controllers/transactions';
import { TransactionStatusSchema } from '@/common/schemas/generated';

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

  console.debug(
    '🚀 ~ route.ts:20',
    `${controller} ${identifier} ${subIdentifier}`
  );
  if (!controller) {
    return NextResponse.json({ error: 'Bad request' }, { status: 404 });
  }

  try {
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
          if (subIdentifier === 'invest') {
            const data = await sales.getSaleInvestInfo(identifier);
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

        return NextResponse.json(data);
      }

      case 'users': {
        if (identifier === 'me') {
          const data = await users.getMe({ address: auth.address });
          return NextResponse.json(data);
        }
        return NextResponse.json({ error: 'Bad request' }, { status: 404 });
      }

      case 'feeds': {
        if (identifier === 'rates') {
          const from = qParams.get('from');
          const to = qParams.get('to');

          if (!from || !to) {
            return NextResponse.json({ error: 'Bad request' }, { status: 404 });
          }
          const fromArray = from.split(',');
          const toArray = to.split(',');

          const data = await rates.getExchangeRate(
            fromArray?.length > 1 ? fromArray : from,
            toArray?.length > 1 ? toArray : to
          );

          return NextResponse.json(data);
        }
        return NextResponse.json({ error: 'Bad request' }, { status: 404 });
      }

      case 'transactions': {
        if (identifier) {
          const data = await transactions.userTransactionsForSale(
            {
              saleId: identifier,
              status: TransactionStatusSchema.array().parse(
                qParams.getAll('status') || []
              ),
            },
            { address: auth.address }
          );
          return NextResponse.json(data);
        }
        return NextResponse.json({ error: 'Bad request' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Bad request' }, { status: 404 });
  } catch (e) {
    let error = 'Internal server error';
    if (e instanceof Error && env.IS_DEV) {
      error += ': ' + e.message;
    }
    return new NextResponse(JSON.stringify({ error }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
