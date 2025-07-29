import Failure from './failure';
import { notFound } from 'next/navigation';
import Success from './success';
import Pending from './pending';

export default async function StatusPage({
  params,
}: PageProps<{ status: 'success' | 'failure' | 'pending' }>) {
  const p = await params;
  if (p.status === 'success') {
    return <Success />;
  } else if (p.status === 'failure') {
    return <Failure />;
  } else if (p.status === 'pending') {
    return <Pending />;
  }

  notFound();
}
