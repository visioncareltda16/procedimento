import React, { useState } from 'react';
import { User, Eye, Check, Calendar, MapPin, Undo2, ThumbsUp } from 'lucide-react';
import { markPatientAsCompleted, undoPatientCompletion, confirmPaciente } from '@/app/actions';

export default function DoctorVoucherCard({ 
  paciente, 
  currentUserId,
  isAdmin,
  onUpdate,
  onSchedule
}: { 
  paciente: any, 
  currentUserId: string,
  isAdmin: boolean,
  onUpdate: () => void,
  onSchedule: () => void
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [senha, setSenha] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isCompleted = paciente.status === 'Realizado';
  const isWaiting = paciente.status === 'No Aguardo';
  
  // Calculate if within 30 minutes
  const updatedAt = new Date(paciente.updatedAt).getTime();
  const now = Date.now();
  const diffMinutes = (now - updatedAt) / (1000 * 60);
  const canUndo = isCompleted && (isAdmin || diffMinutes <= 30);

  const handleMarkCompleted = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senha) return;
    setIsVerifying(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, password: senha })
      });
      if (!res.ok) {
        setErrorMsg('Senha incorreta!');
        setIsVerifying(false);
        return;
      }
      await markPatientAsCompleted(paciente.id);
      setIsModalOpen(false);
      onUpdate();
    } catch (err) {
      setErrorMsg('Erro ao dar baixa.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUndo = async () => {
    if (confirm("Tem certeza que deseja desfazer a baixa deste paciente?")) {
      await undoPatientCompletion(paciente.id);
      onUpdate();
    }
  };

  const handleConfirm = async () => {
    try {
      await confirmPaciente(paciente.id);
      onUpdate();
    } catch (err) {
      alert("Erro ao confirmar paciente.");
    }
  };

  return (
    <>
      <div style={{
        background: isCompleted ? 'rgba(16, 185, 129, 0.05)' : 'var(--bg-secondary)',
        border: `1px solid ${isCompleted ? 'var(--success-color)' : 'var(--border-color)'}`,
        borderRadius: '12px',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {isCompleted && (
          <div style={{
            position: 'absolute',
            top: 0, right: 0,
            background: 'var(--success-color)',
            color: '#fff',
            padding: '0.2rem 1rem',
            borderBottomLeftRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            REALIZADO
          </div>
        )}
        {isWaiting && (
          <div style={{
            position: 'absolute',
            top: 0, right: 0,
            background: 'var(--warning-color)',
            color: '#fff',
            padding: '0.2rem 1rem',
            borderBottomLeftRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            NO AGUARDO
          </div>
        )}
        {!isCompleted && !isWaiting && (
          <div style={{
            position: 'absolute',
            top: 0, right: 0,
            background: paciente.pacienteConfirmado ? 'var(--success-color)' : 'var(--warning-color)',
            color: '#fff',
            padding: '0.2rem 1rem',
            borderBottomLeftRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            {paciente.pacienteConfirmado ? 'CONFIRMADO' : 'PENDENTE DE CONFIRMAÇÃO'}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} color="var(--primary-color)" /> {paciente.nome}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Prontuário: #{paciente.prontuario}</span>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-color)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
            {paciente.lateralidade}
          </div>
        </div>

        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px', border: '1px dashed var(--border-color)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Eye size={16} color="var(--primary-color)" /> {paciente.procedimento}
          </div>
          {paciente.dataAgendamento ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Calendar size={14} /> {new Date(paciente.dataAgendamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
            </div>
          ) : (
             <div style={{ fontSize: '0.85rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Calendar size={14} /> Data a definir
            </div>
          )}
          {paciente.executionLocation?.nome ? (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <MapPin size={14} /> {paciente.executionLocation.nome}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--danger-color)', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
              <MapPin size={14} /> Local a definir
            </div>
          )}
        </div>

        <div style={{ marginTop: 'auto', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {isWaiting && (
            <button 
              className="btn btn-primary" 
              style={{ flex: 1, minWidth: '120px', display: 'flex', justifyContent: 'center' }}
              onClick={onSchedule}
            >
              <Calendar size={18} /> Agendar
            </button>
          )}

          {!isCompleted && paciente.status === 'Agendado' && (
            <>
              {!paciente.pacienteConfirmado && (
                <button 
                  className="btn btn-outline" 
                  style={{ flex: 1, minWidth: '120px', display: 'flex', justifyContent: 'center', color: 'var(--success-color)', borderColor: 'var(--success-color)' }}
                  onClick={handleConfirm}
                >
                  <ThumbsUp size={18} /> Confirmar
                </button>
              )}
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, minWidth: '120px', display: 'flex', justifyContent: 'center', color: 'var(--warning-color)', borderColor: 'var(--warning-color)' }}
                onClick={onSchedule}
              >
                <MapPin size={18} /> Reagendar
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flex: 1, minWidth: '120px', display: 'flex', justifyContent: 'center', background: 'var(--success-color)' }}
                onClick={() => setIsModalOpen(true)}
              >
                <Check size={18} /> Baixa
              </button>
            </>
          )}

          {canUndo && (
            <button 
              className="btn btn-outline" 
              style={{ flex: 1, display: 'flex', justifyContent: 'center', color: 'var(--danger-color)', borderColor: 'var(--danger-color)' }}
              onClick={handleUndo}
            >
              <Undo2 size={18} /> Desfazer Baixa
            </button>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div className="glass-panel animate-fade-in" style={{ background: 'var(--bg-secondary)', padding: '2rem', width: '90%', maxWidth: '400px', borderRadius: '16px' }}>
            <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Check color="var(--success-color)" /> Confirmar Realização
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              Confirme com sua senha para dar baixa no procedimento de <strong>{paciente.nome}</strong>.
            </p>
            <form onSubmit={handleMarkCompleted} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Sua Senha</label>
                <input 
                  type="password" 
                  className="form-input" 
                  required 
                  value={senha} 
                  onChange={e => setSenha(e.target.value)} 
                  autoFocus
                />
              </div>
              {errorMsg && <div style={{ color: 'var(--danger-color)', fontSize: '0.85rem' }}>{errorMsg}</div>}
              
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-outline" onClick={() => { setIsModalOpen(false); setSenha(''); setErrorMsg(''); }}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--success-color)' }} disabled={isVerifying}>
                  {isVerifying ? 'Verificando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
