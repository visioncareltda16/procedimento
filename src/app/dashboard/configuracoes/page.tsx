import { getProcedures, getSolicitingClinics, getExecutionLocations, getUsers, getExecutingDoctors, getSystemSetting } from '@/app/actions';
import ConfiguracoesClient from './ConfiguracoesClient';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/authOptions';

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions);
  const currentUserRole = (session?.user as any)?.role || 'CAPTADOR';

  if (currentUserRole !== 'ADMIN') {
    redirect('/dashboard');
  }

  let procedures: any[] = [];
  let clinics: any[] = [];
  let locations: any[] = [];
  let users: any[] = [];
  let doctors: any[] = [];
  let sessionTimeout: string = '60'; // Default
  
  try {
    procedures = await getProcedures();
    clinics = await getSolicitingClinics();
    locations = await getExecutionLocations();
    users = await getUsers();
    doctors = await getExecutingDoctors();
    sessionTimeout = await getSystemSetting('session_timeout', '60');
  } catch (err) {
    console.error("Failed to load configuracoes data", err);
  }

  return <ConfiguracoesClient 
    initialProcedures={procedures} 
    initialClinics={clinics}
    initialLocations={locations}
    initialUsers={users}
    initialDoctors={doctors}
    initialSessionTimeout={sessionTimeout}
  />;
}
