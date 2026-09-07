'use client';

import { useState } from 'react';
import { Download, FileText, CheckCircle, Calendar, User as UserIcon } from 'lucide-react';
import styles from './Relatorios.module.css';

export default function RelatoriosClient({ initialData }: { initialData: any }) {
  const { cancelamentos, realizados, doctors } = initialData;
  const [activeTab, setActiveTab] = useState<'realizados' | 'cancelados'>('realizados');
  
  const [filterDoctor, setFilterDoctor] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterDate, setFilterDate] = useState('');

  const handleExportPDF = () => {
    import('html2pdf.js').then((html2pdf) => {
      const element = document.getElementById('report-content');
      if (!element) return;
      
      const opt = {
        margin:       0.5,
        filename:     `relatorio_${activeTab}_${new Date().getTime()}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'landscape' as const }
      };

      html2pdf.default().set(opt).from(element).save();
    });
  };

  const clearFilters = () => {
    setFilterDoctor('');
    setFilterMonth('');
    setFilterDate('');
  };

  const getFilteredRealizados = () => {
    return realizados.filter((item: any) => {
      let pass = true;
      if (filterDoctor && item.executingDoctorId !== filterDoctor) pass = false;
      if (item.dataAgendamento) {
        const itemDateStr = new Date(item.dataAgendamento).toISOString().split('T')[0];
        if (filterDate && itemDateStr !== filterDate) pass = false;
        if (filterMonth && !itemDateStr.startsWith(filterMonth)) pass = false;
      } else {
        if (filterDate || filterMonth) pass = false;
      }
      return pass;
    });
  };

  const getFilteredCancelados = () => {
    return cancelamentos.filter((item: any) => {
      let pass = true;
      if (filterDoctor && item.patient?.executingDoctorId !== filterDoctor) pass = false;
      if (item.createdAt) {
        const itemDateStr = new Date(item.createdAt).toISOString().split('T')[0];
        if (filterDate && itemDateStr !== filterDate) pass = false;
        if (filterMonth && !itemDateStr.startsWith(filterMonth)) pass = false;
      }
      return pass;
    });
  };

  const filteredRealizados = getFilteredRealizados();
  const filteredCancelados = getFilteredCancelados();

  return (
    <div className="animate-fade-in">
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Relatórios do Sistema</h2>
          <p className={styles.subtitle}>Gere e exporte documentos de procedimentos filtrados.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button 
          className={`btn ${activeTab === 'realizados' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('realizados')}
        >
          <CheckCircle size={18} /> Procedimentos Realizados
        </button>
        <button 
          className={`btn ${activeTab === 'cancelados' ? 'btn-primary' : 'btn-outline'}`}
          style={activeTab === 'cancelados' ? { backgroundColor: 'var(--danger-color)', borderColor: 'var(--danger-color)' } : {}}
          onClick={() => setActiveTab('cancelados')}
        >
          <FileText size={18} /> Procedimentos Cancelados
        </button>
      </div>

      {/* FILTROS */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
           Filtros
        </h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <label className="form-label"><UserIcon size={14}/> Médico Executor</label>
            <select className="form-select" value={filterDoctor} onChange={e => setFilterDoctor(e.target.value)}>
              <option value="">Todos os Médicos</option>
              {doctors.map((d: any) => (
                <option key={d.id} value={d.id}>{d.nome}</option>
              ))}
            </select>
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label className="form-label"><Calendar size={14}/> Mês</label>
            <input type="month" className="form-input" value={filterMonth} onChange={e => setFilterMonth(e.target.value)} />
          </div>
          <div style={{ flex: '1', minWidth: '150px' }}>
            <label className="form-label"><Calendar size={14}/> Data Específica</label>
            <input type="date" className="form-input" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={clearFilters}>Limpar</button>
            <button className="btn btn-primary" onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Download size={18} /> Exportar PDF
            </button>
          </div>
        </div>
      </div>

      {/* RESULTADOS EM TELA (NÃO PRINTÁVEIS, APENAS PREVIEW SE NECESSÁRIO OU PRINTÁVEIS JÁ NA TELA) */}
      <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
          Pré-visualização: {activeTab === 'realizados' ? 'Procedimentos Realizados' : 'Cancelamentos'}
        </h3>
        <div id="report-content" style={{ padding: '1rem', background: '#fff', color: '#000' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem', borderBottom: '2px solid #eee', paddingBottom: '1rem' }}>
            <h2>MedCad - Relatório de {activeTab === 'realizados' ? 'Procedimentos Realizados' : 'Cancelamentos'}</h2>
            <p style={{ color: '#555' }}>Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            {(filterDoctor || filterMonth || filterDate) && (
              <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: '#666' }}>
                Filtros aplicados: 
                {filterDoctor && ` Médico: ${doctors.find((d:any) => d.id === filterDoctor)?.nome}`}
                {filterMonth && ` | Mês: ${filterMonth}`}
                {filterDate && ` | Data: ${filterDate}`}
              </p>
            )}
          </div>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Data</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Paciente</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Procedimento</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Clínica / Médico</th>
                <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>{activeTab === 'realizados' ? 'Status' : 'Justificativa / Usuário'}</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'realizados' ? (
                filteredRealizados.length > 0 ? (
                  filteredRealizados.map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem' }}>{item.dataAgendamento ? new Date(item.dataAgendamento).toLocaleDateString('pt-BR') : '-'}</td>
                      <td style={{ padding: '0.75rem' }}><strong>{item.nome}</strong><br/><span style={{ fontSize:'0.8rem', color:'#666' }}>Pront: {item.prontuario}</span></td>
                      <td style={{ padding: '0.75rem' }}>{item.procedimento} ({item.lateralidade})</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div><strong>Clínica:</strong> {item.solicitingClinic?.nome || '-'}</div>
                        <div><strong>Médico:</strong> {item.executingDoctor?.nome || '-'}</div>
                      </td>
                      <td style={{ padding: '0.75rem', color: 'green', fontWeight: 'bold' }}>Realizado</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Nenhum procedimento encontrado com os filtros atuais.</td></tr>
                )
              ) : (
                filteredCancelados.length > 0 ? (
                  filteredCancelados.map((item: any) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem' }}>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '0.75rem' }}><strong>{item.patient?.nome}</strong><br/><span style={{ fontSize:'0.8rem', color:'#666' }}>Pront: {item.patient?.prontuario}</span></td>
                      <td style={{ padding: '0.75rem' }}>{item.patient?.procedimento} ({item.patient?.lateralidade})</td>
                      <td style={{ padding: '0.75rem' }}>-</td>
                      <td style={{ padding: '0.75rem' }}>
                        <div style={{ color: '#dc2626', fontStyle: 'italic', marginBottom:'4px' }}>"{item.justificativa}"</div>
                        <div style={{ fontSize: '0.8rem', color: '#555' }}>Por: {item.user?.name || 'Desconhecido'}</div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: '#666' }}>Nenhum cancelamento encontrado com os filtros atuais.</td></tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
