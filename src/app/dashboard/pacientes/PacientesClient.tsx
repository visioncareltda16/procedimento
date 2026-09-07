'use client';

import { useState } from 'react';
import { Search, Plus, Trash2, X, MapPin, Edit2, Check } from 'lucide-react';
import styles from './Pacientes.module.css';
import { createPatient, cancelPatient, schedulePatient, updatePatient, markPatientAsCompleted, confirmPaciente } from '@/app/actions';
import DoctorVoucherCard from '@/components/DoctorVoucherCard';
import { useRouter } from 'next/navigation';

export default function PacientesClient({ 
  initialPacientes, procedures, clinics, locations, doctors, currentUserId, currentUserRole 
}: { 
  initialPacientes: any[], procedures: any[], clinics: any[], locations: any[], doctors: any[], currentUserId: string, currentUserRole: string 
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPacienteId, setSelectedPacienteId] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState('');
  const [senha, setSenha] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleLocalId, setScheduleLocalId] = useState('');
  const [scheduleDoctorId, setScheduleDoctorId] = useState('');
  const [scheduleData, setScheduleData] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [nome, setNome] = useState('');
  const [prontuario, setProntuario] = useState('');
  const [lateralidade, setLateralidade] = useState('OD');
  const [procedimento, setProcedimento] = useState('');
  const [valor, setValor] = useState('');
  const [solicitingClinicId, setSolicitingClinicId] = useState('');

  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [editPatientData, setEditPatientData] = useState<any>({});

  const filteredPacientes = initialPacientes.filter(p => {
    const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase()) || p.prontuario.includes(searchTerm);
    const matchesStatus = filterStatus ? p.status === filterStatus : true;
    
    let matchesMonth = true;
    let matchesDate = true;

    if (filterMonth && p.dataAgendamento) {
      const pMonth = new Date(p.dataAgendamento).toISOString().slice(0, 7); // YYYY-MM
      matchesMonth = pMonth === filterMonth;
    } else if (filterMonth) {
      matchesMonth = false;
    }

    if (filterDate && p.dataAgendamento) {
      const pDate = new Date(p.dataAgendamento).toISOString().split('T')[0];
      matchesDate = pDate === filterDate;
    } else if (filterDate) {
      matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesMonth && matchesDate;
  });

  const startEditPatient = (p: any) => {
    setEditingPatientId(p.id);
    let dateStr = '';
    if (p.dataAgendamento) {
      dateStr = new Date(p.dataAgendamento).toISOString().split('T')[0];
    }
    setEditPatientData({
      nome: p.nome,
      prontuario: p.prontuario,
      lateralidade: p.lateralidade,
      procedimento: p.procedimento,
      valor: p.valor,
      solicitingClinicId: p.solicitingClinicId || '',
      executionLocationId: p.executionLocationId || '',
      executingDoctorId: p.executingDoctorId || '',
      dataAgendamento: dateStr
    });
  };

  const handleMarkCompleted = async (id: string) => {
    try {
      await markPatientAsCompleted(id);
    } catch (err) {
      alert("Erro ao marcar como realizado.");
    }
  };

  const handleConfirm = async (id: string) => {
    try {
      await confirmPaciente(id);
    } catch (err) {
      alert("Erro ao confirmar paciente.");
    }
  };

  const saveEditPatient = async () => {
    if (!editingPatientId) return;
    try {
      await updatePatient(editingPatientId, editPatientData);
      setEditingPatientId(null);
    } catch (err) {
      alert("Erro ao salvar paciente.");
    }
  };

  const openDeleteModal = (id: string) => {
    setSelectedPacienteId(id);
    setIsDeleteModalOpen(true);
    setJustificativa('');
    setSenha('');
  };

  const openScheduleModal = (paciente: any) => {
    setSelectedPacienteId(paciente.id);
    setIsScheduleModalOpen(true);
    setScheduleLocalId(paciente.executionLocationId || '');
    setScheduleDoctorId(paciente.executingDoctorId || '');
    if (paciente.dataAgendamento) {
      setScheduleData(new Date(paciente.dataAgendamento).toISOString().split('T')[0]);
    } else {
      setScheduleData('');
    }
  };

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!justificativa || !senha || !selectedPacienteId) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, password: senha })
      });
      if (!res.ok) {
        alert('Senha incorreta!');
        setIsDeleting(false);
        return;
      }
      await cancelPatient(selectedPacienteId, justificativa, currentUserId);
      setIsDeleteModalOpen(false);
    } catch (err) {
      alert('Erro ao cancelar paciente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitingClinicId) {
      alert("Selecione a clínica solicitante.");
      return;
    }
    setIsSaving(true);
    try {
      await createPatient({
        nome, prontuario, lateralidade, procedimento, valor, solicitingClinicId
      }, currentUserId);
      setIsNewModalOpen(false);
      setNome(''); setProntuario(''); setLateralidade('OD'); setProcedimento(''); setValor(''); setSolicitingClinicId('');
    } catch (err) {
      alert('Erro ao salvar paciente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleLocalId || !scheduleData || !selectedPacienteId) return;
    setIsScheduling(true);
    try {
      await schedulePatient(selectedPacienteId, scheduleLocalId, scheduleData, scheduleDoctorId || undefined);
      setIsScheduleModalOpen(false);
    } catch (err) {
      alert('Erro ao agendar paciente.');
    } finally {
      setIsScheduling(false);
    }
  };

  const handleProcedureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedName = e.target.value;
    setProcedimento(selectedName);
    const proc = procedures.find((p: any) => p.name === selectedName);
    setValor(proc ? proc.price : '');
  };

  const canApprove = currentUserRole === 'ADMIN' || currentUserRole === 'MEDICO';

  const filteredLocations = scheduleDoctorId ? locations.filter((loc: any) => {
    const doc = doctors.find((d: any) => d.id === scheduleDoctorId);
    return doc?.executionLocations?.some((dl: any) => dl.locationId === loc.id);
  }) : locations;

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <div className={styles.searchBar}>
          <Search size={20} className={styles.searchIcon} />
          <input type="text" placeholder="Buscar por nome ou prontuário..." className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ width: 'auto', minWidth: '130px' }}>
            <option value="">Status: Todos</option>
            <option value="Agendado">Agendado</option>
            <option value="No Aguardo">No Aguardo</option>
            <option value="Realizado">Realizado</option>
            <option value="Cancelado">Cancelado</option>
          </select>
          
          <input 
            type="month" 
            className="form-input" 
            value={filterMonth} 
            onChange={e => { setFilterMonth(e.target.value); setFilterDate(''); }}
            title="Filtrar por Mês"
            style={{ width: 'auto' }}
          />

          <input 
            type="date" 
            className="form-input" 
            value={filterDate} 
            onChange={e => { setFilterDate(e.target.value); setFilterMonth(''); }}
            title="Filtrar por Dia Específico"
            style={{ width: 'auto' }}
          />
        </div>

        <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
          <Plus size={18} />
          <span>Novo Agendamento</span>
        </button>
      </div>

      {currentUserRole === 'MEDICO' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {filteredPacientes.map(paciente => (
            <DoctorVoucherCard 
              key={paciente.id} 
              paciente={paciente} 
              currentUserId={currentUserId} 
              isAdmin={false}
              onUpdate={() => router.refresh()}
              onSchedule={() => openScheduleModal(paciente)}
            />
          ))}
          {filteredPacientes.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
              Nenhum paciente encontrado para os filtros selecionados.
            </div>
          )}
        </div>
      ) : (
        <div className={`glass-panel ${styles.tableContainer}`}>
      <div className="table-responsive">
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Prontuário</th>
              <th>Lado</th>
              <th>Procedimento</th>
              <th>Clínica Solicitante</th>
              <th>Local / Médico</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredPacientes.map((paciente) => (
              <tr key={paciente.id} onDoubleClick={() => {
                if (paciente.status !== 'Cancelado') {
                  startEditPatient(paciente);
                }
              }}>
                {editingPatientId === paciente.id ? (
                  <>
                    <td>
                      <input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editPatientData.nome} onChange={e => setEditPatientData({...editPatientData, nome: e.target.value})} disabled={currentUserRole === 'MEDICO'} />
                    </td>
                    <td>
                      <input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editPatientData.prontuario} onChange={e => setEditPatientData({...editPatientData, prontuario: e.target.value})} disabled={currentUserRole === 'MEDICO'} />
                    </td>
                    <td>
                      <select className="form-select" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editPatientData.lateralidade} onChange={e => setEditPatientData({...editPatientData, lateralidade: e.target.value})} disabled={currentUserRole === 'MEDICO'}>
                        <option value="OD">OD</option>
                        <option value="OE">OE</option>
                      </select>
                    </td>
                    <td>
                      <select className="form-select" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editPatientData.procedimento} onChange={e => {
                        const selProc = procedures.find(x => x.name === e.target.value);
                        setEditPatientData({
                          ...editPatientData, 
                          procedimento: e.target.value,
                          valor: selProc ? selProc.price : editPatientData.valor
                        });
                      }} disabled={currentUserRole === 'MEDICO'}>
                        <option value="">Selecione...</option>
                        {procedures.map((proc: any) => (
                          <option key={proc.id} value={proc.name}>{proc.name}</option>
                        ))}
                      </select>
                      <input type="text" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem', marginTop: '4px'}} value={editPatientData.valor} onChange={e => setEditPatientData({...editPatientData, valor: e.target.value})} disabled={currentUserRole !== 'ADMIN'} />
                    </td>
                    <td>
                      <select className="form-select" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editPatientData.solicitingClinicId} onChange={e => setEditPatientData({...editPatientData, solicitingClinicId: e.target.value})} disabled={currentUserRole === 'MEDICO'}>
                        <option value="">Nenhuma</option>
                        {clinics.map((c: any) => (
                          <option key={c.id} value={c.id}>{c.nome}</option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <select className="form-select" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editPatientData.executingDoctorId || ''} onChange={e => setEditPatientData({...editPatientData, executingDoctorId: e.target.value})} disabled={currentUserRole === 'MEDICO'}>
                          <option value="">Selecione Médico...</option>
                          {doctors.map((d: any) => (
                            <option key={d.id} value={d.id}>{d.nome}</option>
                          ))}
                        </select>
                        <select className="form-select" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editPatientData.executionLocationId || ''} onChange={e => setEditPatientData({...editPatientData, executionLocationId: e.target.value})} disabled={currentUserRole === 'MEDICO'}>
                          <option value="">Selecione Local...</option>
                          {locations.map((l: any) => (
                            <option key={l.id} value={l.id}>{l.nome}</option>
                          ))}
                        </select>
                        <input type="date" className="form-input" style={{padding:'0.4rem', fontSize:'0.85rem'}} value={editPatientData.dataAgendamento || ''} onChange={e => setEditPatientData({...editPatientData, dataAgendamento: e.target.value})} disabled={currentUserRole === 'MEDICO'} />
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${
                        paciente.status === 'Agendado' ? 'badge-scheduled' :
                        paciente.status === 'Cancelado' ? 'badge-cancelled' : 'badge-pending'
                      }`}>
                        {paciente.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className={styles.actionBtn} style={{color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)'}} onClick={saveEditPatient}><Check size={18} /></button>
                        <button className={styles.actionBtn} style={{color: 'var(--text-tertiary)', background: 'rgba(0,0,0, 0.05)'}} onClick={() => setEditingPatientId(null)}><X size={18} /></button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td className={styles.fontMedium}>{paciente.nome}</td>
                    <td>#{paciente.prontuario}</td>
                    <td>{paciente.lateralidade}</td>
                    <td>{paciente.procedimento} <span style={{fontSize: '0.8rem', color: 'var(--text-secondary)'}}>({paciente.valor})</span></td>
                    <td>{paciente.solicitingClinic?.nome || '-'}</td>
                    <td>
                      {paciente.executionLocation?.nome ? (
                        <div style={{fontSize: '0.85rem'}}>
                          <strong>{paciente.executionLocation.nome}</strong><br/>
                          {paciente.executingDoctor?.nome && <span style={{color: 'var(--text-secondary)'}}>Médico: {paciente.executingDoctor.nome}<br/></span>}
                          <small>{new Date(paciente.dataAgendamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</small>
                        </div>
                      ) : '-'}
                    </td>
                    <td>
                      <span className={`badge ${
                        paciente.status === 'Agendado' ? 'badge-scheduled' :
                        paciente.status === 'Cancelado' ? 'badge-cancelled' : 'badge-pending'
                      }`}>
                        {paciente.status}
                      </span>
                      {paciente.status === 'Agendado' && (
                        <div style={{ marginTop: '0.25rem', fontSize: '0.75rem', fontWeight: 600, color: paciente.pacienteConfirmado ? 'var(--success-color)' : 'var(--warning-color)' }}>
                          {paciente.pacienteConfirmado ? '✓ Confirmado' : '⚠ Pendente de Confirmação'}
                        </div>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {paciente.status !== 'Cancelado' && (
                          <button className={styles.actionBtn} style={{color: 'var(--navy-blue)', background: 'rgba(5, 10, 31, 0.05)'}} title="Editar Paciente" onClick={() => startEditPatient(paciente)}>
                            <Edit2 size={18} />
                          </button>
                        )}
                        {paciente.status === 'Agendado' && (
                          <>
                            {!paciente.pacienteConfirmado && (
                              <button className={styles.actionBtn} style={{ color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)' }} title="Confirmar Presença do Paciente" onClick={() => handleConfirm(paciente.id)}>
                                <Check size={18} />
                              </button>
                            )}
                            <button className={styles.actionBtn} style={{ color: 'var(--warning-color)', background: 'rgba(245, 158, 11, 0.1)' }} title="Reagendar" onClick={() => openScheduleModal(paciente)}>
                              <MapPin size={18} />
                            </button>
                          </>
                        )}
                        {paciente.status === 'Agendado' && (currentUserRole === 'ADMIN' || currentUserRole === 'MEDICO') && (
                          <button className={styles.actionBtn} style={{ color: 'var(--success-color)', background: 'rgba(16, 185, 129, 0.1)' }} title="Marcar como Realizado" onClick={() => handleMarkCompleted(paciente.id)}>
                            <Check size={18} />
                          </button>
                        )}
                        {paciente.status === 'No Aguardo' && canApprove && (
                          <button className={styles.actionBtn} style={{ color: 'var(--primary-color)', background: 'rgba(59, 130, 246, 0.1)' }} title="Agendar Local" onClick={() => openScheduleModal(paciente)}>
                            <MapPin size={18} />
                          </button>
                        )}
                        {paciente.status !== 'Cancelado' && currentUserRole !== 'MEDICO' && (
                          <button className={styles.actionBtn} title="Cancelar" onClick={() => openDeleteModal(paciente.id)}>
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filteredPacientes.length === 0 && (
              <tr><td colSpan={8} className={styles.emptyState}>Nenhum registro encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      </div>
      )}

      {isScheduleModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modal}`}>
            <div className={styles.modalHeader}>
              <h3>Agendar Local e Data</h3>
              <button className={styles.closeBtn} onClick={() => setIsScheduleModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSchedule} className={styles.modalBody}>
              <div className="form-group">
                <label className="form-label">Local de Execução</label>
                <select className="form-select" required value={scheduleLocalId} onChange={(e) => setScheduleLocalId(e.target.value)}>
                  <option value="">Selecione o local...</option>
                  {filteredLocations.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>{loc.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Médico Executor (opcional)</label>
                <select className="form-select" value={scheduleDoctorId} onChange={(e) => setScheduleDoctorId(e.target.value)}>
                  <option value="">Nenhum / A definir</option>
                  {doctors?.map((doc: any) => (
                    <option key={doc.id} value={doc.id}>{doc.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data do Procedimento</label>
                <input type="date" className="form-input" required value={scheduleData} onChange={(e) => setScheduleData(e.target.value)} />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setIsScheduleModalOpen(false)} disabled={isScheduling}>Voltar</button>
                <button type="submit" className="btn btn-primary" disabled={isScheduling}>{isScheduling ? 'Agendando...' : 'Confirmar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modal}`}>
            <div className={styles.modalHeader}>
              <h3>Justificar Cancelamento</h3>
              <button className={styles.closeBtn} onClick={() => setIsDeleteModalOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleDelete} className={styles.modalBody}>
              <div className="form-group">
                <label className="form-label">Justificativa</label>
                <textarea className="form-input" rows={3} required value={justificativa} onChange={(e) => setJustificativa(e.target.value)} placeholder="Motivo do cancelamento..."></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">Sua Senha</label>
                <input type="password" className="form-input" required value={senha} onChange={(e) => setSenha(e.target.value)} />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setIsDeleteModalOpen(false)} disabled={isDeleting}>Voltar</button>
                <button type="submit" className="btn btn-danger" disabled={isDeleting}>{isDeleting ? 'Cancelando...' : 'Confirmar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNewModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modal}`}>
            <div className={styles.modalHeader}>
              <h3>Nova Solicitação</h3>
              <button className={styles.closeBtn} onClick={() => setIsNewModalOpen(false)}><X size={20} /></button>
            </div>
            <form className={styles.modalBody} onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Clínica Solicitante</label>
                <select className="form-select" required value={solicitingClinicId} onChange={e => setSolicitingClinicId(e.target.value)}>
                  <option value="">Selecione sua clínica...</option>
                  {clinics.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.nome}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" className="form-input" required value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Prontuário</label>
                <input type="text" className="form-input" required value={prontuario} onChange={e => setProntuario(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Lateralidade</label>
                <select className="form-select" required value={lateralidade} onChange={e => setLateralidade(e.target.value)}>
                  <option value="OD">Olho Direito (OD)</option>
                  <option value="OE">Olho Esquerdo (OE)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Procedimento Proposto</label>
                <select className="form-select" required value={procedimento} onChange={handleProcedureChange}>
                  <option value="">Selecione o procedimento...</option>
                  {procedures.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Valor (Automático)</label>
                <input type="text" className="form-input" readOnly value={valor} style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }} />
              </div>
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setIsNewModalOpen(false)} disabled={isSaving}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={isSaving || !procedimento}>
                  {isSaving ? 'Enviando...' : 'Solicitar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
