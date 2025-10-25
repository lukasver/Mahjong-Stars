import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { ListUsers } from "@/components/admin/list-users";
import { getAllUsers } from "@/lib/services/fetchers.server";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    limit?: string;
    search?: string;
    kycStatus?: string;
  }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const queryClient = new QueryClient();
  const query = await searchParams;

  await queryClient.prefetchQuery({
    queryKey: [
      "users",
      "admin",
      {
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20,
        search: query.search,
        kycStatus: query.kycStatus,
      },
    ],
    queryFn: () =>
      getAllUsers({
        page: query.page ? parseInt(query.page) : 1,
        limit: query.limit ? parseInt(query.limit) : 20,
        search: query.search,
        kycStatus: query.kycStatus,
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
