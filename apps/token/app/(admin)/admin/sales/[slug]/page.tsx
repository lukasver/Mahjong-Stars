import { CreateSaleForm } from '@/components/admin/create-sales';
import AdminTransactions from '@/components/admin/transactions';
import { getSale } from '@/lib/actions';
import { QueryClient } from '@tanstack/react-query';

/**
 * AdminPage provides tabbed navigation for admin actions: Sales, New Sale, Transactions.
 */
const ADMIN_TAB_VALUES = {
  Create: 'create',
  Transactions: 'transactions',
} as const;

export default async function AdminPage({ params, searchParams }: PageProps) {
  const [{ slug }, { saleId }] = await Promise.all([params, searchParams]);

  if (slug === ADMIN_TAB_VALUES.Create) {
    if (saleId) {
      // If we have info about the sale in the params, prefetch it
      const queryClient = new QueryClient();
      queryClient.prefetchQuery({
        queryKey: ['sales', saleId],
        queryFn: ({ queryKey }) => getSale({ id: queryKey[1] as string }),
      });
    }

    return <CreateSaleForm />;
  }
  if (slug === ADMIN_TAB_VALUES.Transactions) {
    return <AdminTransactions />;
  }

  return null;
  // return redirect("/admin/sales");
}
