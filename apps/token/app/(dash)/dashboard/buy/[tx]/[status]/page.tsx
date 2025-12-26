import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
} from "@tanstack/react-query";
import { notFound, redirect } from "next/navigation";
import { getTransactionById } from "@/lib/actions";
import { getTransactionStatus } from "@/lib/services/fetchers.server";
import { handleRedirectForTransactionStatus } from "@/lib/utils";
import Failure from "./failure";
import Pending from "./pending";
import Processing from "./processing";
import Success from "./success";

export default async function StatusPage({
  params,
  searchParams,
}: PageProps<"/dashboard/buy/[tx]/[status]">) {
  const [p, sp] = await Promise.all([params, searchParams]);
  const queryClient = new QueryClient();
  void queryClient.prefetchQuery({
    queryKey: ["transactions", p.tx],
    queryFn: () => getTransactionById({ id: p.tx }),
  });
  const tx = await queryClient.fetchQuery({
    queryKey: ["transactions", p.tx, "status"],
    queryFn: () => getTransactionStatus(p.tx),
  });

  if (!tx?.data) {
    notFound();
  }
  const path = handleRedirectForTransactionStatus(tx.data);

  console.debug("🚀 ~ page.tsx:35 ~ path:", path);

  if (path?.endsWith(p.tx)) {
    redirect(`/dashboard/buy/${p.tx}`);
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {path && path.includes("/pending") && <Pending />}
      {path && path.includes("/processing") && <Processing />}
      {path && path.includes("/success") && <Success />}
      {path && path.includes("/failure") && (
        <Failure
          code={sp.code ? sp.code.toString() : (tx.data.status ?? undefined)}
        />
      )}
    </HydrationBoundary>
  );
}
