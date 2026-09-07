import DashboardLayout from '@/components/layout/DashboardLayout';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export default async function Layout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || 'CAPTADOR';
  return <DashboardLayout userRole={userRole}>{children}</DashboardLayout>;
}
