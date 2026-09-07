import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendPushNotification } from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  // Verificação de segurança: a Vercel envia um header especial para requisições do Cron
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Buscar pacientes agendados para hoje
    const patients = await prisma.patient.findMany({
      where: {
        status: 'Agendado',
      },
      include: {
        executingDoctor: true,
        requester: true,
      }
    });

    const todaysPatients = patients.filter(p => {
      if (!p.dataAgendamento) return false;
      const pDate = new Date(p.dataAgendamento).toISOString().split('T')[0];
      return pDate === todayStr;
    });

    // Aqui mapearemos quais usuários (médicos e captadores) precisam ser notificados
    const usersToNotify = new Set<string>();

    for (const pac of todaysPatients) {
      if (pac.executingDoctorId) {
        // Find user ID for this doctor if they have an account? 
        // Em nosso sistema, Medico é um "User" com role="MEDICO", mas ExecutingDoctor é uma tabela separada.
        // A vinculação do usuário Médico à tabela ExecutingDoctor pode não estar explicita no schema,
        // mas assumimos que o User.email pode bater, ou que o Captador será notificado.
        // Vamos notificar o captador (requester):
      }
      if (pac.requesterId) {
        usersToNotify.add(pac.requesterId);
      }
    }

    // Buscar os tokens de FCM desses usuários
    const fcmTokens = await prisma.fcmToken.findMany({
      where: {
        userId: { in: Array.from(usersToNotify) }
      }
    });

    let notificationsSent = 0;

    for (const tokenRecord of fcmTokens) {
      // Disparar o Push
      await sendPushNotification(tokenRecord.token, {
        title: 'Lembrete de Agendamentos',
        body: 'Você tem procedimentos agendados para hoje. Acesse o painel para conferir.',
        url: '/dashboard/pacientes'
      });
      notificationsSent++;
    }

    return NextResponse.json({ 
      success: true, 
      patientsFound: todaysPatients.length,
      notificationsSent
    });

  } catch (error) {
    console.error('Error in daily cron:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
