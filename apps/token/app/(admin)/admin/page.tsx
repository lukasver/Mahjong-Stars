import { redirect } from 'next/navigation';

async function AdminPage() {
  redirect('/admin/sales');
}

export default AdminPage;
