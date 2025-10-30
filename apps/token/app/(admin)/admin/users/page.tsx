import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { ListUsers } from "@/components/admin/list-users";
import { getAllUsers } from "@/lib/services/fetchers.server";


export default async function AdminUsersPage({ searchParams }: PageProps<'/admin/users'>) {
  const queryClient = new QueryClient();
  const query = await searchParams;

  await queryClient.prefetchQuery({
    queryKey: [
      "users",
      "admin",
      {
        page: query.page ? parseInt(query.page as string) : 1,
        limit: query.limit ? parseInt(query.limit as string) : 20,
        search: query.search,
        kycStatus: query.kycStatus,
      },
    ],
    queryFn: () =>
      getAllUsers({
        page: query.page ? parseInt(query.page as string) : 1,
        limit: query.limit ? parseInt(query.limit as string) : 20,
        search: query.search as string | undefined,
        kycStatus: query.kycStatus as string | undefined,
      }),
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ListUsers
        title="Users Management"
        description="View and manage all registered users"
      />
    </HydrationBoundary>
  );
}

export const dynamic = "force-dynamic";
