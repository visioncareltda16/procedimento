import { getPatients, getProcedures, getSolicitingClinics, getExecutionLocations, getExecutingDoctors } from '@/app/actions';
import { getServerSession } from 'next-auth/next';
import PacientesClient from './PacientesClient';
import { authOptions } from '@/lib/authOptions';

export default async function PacientesPage() {
  let pacientes = [];
  let procedures = [];
  let clinics = [];
  let locations = [];
  let doctors = [];

  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id || '';
  const currentUserRole = (session?.user as any)?.role || 'CAPTADOR';

  try {
    pacientes = await getPatients(currentUserId, currentUserRole);
    procedures = await getProcedures();
    clinics = await getSolicitingClinics();
    locations = await getExecutionLocations();
    doctors = await getExecutingDoctors();
  } catch (err) {
    console.error("Failed to load patients data", err);
  }


  return <PacientesClient 
    initialPacientes={pacientes} 
    procedures={procedures}
    clinics={clinics}
    locations={locations}
    doctors={doctors}
    currentUserId={currentUserId} 
    currentUserRole={currentUserRole}
  />;
}
