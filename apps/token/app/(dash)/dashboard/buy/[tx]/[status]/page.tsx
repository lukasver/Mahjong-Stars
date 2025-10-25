import { notFound } from "next/navigation";
import Failure from "./failure";
import Pending from "./pending";
import Success from "./success";

export default async function StatusPage({
  params,
  searchParams,
}: PageProps<{ status: "success" | "failure" | "pending" }>) {
  const [p, sp] = await Promise.all([params, searchParams]);
  if (p.status === "success") {
    return <Success />;
  } else if (p.status === "failure") {
    return <Failure code={sp.code ? sp.code.toString() : undefined} />;
  } else if (p.status === "pending") {
    return <Pending />;
  }

  notFound();
}
