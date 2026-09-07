import { getDashboardStats, getPatients } from '@/app/actions';
import DashboardClient from './DashboardClient';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id || '';
  const currentUserRole = (session?.user as any)?.role || 'CAPTADOR';

  let stats = {
    total: 0,
    agendados: 0,
    aguardo: 0,
    cancelados: 0,
    dataLocais: [],
    dataProcedimentos: []
  };
  let patients = [];

  try {
    stats = await getDashboardStats(currentUserId, currentUserRole);
    patients = await getPatients(currentUserId, currentUserRole);
  } catch (err) {
    console.error("Failed to load dashboard data", err);
  }

  return <DashboardClient stats={stats} patients={patients} />;
}
