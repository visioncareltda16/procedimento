'use client';

import { useState } from 'react';
import { Plus, Trash2, Settings, List, Building, MapPin, Users, Check, X, Edit2, Save, Stethoscope, Key } from 'lucide-react';
import styles from './Configuracoes.module.css';
import { 
  createProcedure, deleteProcedure, updateProcedure,
  createSolicitingClinic, deleteSolicitingClinic, updateSolicitingClinic,
  createExecutionLocation, deleteExecutionLocation, updateExecutionLocation,
  approveUser, assignUserToClinic, removeUserFromClinic, createProvisionalUser, updateUser,
  generateProvisionalPassword, assignDoctorToUser, removeDoctorFromUser,
  createExecutingDoctor, deleteExecutingDoctor, updateExecutingDoctor,
  assignLocationToDoctor, removeLocationFromDoctor,
  upsertDoctorRepasse, upsertLocationFee, getLocationFees,
  setSystemSetting
} from '@/app/actions';

export default function ConfiguracoesClient({ 
  initialProcedures, initialClinics, initialLocations, initialUsers, initialDoctors = [], initialSessionTimeout = '60'
}: { 
  initialProcedures: any[], initialClinics: any[], initialLocations: any[], initialUsers: any[], initialDoctors?: any[], initialSessionTimeout?: string
}) {
  const [activeTab, setActiveTab] = useState('locais');
  const [isSaving, setIsSaving] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(initialSessionTimeout);

  // Form states
  const [procName, setProcName] = useState('');
  const [procPrice, setProcPrice] = useState('');
  const [procSigla, setProcSigla] = useState('');
  const [procLateralidade, setProcLateralidade] = useState('');

  // Clinic
  const [clinicNome, setClinicNome] = useState('');
  const [clinicCep, setClinicCep] = useState('');
  const [clinicEndereco, setClinicEndereco] = useState('');
  const [clinicContato, setClinicContato] = useState('');
  const [clinicObservacao, setClinicObservacao] = useState('');

  // Location
  const [locNome, setLocNome] = useState('');
  const [locCep, setLocCep] = useState('');
  const [locEndereco, setLocEndereco] = useState('');
  const [locContato, setLocContato] = useState('');
  const [locObservacao, setLocObservacao] = useState('');
  const [locLogo, setLocLogo] = useState('');

  // Doctor states
  const [docNome, setDocNome] = useState('');
  const [docCrm, setDocCrm] = useState('');
  const [docContato, setDocContato] = useState('');

  // Repasses & Fees Modals
  const [activeDoctorId, setActiveDoctorId] = useState<string | null>(null);
  const [repasseValues, setRepasseValues] = useState<Record<string, string>>({});
  const [simulationLocId, setSimulationLocId] = useState('');
  
  const [activeLocationId, setActiveLocationId] = useState<string | null>(null);
  const [feeValues, setFeeValues] = useState<Record<string, string>>({});

  const [selectedClinic, setSelectedClinic] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');

  // Edit States
  const [editingLocId, setEditingLocId] = useState<string | null>(null);
  const [editLocData, setEditLocData] = useState<any>({});

  // New Provisional User
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('CAPTADOR');
  
  const [editingClinicId, setEditingClinicId] = useState<string | null>(null);
  const [editClinicData, setEditClinicData] = useState<any>({});

  const [editingProcId, setEditingProcId] = useState<string | null>(null);
  const [editProcData, setEditProcData] = useState<any>({});

  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editDocData, setEditDocData] = useState<any>({});

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserData, setEditUserData] = useState<any>({});

  // ViaCEP Fetch
  const handleCepLookup = async (cep: string, setEnderecoFn: (val: string) => void) => {
    if (!cep) return;
    const cleanCep = cep.replace(/\D/g, '');
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEnderecoFn(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
        }
      } catch (e) {
        console.error("CEP lookup failed", e);
      }
    }
  };

  // ADD Handlers
  const handleAddProcedure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!procName || !procPrice) return;
    setIsSaving(true);
    try {
      await createProcedure(procName, procPrice, procSigla, procLateralidade);
      setProcName(''); setProcPrice(''); setProcSigla(''); setProcLateralidade('');
    } finally { setIsSaving(false); }
  };

  const handleAddClinic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicNome) return;
    setIsSaving(true);
    try {
      await createSolicitingClinic({
        nome: clinicNome, endereco: clinicEndereco, cep: clinicCep, contato: clinicContato, observacao: clinicObservacao
      });
      setClinicNome(''); setClinicEndereco(''); setClinicCep(''); setClinicContato(''); setClinicObservacao('');
    } finally { setIsSaving(false); }
  };

  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locNome) return;
    setIsSaving(true);
    try {
      await createExecutionLocation({
        nome: locNome, endereco: locEndereco, cep: locCep, contato: locContato, observacao: locObservacao, logoUrl: locLogo
      });
      setLocNome(''); setLocEndereco(''); setLocCep(''); setLocContato(''); setLocObservacao(''); setLocLogo('');
    } finally { setIsSaving(false); }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docNome) return;
    setIsSaving(true);
    try {
      await createExecutingDoctor(docNome, docCrm, docContato);
      setDocNome(''); setDocCrm(''); setDocContato('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateProvisionalUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;
    setIsSaving(true);
    try {
      await createProvisionalUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setIsUserModalOpen(false);
    } catch (err: any) {
      alert(err.message || 'Erro ao criar usuário');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateProvisionalPassword = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja gerar uma nova senha provisória para ${name}?`)) return;
    try {
      const newPassword = await generateProvisionalPassword(id);
      alert(`A nova senha para ${name} é:\n\n${newPassword}\n\nCopie esta senha e envie ao usuário.`);
    } catch (err: any) {
      alert('Erro ao gerar senha provisória.');
    }
  };

  // EDIT Handlers
  const startEditLoc = (loc: any) => {
    setEditingLocId(loc.id);
    setEditLocData({ ...loc, cep: loc.cep || '', endereco: loc.endereco || '', contato: loc.contato || '', observacao: loc.observacao || '', logoUrl: loc.logoUrl || '' });
  };
  const saveEditLoc = async () => {
    if (!editingLocId) return;
    await updateExecutionLocation(editingLocId, {
      nome: editLocData.nome, endereco: editLocData.endereco, cep: editLocData.cep, contato: editLocData.contato, observacao: editLocData.observacao, logoUrl: editLocData.logoUrl
    });
    setEditingLocId(null);
  };

  const startEditClinic = (c: any) => {
    setEditingClinicId(c.id);
    setEditClinicData({ ...c, cep: c.cep || '', endereco: c.endereco || '', contato: c.contato || '', observacao: c.observacao || '' });
  };
  const saveEditClinic = async () => {
    if (!editingClinicId) return;
    await updateSolicitingClinic(editingClinicId, {
      nome: editClinicData.nome, endereco: editClinicData.endereco, cep: editClinicData.cep, contato: editClinicData.contato, observacao: editClinicData.observacao
    });
    setEditingClinicId(null);
  };

  const startEditProc = (p: any) => {
    setEditingProcId(p.id);
    setEditProcData({ ...p, sigla: p.sigla || '', lateralidade: p.lateralidade || '' });
  };
  const saveEditProc = async () => {
    if (!editingProcId) return;
    await updateProcedure(editingProcId, editProcData.name, editProcData.price, editProcData.sigla, editProcData.lateralidade);
    setEditingProcId(null);
  };

  const startEditDoc = (d: any) => {
    setEditingDocId(d.id);
    setEditDocData({ nome: d.nome, crm: d.crm || '', contato: d.contato || '' });
  };

  const saveEditDoc = async () => {
    if(!editingDocId) return;
    setIsSaving(true);
    try {
      await updateExecutingDoctor(editingDocId, editDocData.nome, editDocData.crm, editDocData.contato);
      setEditingDocId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const startEditUser = (u: any) => {
    setEditingUserId(u.id);
    setEditUserData({ name: u.name, email: u.email, role: u.role });
  };

  const saveEditUser = async () => {
    if(!editingUserId) return;
    setIsSaving(true);
    try {
      await updateUser(editingUserId, editUserData.name, editUserData.email, editUserData.role);
      setEditingUserId(null);
    } finally {
      setIsSaving(false);
    }
  };

  const handleActiveTab = (tab: string) => {
    setActiveTab(tab);
  };

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.5rem', fontWeight: '600', color: 'var(--text-primary)' }}>
          <Settings size={28} color="var(--primary-color)" />
          Hub Médico (Configurações)
        </h2>
      </div>

      <div className={styles.tabs}>
        <button className={`${styles.tabBtn} ${activeTab === 'locais' ? styles.activeTab : ''}`} onClick={() => setActiveTab('locais')}>
          <MapPin size={18} /> Locais de Execução
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'clinicas' ? styles.activeTab : ''}`} onClick={() => setActiveTab('clinicas')}>
          <Building size={18} /> Clínicas Solicitantes
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'procedimentos' ? styles.activeTab : ''}`} onClick={() => setActiveTab('procedimentos')}>
          <List size={18} /> Procedimentos
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'medicos' ? styles.activeTab : ''}`} onClick={() => setActiveTab('medicos')}>
          <Stethoscope size={18} /> Médicos Executores
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'usuarios' ? styles.activeTab : ''}`} onClick={() => setActiveTab('usuarios')}>
          <Users size={18} /> Captadores / Usuários
        </button>
        <button className={`${styles.tabBtn} ${activeTab === 'sistema' ? styles.activeTab : ''}`} onClick={() => setActiveTab('sistema')}>
          <Settings size={18} /> Sistema
        </button>
      </div>

      <div className={styles.contentGrid}>
        
        {/* TAB LOCAIS DE EXECUÇÃO */}
        {activeTab === 'locais' && (
          <div className={`glass-panel ${styles.panel}`}>
            <h3 className={styles.panelTitle}>Seus Locais de Execução</h3>
            <p className={styles.panelDesc}>Cadastre os locais onde você (Médico) atende e realiza os procedimentos.</p>
            <form onSubmit={handleAddLocation} className={styles.addForm}>
              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Nome do Local</label>
                  <input type="text" className="form-input" required value={locNome} onChange={e => setLocNome(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">CEP</label>
                  <input type="text" className="form-input" value={locCep} onChange={e => setLocCep(e.target.value)} onBlur={(e) => handleCepLookup(e.target.value, setLocEndereco)} placeholder="00000-000" />
                </div>
                <div className="form-group" style={{ flex: 3 }}>
                  <label className="form-label">Endereço Completo</label>
                  <input type="text" className="form-input" value={locEndereco} onChange={e => setLocEndereco(e.target.value)} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Contato / Telefones</label>
                  <input type="text" className="form-input" value={locContato} onChange={e => setLocContato(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Observação (Andar, Referência)</label>
                  <input type="text" className="form-input" value={locObservacao} onChange={e => setLocObservacao(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Logo URL (opcional)</label>
                  <input type="text" className="form-input" placeholder="https://..." value={locLogo} onChange={e => setLocLogo(e.target.value)} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ height: '42px' }} disabled={isSaving}><Plus size={18} /> Adicionar</button>
                </div>
              </div>
            </form>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead><tr><th>Local</th><th>Contato</th><th>Endereço</th><th>Obs</th><th>Taxas</th><th>Ações</th></tr></thead>
                <tbody>
                  {initialLocations.map(l => (
                    <tr key={l.id} onDoubleClick={() => startEditLoc(l)}>
                      {editingLocId === l.id ? (
                        <>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editLocData.nome} onChange={e => setEditLocData({...editLocData, nome: e.target.value})} /></td>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editLocData.contato} onChange={e => setEditLocData({...editLocData, contato: e.target.value})} /></td>
                          <td>
                            <input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem', marginBottom: '4px'}} placeholder="CEP" value={editLocData.cep} onChange={e => setEditLocData({...editLocData, cep: e.target.value})} onBlur={e => handleCepLookup(e.target.value, (val) => setEditLocData({...editLocData, endereco: val}))} />
                            <input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editLocData.endereco} onChange={e => setEditLocData({...editLocData, endereco: e.target.value})} />
                          </td>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editLocData.observacao} onChange={e => setEditLocData({...editLocData, observacao: e.target.value})} /></td>
                          <td>-</td>
                          <td style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className={styles.actionBtn} style={{color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)'}} onClick={saveEditLoc}><Save size={18} /></button>
                            <button className={styles.actionBtn} onClick={() => setEditingLocId(null)}><X size={18} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{fontWeight: 600}}>
                            {l.logoUrl && <img src={l.logoUrl} alt="logo" style={{height: 24, marginRight: 8, verticalAlign: 'middle'}} />}
                            {l.nome}
                          </td>
                          <td>{l.contato || '-'}</td>
                          <td>
                            {l.cep ? <span style={{fontSize: '0.8rem', color: 'var(--text-tertiary)'}}>CEP: {l.cep}<br/></span> : ''}
                            {l.endereco || '-'}
                          </td>
                          <td style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{l.observacao || '-'}</td>
                          <td>
                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={async () => {
                              setActiveLocationId(l.id);
                              const locationFees = await getLocationFees(l.id);
                              const vals: Record<string, string> = {};
                              locationFees.forEach((fee: any) => vals[fee.procedureId] = fee.valor);
                              setFeeValues(vals);
                            }}>
                              <Settings size={14} /> Taxas
                            </button>
                          </td>
                          <td style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={styles.actionBtn} style={{color: 'var(--navy-blue)', background: 'rgba(5, 10, 31, 0.05)'}} onClick={() => startEditLoc(l)} title="Duplo clique para editar"><Edit2 size={18} /></button>
                            <button className={styles.actionBtn} onClick={() => deleteExecutionLocation(l.id)}><Trash2 size={18} /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {initialLocations.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Nenhum local cadastrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB CLINICAS SOLICITANTES */}
        {activeTab === 'clinicas' && (
          <div className={`glass-panel ${styles.panel}`}>
            <h3 className={styles.panelTitle}>Clínicas Solicitantes</h3>
            <p className={styles.panelDesc}>Cadastre as clínicas parceiras que solicitam procedimentos para você.</p>
            <form onSubmit={handleAddClinic} className={styles.addForm}>
              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Nome da Clínica</label>
                  <input type="text" className="form-input" required value={clinicNome} onChange={e => setClinicNome(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">CEP</label>
                  <input type="text" className="form-input" value={clinicCep} onChange={e => setClinicCep(e.target.value)} onBlur={(e) => handleCepLookup(e.target.value, setClinicEndereco)} placeholder="00000-000" />
                </div>
                <div className="form-group" style={{ flex: 3 }}>
                  <label className="form-label">Endereço Completo</label>
                  <input type="text" className="form-input" value={clinicEndereco} onChange={e => setClinicEndereco(e.target.value)} />
                </div>
              </div>
              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Contato (Telefone/Email)</label>
                  <input type="text" className="form-input" value={clinicContato} onChange={e => setClinicContato(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Observação</label>
                  <input type="text" className="form-input" value={clinicObservacao} onChange={e => setClinicObservacao(e.target.value)} placeholder="Detalhes, CNPJ, etc..." />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ height: '42px' }} disabled={isSaving}><Plus size={18} /> Adicionar</button>
                </div>
              </div>
            </form>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead><tr><th>Clínica</th><th>Contato</th><th>Endereço</th><th>Obs</th><th>Ações</th></tr></thead>
                <tbody>
                  {initialClinics.map(c => (
                    <tr key={c.id} onDoubleClick={() => startEditClinic(c)}>
                      {editingClinicId === c.id ? (
                        <>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editClinicData.nome} onChange={e => setEditClinicData({...editClinicData, nome: e.target.value})} /></td>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editClinicData.contato} onChange={e => setEditClinicData({...editClinicData, contato: e.target.value})} /></td>
                          <td>
                            <input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem', marginBottom: '4px'}} placeholder="CEP" value={editClinicData.cep} onChange={e => setEditClinicData({...editClinicData, cep: e.target.value})} onBlur={e => handleCepLookup(e.target.value, (val) => setEditClinicData({...editClinicData, endereco: val}))} />
                            <input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editClinicData.endereco} onChange={e => setEditClinicData({...editClinicData, endereco: e.target.value})} />
                          </td>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editClinicData.observacao} onChange={e => setEditClinicData({...editClinicData, observacao: e.target.value})} /></td>
                          <td style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className={styles.actionBtn} style={{color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)'}} onClick={saveEditClinic}><Save size={18} /></button>
                            <button className={styles.actionBtn} onClick={() => setEditingClinicId(null)}><X size={18} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td style={{fontWeight: 600}}>{c.nome}</td>
                          <td>{c.contato || '-'}</td>
                          <td>
                            {c.cep ? <span style={{fontSize: '0.8rem', color: 'var(--text-tertiary)'}}>CEP: {c.cep}<br/></span> : ''}
                            {c.endereco || '-'}
                          </td>
                          <td style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>{c.observacao || '-'}</td>
                          <td style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={styles.actionBtn} style={{color: 'var(--navy-blue)', background: 'rgba(5, 10, 31, 0.05)'}} onClick={() => startEditClinic(c)} title="Duplo clique para editar"><Edit2 size={18} /></button>
                            <button className={styles.actionBtn} onClick={() => deleteSolicitingClinic(c.id)}><Trash2 size={18} /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {initialClinics.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center' }}>Nenhuma clínica cadastrada.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB PROCEDIMENTOS */}
        {activeTab === 'procedimentos' && (
          <div className={`glass-panel ${styles.panel}`}>
            <h3 className={styles.panelTitle}>Gerenciar Procedimentos</h3>
            <p className={styles.panelDesc}>Cadastre os procedimentos médicos e seus valores base.</p>
            <form onSubmit={handleAddProcedure} className={styles.addForm}>
              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 3 }}>
                  <label className="form-label">Nome do Procedimento</label>
                  <input type="text" className="form-input" required value={procName} onChange={e => setProcName(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Sigla</label>
                  <input type="text" className="form-input" value={procSigla} onChange={e => setProcSigla(e.target.value)} placeholder="Ex: CAP" />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Valor (R$)</label>
                  <input type="text" className="form-input" required value={procPrice} onChange={e => setProcPrice(e.target.value)} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ height: '42px' }} disabled={isSaving}><Plus size={18} /> Adicionar</button>
                </div>
              </div>
            </form>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead><tr><th>Procedimento</th><th>Sigla</th><th>Valor Base</th><th>Ações</th></tr></thead>
                <tbody>
                  {initialProcedures.map(p => (
                    <tr key={p.id} onDoubleClick={() => startEditProc(p)}>
                      {editingProcId === p.id ? (
                        <>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editProcData.name} onChange={e => setEditProcData({...editProcData, name: e.target.value})} /></td>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editProcData.sigla || ''} onChange={e => setEditProcData({...editProcData, sigla: e.target.value})} /></td>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editProcData.price} onChange={e => setEditProcData({...editProcData, price: e.target.value})} /></td>
                          <td style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className={styles.actionBtn} style={{color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)'}} onClick={saveEditProc}><Save size={18} /></button>
                            <button className={styles.actionBtn} onClick={() => setEditingProcId(null)}><X size={18} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{p.name}</td>
                          <td><span className="badge badge-scheduled" style={{background: 'var(--border-color)', color: 'var(--text-secondary)'}}>{p.sigla || '-'}</span></td>
                          <td>{p.price}</td>
                          <td style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={styles.actionBtn} style={{color: 'var(--navy-blue)', background: 'rgba(5, 10, 31, 0.05)'}} onClick={() => startEditProc(p)} title="Duplo clique para editar"><Edit2 size={18} /></button>
                            <button className={styles.actionBtn} onClick={() => deleteProcedure(p.id)}><Trash2 size={18} /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {initialProcedures.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center' }}>Nenhum procedimento.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB MEDICOS EXECUTORES */}
        {activeTab === 'medicos' && (
          <div className={`glass-panel ${styles.panel}`}>
            <h3 className={styles.panelTitle}>Médicos Executores</h3>
            <p className={styles.panelDesc}>Cadastre médicos e configure os repasses.</p>
            <form onSubmit={handleAddDoctor} className={styles.formContainer}>
              <div className={styles.formRow}>
                <div className="form-group" style={{ flex: 2 }}>
                  <label className="form-label">Nome do Médico</label>
                  <input type="text" className="form-input" required value={docNome} onChange={e => setDocNome(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">CRM</label>
                  <input type="text" className="form-input" value={docCrm} onChange={e => setDocCrm(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Contato</label>
                  <input type="text" className="form-input" value={docContato} onChange={e => setDocContato(e.target.value)} />
                </div>
                <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ height: '42px' }} disabled={isSaving}><Plus size={18} /> Adicionar</button>
                </div>
              </div>
            </form>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead><tr><th>Nome</th><th>CRM</th><th>Contato</th><th>Locais Autorizados</th><th>Regras de Repasse</th><th>Ações</th></tr></thead>
                <tbody>
                  {initialDoctors?.map(d => (
                    <tr key={d.id} onDoubleClick={() => startEditDoc(d)}>
                      {editingDocId === d.id ? (
                        <>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editDocData.nome} onChange={e => setEditDocData({...editDocData, nome: e.target.value})} /></td>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editDocData.crm || ''} onChange={e => setEditDocData({...editDocData, crm: e.target.value})} /></td>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editDocData.contato || ''} onChange={e => setEditDocData({...editDocData, contato: e.target.value})} /></td>
                          <td>-</td>
                          <td>-</td>
                          <td style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className={styles.actionBtn} style={{color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)'}} onClick={saveEditDoc}><Save size={18} /></button>
                            <button className={styles.actionBtn} onClick={() => setEditingDocId(null)}><X size={18} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{d.nome}</td>
                          <td>{d.crm}</td>
                          <td>{d.contato}</td>
                          <td>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                              {d.executionLocations?.map((dl: any) => (
                                <div key={dl.locationId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                  <MapPin size={14} /> {dl.location?.nome}
                                  <button style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }} onClick={() => removeLocationFromDoctor(d.id, dl.locationId)}><X size={14}/></button>
                                </div>
                              ))}
                              <div style={{ display: 'flex', gap: '0.25rem' }}>
                                <select className="form-select" style={{ padding: '0.25rem', fontSize: '0.8rem', height: 'auto' }} value={selectedLocation} onChange={e => setSelectedLocation(e.target.value)}>
                                  <option value="">+ Vincular Local...</option>
                                  {initialLocations.map(loc => <option key={loc.id} value={loc.id}>{loc.nome}</option>)}
                                </select>
                                <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => { if(selectedLocation) assignLocationToDoctor(d.id, selectedLocation); setSelectedLocation(''); }}>
                                  <Check size={14}/>
                                </button>
                              </div>
                            </div>
                          </td>
                          <td>
                            <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => {
                              setActiveDoctorId(d.id);
                              const vals: Record<string, string> = {};
                              d.repasses?.forEach((r: any) => vals[r.procedureId] = r.valor);
                              setRepasseValues(vals);
                            }}>
                              <Settings size={14} /> Configurar ({d.repasses?.length || 0})
                            </button>
                          </td>
                          <td style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className={styles.actionBtn} style={{color: 'var(--navy-blue)', background: 'rgba(5, 10, 31, 0.05)'}} onClick={() => startEditDoc(d)} title="Duplo clique para editar"><Edit2 size={18} /></button>
                            <button className={styles.actionBtn} onClick={() => deleteExecutingDoctor(d.id)}><Trash2 size={18} /></button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {initialDoctors?.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center' }}>Nenhum médico cadastrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB USUARIOS */}
        {activeTab === 'usuarios' && (
          <div className={`glass-panel ${styles.panel}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <h3 className={styles.panelTitle}>Captadores e Equipe</h3>
                <p className={styles.panelDesc}>Aprove logins e defina a qual clínica os captadores pertencem, ou crie acessos provisórios.</p>
              </div>
              <button className="btn btn-primary" onClick={() => setIsUserModalOpen(true)}>
                <Plus size={18} /> Novo Usuário
              </button>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead><tr><th>Nome</th><th>Email</th><th>Cargo e Status</th><th>Vínculo Clínico</th><th>Ações</th></tr></thead>
                <tbody>
                  {initialUsers.map(u => (
                    <tr key={u.id} onDoubleClick={() => startEditUser(u)}>
                      {editingUserId === u.id ? (
                        <>
                          <td><input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editUserData.name} onChange={e => setEditUserData({...editUserData, name: e.target.value})} /></td>
                          <td><input type="email" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editUserData.email} onChange={e => setEditUserData({...editUserData, email: e.target.value})} /></td>
                          <td>
                            <select className="form-select" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editUserData.role} onChange={e => setEditUserData({...editUserData, role: e.target.value})}>
                              <option value="ADMIN">Admin</option>
                              <option value="CAPTADOR">Captador</option>
                              <option value="MEDICO">Médico</option>
                            </select>
                          </td>
                          <td>-</td>
                          <td style={{ display: 'flex', gap: '0.25rem' }}>
                            <button className={styles.actionBtn} style={{color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)'}} onClick={saveEditUser}><Save size={18} /></button>
                            <button className={styles.actionBtn} onClick={() => setEditingUserId(null)}><X size={18} /></button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{u.name}</td>
                          <td>{u.email}</td>
                          <td>
                            {u.status === 'PENDING' ? (
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => approveUser(u.id, 'CAPTADOR')}>
                                  Aprovar Captador
                                </button>
                                <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => approveUser(u.id, 'MEDICO')}>
                                  Aprovar Médico
                                </button>
                              </div>
                            ) : (
                              <span className={`badge ${u.role === 'MEDICO' || u.role === 'ADMIN' ? 'badge-scheduled' : 'badge-pending'}`}>{u.role}</span>
                            )}
                          </td>
                          <td>
                            {u.role === 'CAPTADOR' && u.status === 'APPROVED' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {u.userClinics.map((uc: any) => (
                                  <div key={uc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <Building size={14} /> {uc.clinic.nome}
                                    <button style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }} onClick={() => removeUserFromClinic(u.id, uc.clinicId)}><X size={14}/></button>
                                  </div>
                                ))}
                                <div style={{ display: 'flex', gap: '0.25rem' }}>
                                  <select className="form-select" style={{ padding: '0.25rem', fontSize: '0.8rem', height: 'auto' }} value={selectedClinic} onChange={e => setSelectedClinic(e.target.value)}>
                                    <option value="">+ Vincular Clínica...</option>
                                    {initialClinics.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                                  </select>
                                  <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => { if(selectedClinic) assignUserToClinic(u.id, selectedClinic); setSelectedClinic(''); }}>
                                    <Check size={14}/>
                                  </button>
                                </div>
                              </div>
                            )}
                            {u.role === 'MEDICO' && u.status === 'APPROVED' && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {u.executingDoctorId ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                                    <Stethoscope size={14} /> {initialDoctors?.find(d => d.id === u.executingDoctorId)?.nome || 'Desconhecido'}
                                    <button style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }} onClick={() => removeDoctorFromUser(u.id)}><X size={14}/></button>
                                  </div>
                                ) : (
                                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                                    <select className="form-select" style={{ padding: '0.25rem', fontSize: '0.8rem', height: 'auto' }} value={selectedDoctor} onChange={e => setSelectedDoctor(e.target.value)}>
                                      <option value="">+ Vincular Médico...</option>
                                      {initialDoctors?.map(d => <option key={d.id} value={d.id}>{d.nome}</option>)}
                                    </select>
                                    <button className="btn btn-outline" style={{ padding: '0.25rem' }} onClick={() => { if(selectedDoctor) assignDoctorToUser(u.id, selectedDoctor); setSelectedDoctor(''); }}>
                                      <Check size={14}/>
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button className={styles.actionBtn} style={{color: 'var(--navy-blue)', background: 'rgba(5, 10, 31, 0.05)'}} onClick={() => startEditUser(u)} title="Duplo clique para editar"><Edit2 size={18} /></button>
                              <button className={styles.actionBtn} style={{color: 'var(--primary-color)', background: 'rgba(59, 130, 246, 0.1)'}} onClick={() => handleGenerateProvisionalPassword(u.id, u.name)} title="Gerar Nova Senha Provisória"><Key size={18} /></button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* TAB SISTEMA */}
      {activeTab === 'sistema' && (
        <div className={`glass-panel ${styles.panel}`}>
          <h3 className={styles.panelTitle}>Configurações do Sistema</h3>
          <p className={styles.panelDesc}>Ajuste variáveis globais de funcionamento do sistema.</p>
          
          <div style={{ marginTop: '2rem', maxWidth: '400px' }}>
            <label className="form-label">Tempo de Sessão por Inatividade</label>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Define quanto tempo o usuário pode ficar sem interagir com o sistema antes de ser deslogado automaticamente.
            </p>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select 
                className="form-select" 
                value={sessionTimeout} 
                onChange={(e) => setSessionTimeout(e.target.value)}
              >
                <option value="30">30 Minutos</option>
                <option value="60">60 Minutos</option>
                <option value="90">90 Minutos</option>
                <option value="120">120 Minutos</option>
              </select>
              <button 
                className="btn btn-primary"
                disabled={isSaving}
                onClick={async () => {
                  setIsSaving(true);
                  await setSystemSetting('session_timeout', sessionTimeout);
                  setIsSaving(false);
                  alert('Tempo de sessão salvo com sucesso!');
                }}
              >
                {isSaving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NOVO USUARIO */}
      {isUserModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ background: 'var(--bg-secondary)', padding: '2rem', width: '90%', maxWidth: '400px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem' }}>Novo Usuário</h3>
              <button onClick={() => setIsUserModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={handleCreateProvisionalUser} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Nome</label>
                <input type="text" className="form-input" required value={newUserName} onChange={e => setNewUserName(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="form-input" required value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Senha Provisória</label>
                <input type="text" className="form-input" required value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
              </div>
              <div>
                <label className="form-label">Cargo (Role)</label>
                <select className="form-select" value={newUserRole} onChange={e => setNewUserRole(e.target.value)}>
                  <option value="CAPTADOR">Captador</option>
                  <option value="MEDICO">Médico</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsUserModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Salvando...' : 'Criar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPASSES */}
      {activeDoctorId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', width: '90%', maxWidth: '750px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>Regras de Repasse - {initialDoctors?.find(d => d.id === activeDoctorId)?.nome}</h3>
              <button onClick={() => setActiveDoctorId(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <strong>Regra de Cálculo:</strong> O valor do repasse incide sobre a diferença (Valor do Procedimento - Taxa do Local de Execução).
            </div>

            <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Simular Saldo por Local:</label>
              <select className="form-select" style={{ maxWidth: '300px', height: '32px', fontSize: '0.85rem' }} value={simulationLocId} onChange={e => setSimulationLocId(e.target.value)}>
                <option value="">Selecione um local para simular...</option>
                {initialLocations.map(l => (
                  <option key={l.id} value={l.id}>{l.nome}</option>
                ))}
              </select>
            </div>

            <table className={styles.table}>
              <thead><tr><th>Procedimento</th><th>Valor Base</th><th>Saldo (Base - Taxa)</th><th>Valor / Porcentagem (R$ ou %)</th><th>Ação</th></tr></thead>
              <tbody>
                {initialProcedures.map(p => {
                  let saldoStr = '-';
                  if (simulationLocId) {
                    const loc = initialLocations.find(l => l.id === simulationLocId);
                    const feeObj = loc?.locationFees?.find((f: any) => f.procedureId === p.id);
                    if (feeObj && p.price) {
                      const basePriceNum = parseFloat(p.price.replace(/\./g, '').replace(',', '.')) || 0;
                      let feeValNum = 0;
                      if (feeObj.valor.includes('%')) {
                        const pct = parseFloat(feeObj.valor) || 0;
                        feeValNum = (pct / 100) * basePriceNum;
                      } else {
                        feeValNum = parseFloat(feeObj.valor.replace(/\./g, '').replace(',', '.')) || 0;
                      }
                      const saldo = basePriceNum - feeValNum;
                      saldoStr = saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    } else if (p.price) {
                      saldoStr = p.price; // No fee registered yet for this location
                    }
                  }

                  return (
                    <tr key={p.id}>
                      <td>{p.name} {p.sigla && `(${p.sigla})`}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{p.price}</td>
                      <td style={{ color: 'var(--primary-color)', fontWeight: 600 }}>{saldoStr !== '-' ? `R$ ${saldoStr}` : '-'}</td>
                      <td>
                        <input type="text" className="form-input" style={{ padding: '0.4rem', height: '32px' }} value={repasseValues[p.id] || ''} onChange={e => setRepasseValues({...repasseValues, [p.id]: e.target.value})} placeholder="Ex: 200,00 ou 50%" />
                      </td>
                      <td>
                        <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={async () => {
                          await upsertDoctorRepasse(activeDoctorId, p.id, repasseValues[p.id] || '');
                          alert('Repasse salvo!');
                        }}>Salvar</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: TAXAS DE LOCAL */}
      {activeLocationId && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel" style={{ background: 'var(--bg-secondary)', padding: '1.5rem', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h3>Taxas de Execução - {initialLocations?.find(l => l.id === activeLocationId)?.nome}</h3>
              <button onClick={() => setActiveLocationId(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <table className={styles.table}>
              <thead><tr><th>Procedimento</th><th>Valor Base</th><th>Taxa (R$ ou %)</th><th>Ação</th></tr></thead>
              <tbody>
                {initialProcedures.map(p => (
                  <tr key={p.id}>
                    <td>{p.name} {p.sigla && `(${p.sigla})`}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.price}</td>
                    <td>
                      <input type="text" className="form-input" style={{ padding: '0.4rem', height: '32px' }} value={feeValues[p.id] || ''} onChange={e => setFeeValues({...feeValues, [p.id]: e.target.value})} placeholder="Ex: 50,00" />
                    </td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }} onClick={async () => {
                        await upsertLocationFee(activeLocationId, p.id, feeValues[p.id] || '');
                        alert('Taxa salva!');
                      }}>Salvar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
