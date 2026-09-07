'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import styles from './Dashboard.module.css';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#ec4899'];

import { Calendar, User, Clock, Bell } from 'lucide-react';
import { useEffect, useState } from 'react';
import { requestForToken, onMessageListener } from '@/lib/firebaseClient';
import { saveFcmToken } from '@/app/actions';
import { useSession } from 'next-auth/react';

export default function DashboardClient({ stats, patients }: { stats: any, patients: any[] }) {
  const { total, agendados, aguardo, cancelados, dataLocais, dataProcedimentos } = stats;
  const { data: session } = useSession();
  
  const currentUserId = (session?.user as any)?.id;

  useEffect(() => {
    if (currentUserId) {
      requestForToken().then((token) => {
        if (token) {
          saveFcmToken(currentUserId, token);
        }
      }).catch(console.error);
    }
  }, [currentUserId]);

  const todayStr = new Date().toISOString().split('T')[0];
  const todaysAgenda = (patients || []).filter(p => {
    if (!p.dataAgendamento || p.status !== 'Agendado') return false;
    const pDate = new Date(p.dataAgendamento).toISOString().split('T')[0];
    return pDate === todayStr;
  });

  const scheduledByDoctor: Record<string, any[]> = {};
  const completedPatients: any[] = [];
  
  (patients || []).forEach(p => {
    if (p.status === 'Agendado') {
      const docName = p.executingDoctor?.nome || 'Sem Médico Atribuído';
      if (!scheduledByDoctor[docName]) scheduledByDoctor[docName] = [];
      scheduledByDoctor[docName].push(p);
    } else if (p.status === 'Realizado') {
      completedPatients.push(p);
    }
  });

  return (
    <div className={`${styles.dashboardContainer} animate-fade-in`}>
      <div className={styles.statsGrid}>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className={styles.statTitle}>Total Pacientes</h3>
          <p className={styles.statValue}>{total}</p>
          <span className={styles.statTrend}>Registrados no sistema</span>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className={styles.statTitle}>Agendados</h3>
          <p className={styles.statValue}>{agendados}</p>
          <span className={styles.statTrend}>{aguardo} aguardando</span>
        </div>
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className={styles.statTitle}>Cancelamentos</h3>
          <p className={styles.statValue}>{cancelados}</p>
          <span className={styles.statTrend} style={{ color: 'var(--danger-color)' }}>Atenção requerida</span>
        </div>
      </div>

      {/* TWO COLUMN LAYOUT: Left (Agenda+Agendados) / Right (Realizados) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem', alignItems: 'start' }}>
        
        {/* LEFT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* AGENDA DE HOJE */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <Calendar size={20} color="var(--primary-color)" /> Agenda de Hoje
            </h3>
        
        {todaysAgenda.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {todaysAgenda.map(pac => (
              <div key={pac.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} /> {pac.nome}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Procedimento:</strong> {pac.procedimento} ({pac.lateralidade})<br/>
                  <strong>Local:</strong> {pac.executionLocation?.nome || '-'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhum procedimento agendado para hoje.</p>
        )}
        </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* PROCEDIMENTOS REALIZADOS */}
          <div className="glass-panel" style={{ padding: '1.5rem', height: '100%' }}>
            <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <User size={20} color="var(--success-color)" /> Procedimentos Realizados
            </h3>
        
        {completedPatients.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {completedPatients.map(pac => (
              <div key={pac.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                  {pac.nome}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Procedimento:</strong> {pac.procedimento} ({pac.lateralidade})<br/>
                  <strong>Médico:</strong> {pac.executingDoctor?.nome || 'Desconhecido'}<br/>
                  <span style={{ color: 'var(--success-color)', fontWeight: 600 }}>✓ Realizado e Checado</span>
                </div>
              </div>
            ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhum procedimento realizado.</p>
          )}
        </div>
        </div>
      </div>

      {/* FULL WIDTH - PACIENTES AGENDADOS POR MÉDICO */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
        <h3 className={styles.chartTitle} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <User size={20} color="var(--primary-color)" /> Pacientes Agendados por Médico
        </h3>
      
      {Object.keys(scheduledByDoctor).length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '1.5rem' }}>
          {Object.keys(scheduledByDoctor).map(docName => (
            <div key={docName}>
              <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>{docName}</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {scheduledByDoctor[docName].map(pac => (
                  <div key={pac.id} style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                      {pac.nome}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <strong>Procedimento:</strong> {pac.procedimento} ({pac.lateralidade})<br/>
                      <strong>Data:</strong> {pac.dataAgendamento ? new Date(pac.dataAgendamento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : 'Não definida'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhum paciente agendado.</p>
      )}
      </div>

      <div className={styles.chartsGrid}>
        <div className={`glass-panel ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>Agendamentos por Local</h3>
          <div className={styles.chartWrapper}>
            {dataLocais.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataLocais}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {dataLocais.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    itemStyle={{ color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyChart}>Sem dados de locais.</p>
            )}
          </div>
          <div className={styles.chartLegend}>
            {dataLocais.map((item: any, i: number) => (
              <div key={i} className={styles.legendItem}>
                <span className={styles.legendColor} style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={`glass-panel ${styles.chartCard}`}>
          <h3 className={styles.chartTitle}>Top Procedimentos</h3>
          <div className={styles.chartWrapper}>
            {dataProcedimentos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataProcedimentos} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-color)" />
                  <XAxis type="number" stroke="var(--text-secondary)" />
                  <YAxis dataKey="name" type="category" width={100} stroke="var(--text-secondary)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                  />
                  <Bar dataKey="value" fill="var(--primary-color)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className={styles.emptyChart}>Sem dados de procedimentos.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
