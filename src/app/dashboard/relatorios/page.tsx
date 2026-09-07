import { getRelatoriosData } from '@/app/actions';
import RelatoriosClient from './RelatoriosClient';

export default async function RelatoriosPage() {
  const data = await getRelatoriosData();
  
  return <RelatoriosClient initialData={data} />;
}
