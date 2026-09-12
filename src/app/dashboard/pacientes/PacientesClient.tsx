'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, Trash2, X, MapPin, Edit2, Check, ThumbsUp } from 'lucide-react';
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
  const [filterStatus, setFilterStatus] = useState<string[]>(['Agendado', 'No Aguardo']);
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDate, setFilterDate] = useState('');
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    const matchesStatus = filterStatus.length === 0 || filterStatus.includes(p.status);
    
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
      await markPatientAsCompleted(id, currentUserId);
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
      if (lateralidade === 'AMBOS') {
        await createPatient({
          nome, prontuario, lateralidade: 'OD', procedimento, valor, solicitingClinicId
        }, currentUserId);
        await createPatient({
          nome, prontuario, lateralidade: 'OE', procedimento, valor, solicitingClinicId
        }, currentUserId);
      } else {
        await createPatient({
          nome, prontuario, lateralidade, procedimento, valor, solicitingClinicId
        }, currentUserId);
      }
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

  const canApprove = currentUserRole?.toUpperCase() === 'ADMIN' || currentUserRole?.toUpperCase() === 'MEDICO';

  const filteredLocations = scheduleDoctorId ? (() => {
    const doc = doctors.find((d: any) => d.id === scheduleDoctorId);
    const linked = locations.filter((loc: any) => doc?.executionLocations?.some((dl: any) => dl.locationId === loc.id));
    return linked.length > 0 ? linked : locations;
  })() : locations;

  const filteredDoctors = scheduleLocalId ? (() => {
    const linked = doctors.filter((doc: any) => doc.executionLocations?.some((dl: any) => dl.locationId === scheduleLocalId));
    return linked.length > 0 ? linked : doctors;
  })() : doctors;

  return (
    <>
      <div className="animate-fade-in">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className={styles.searchBar}>
            <Search size={20} className={styles.searchIcon} />
            <input type="text" placeholder="Buscar por nome ou prontuário..." className="form-input" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          
          <button className="btn btn-primary" onClick={() => setIsNewModalOpen(true)}>
            <Plus size={18} />
            <span>Novo Agendamento</span>
          </button>
        </div>
        
        {/* Filters */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', background: 'var(--bg-secondary)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginRight: 'auto' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Filtrar Status:</span>
            {['Agendado', 'No Aguardo', 'Realizado', 'Cancelado'].map(status => (
              <label key={status} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--bg-tertiary)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                <input 
                  type="checkbox" 
                  checked={filterStatus.includes(status)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilterStatus([...filterStatus, status]);
                    } else {
                      setFilterStatus(filterStatus.filter(s => s !== status));
                    }
                  }}
                  style={{ accentColor: 'var(--primary-color)', width: '16px', height: '16px', cursor: 'pointer' }}
                />
                {status}
              </label>
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input 
              type="month" 
              className="form-input" 
              value={filterMonth} 
              onChange={e => { setFilterMonth(e.target.value); setFilterDate(''); }}
              title="Filtrar por Mês"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
            />
            <span style={{ color: 'var(--text-tertiary)' }}>ou</span>
            <input 
              type="date" 
              className="form-input" 
              value={filterDate} 
              onChange={e => { setFilterDate(e.target.value); setFilterMonth(''); }}
              title="Filtrar por Dia Específico"
              style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}
            />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem', marginTop: '1.5rem', alignItems: 'start' }}>
        {filteredPacientes.map(paciente => (
          <DoctorVoucherCard 
            key={paciente.id} 
            paciente={paciente} 
            currentUserId={currentUserId} 
            isAdmin={currentUserRole?.toUpperCase() === 'ADMIN'}
            onUpdate={() => router.refresh()}
            onSchedule={() => openScheduleModal(paciente)}
            onEdit={paciente.status !== 'Cancelado' ? () => startEditPatient(paciente) : undefined}
            onDelete={paciente.status !== 'Cancelado' ? () => openDeleteModal(paciente.id) : undefined}
            canApprove={canApprove}
          />
        ))}
        {filteredPacientes.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            Nenhum paciente encontrado para os filtros selecionados.
          </div>
        )}
      </div>
      </div>

      {mounted && editingPatientId !== null && createPortal(
        <div className={styles.modalOverlay}>
          <div className={`glass-panel ${styles.modal}`} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className={styles.modalHeader}>
              <h3>Editar Paciente</h3>
              <button className={styles.closeBtn} onClick={() => setEditingPatientId(null)}><X size={20} /></button>
            </div>
            <form className={styles.modalBody} onSubmit={(e) => { e.preventDefault(); saveEditPatient(); }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" className="form-input" required value={editPatientData.nome || ''} onChange={e => setEditPatientData({...editPatientData, nome: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Prontuário</label>
                <input type="text" className="form-input" required value={editPatientData.prontuario || ''} onChange={e => setEditPatientData({...editPatientData, prontuario: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Lateralidade</label>
                <select className="form-select" required value={editPatientData.lateralidade || ''} onChange={e => setEditPatientData({...editPatientData, lateralidade: e.target.value})}>
                  <option value="OD">Olho Direito (OD)</option>
                  <option value="OE">Olho Esquerdo (OE)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Procedimento</label>
                <select className="form-select" required value={editPatientData.procedimento || ''} onChange={e => {
                  const selProc = procedures.find((x: any) => x.name === e.target.value);
                  setEditPatientData({
                    ...editPatientData, 
                    procedimento: e.target.value,
                    valor: selProc ? selProc.price : editPatientData.valor
                  });
                }}>
                  <option value="">Selecione o procedimento...</option>
                  {procedures.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Valor</label>
                <input type="text" className="form-input" required value={editPatientData.valor || ''} onChange={e => setEditPatientData({...editPatientData, valor: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Clínica Solicitante</label>
                <select className="form-select" value={editPatientData.solicitingClinicId || ''} onChange={e => setEditPatientData({...editPatientData, solicitingClinicId: e.target.value})}>
                  <option value="">Nenhuma</option>
                  {clinics.map((c: any) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Médico Executor</label>
                <select className="form-select" value={editPatientData.executingDoctorId || ''} onChange={e => setEditPatientData({...editPatientData, executingDoctorId: e.target.value})}>
                  <option value="">Selecione Médico...</option>
                  {doctors.map((d: any) => <option key={d.id} value={d.id}>{d.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Local de Execução</label>
                <select className="form-select" value={editPatientData.executionLocationId || ''} onChange={e => setEditPatientData({...editPatientData, executionLocationId: e.target.value})}>
                  <option value="">Selecione Local...</option>
                  {locations.map((l: any) => <option key={l.id} value={l.id}>{l.nome}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Data Agendamento</label>
                <input type="date" className="form-input" value={editPatientData.dataAgendamento || ''} onChange={e => setEditPatientData({...editPatientData, dataAgendamento: e.target.value})} />
              </div>
              
              <div className={styles.modalFooter}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingPatientId(null)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Alterações</button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}

      {mounted && isScheduleModalOpen && createPortal(
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
                  {filteredDoctors.map((doc: any) => (
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
      , document.body)}

      {mounted && isDeleteModalOpen && createPortal(
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
      , document.body)}

      {mounted && isNewModalOpen && createPortal(
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
                  <option value="AMBOS">Ambos (OD e OE)</option>
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
      , document.body)}
    </>
  );
}
