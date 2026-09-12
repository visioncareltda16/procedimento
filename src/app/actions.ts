'use server';

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// --- PACIENTES ---

export async function getPatients(userId?: string, userRole?: string) {
  let whereClause: any = {};
  
  if (userRole === 'CAPTADOR' && userId) {
    const userClinics = await prisma.userClinic.findMany({ where: { userId } });
    const clinicIds = userClinics.map(uc => uc.clinicId);
    whereClause.OR = [
      { solicitingClinicId: { in: clinicIds } },
      { requesterId: userId }
    ];
  } else if (userRole === 'MEDICO' && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.executingDoctorId) {
      whereClause.OR = [
        { executingDoctorId: user.executingDoctorId },
        { requesterId: userId }
      ];
    } else {
      whereClause.requesterId = userId;
    }
  }

  const patients = await prisma.patient.findMany({
    where: whereClause,
    orderBy: { createdAt: 'desc' },
    include: { 
      requester: true,
      solicitingClinic: true,
      executionLocation: true,
      executingDoctor: true,
      executedBy: true
    }
  });
  return patients;
}

export async function createPatient(data: { nome: string, prontuario: string, lateralidade: string, procedimento: string, valor: string, solicitingClinicId: string }, requesterId: string) {
  const patient = await prisma.patient.create({
    data: {
      nome: data.nome,
      prontuario: data.prontuario,
      lateralidade: data.lateralidade,
      procedimento: data.procedimento,
      valor: data.valor,
      status: "No Aguardo",
      solicitingClinicId: data.solicitingClinicId || null,
      requesterId: requesterId
    },
    include: { solicitingClinic: true }
  });

  // Notify all MEDICO and ADMIN users
  const medicos = await prisma.user.findMany({ where: { role: { in: ['ADMIN', 'MEDICO'] } } });
  for (const medico of medicos) {
    await prisma.notification.create({
      data: {
        userId: medico.id,
        message: `Novo procedimento solicitado por ${patient.solicitingClinic?.nome || 'Clínica'}: ${patient.procedimento} para ${patient.nome}.`
      }
    });
  }
  
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pacientes');
  return patient;
}

export async function updatePatient(id: string, data: { nome: string, prontuario: string, lateralidade: string, procedimento: string, valor: string, solicitingClinicId: string, executionLocationId?: string, dataAgendamento?: string, executingDoctorId?: string }) {
  const updateData: any = {
    nome: data.nome,
    prontuario: data.prontuario,
    lateralidade: data.lateralidade,
    procedimento: data.procedimento,
    valor: data.valor,
    solicitingClinicId: data.solicitingClinicId || null,
  };
  if (data.executingDoctorId !== undefined) {
    updateData.executingDoctorId = data.executingDoctorId || null;
  }
  if (data.executionLocationId !== undefined) {
    updateData.executionLocationId = data.executionLocationId || null;
  }
  if (data.dataAgendamento !== undefined) {
    updateData.dataAgendamento = data.dataAgendamento ? new Date(data.dataAgendamento + 'T12:00:00Z') : null;
  }
  
  const currentPatient = await prisma.patient.findUnique({ where: { id } });

  if (updateData.executionLocationId && updateData.dataAgendamento) {
    if (currentPatient?.status !== 'Cancelado') {
      updateData.status = 'Agendado';
    }
    if (
      currentPatient?.dataAgendamento?.toISOString() !== updateData.dataAgendamento?.toISOString() ||
      currentPatient?.executionLocationId !== updateData.executionLocationId ||
      currentPatient?.executingDoctorId !== updateData.executingDoctorId
    ) {
      updateData.pacienteConfirmado = false;
    }
  } else if (data.executionLocationId !== undefined || data.dataAgendamento !== undefined) {
    // If the user modified these fields and one of them is missing, downgrade to "No Aguardo"
    if (currentPatient?.status === 'Agendado' && (!updateData.executionLocationId || !updateData.dataAgendamento)) {
      updateData.status = 'No Aguardo';
      updateData.pacienteConfirmado = false;
    }
  }

  const patient = await prisma.patient.update({
    where: { id },
    data: updateData
  });

  if (updateData.executingDoctorId && updateData.executingDoctorId !== currentPatient?.executingDoctorId) {
    const medicos = await prisma.user.findMany({ where: { executingDoctorId: updateData.executingDoctorId } });
    for (const medico of medicos) {
      await prisma.notification.create({
        data: {
          userId: medico.id,
          message: `Você foi designado para um novo procedimento: ${updateData.procedimento || currentPatient?.procedimento} para ${updateData.nome || currentPatient?.nome}. Acesse seu painel para agendar a data e o local.`
        }
      });
    }
  }
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pacientes');
  return patient;
}

export async function schedulePatient(patientId: string, executionLocationId: string, dataAgendamentoStr: string, executingDoctorId?: string) {
  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: { 
      executionLocationId, 
      executingDoctorId,
      dataAgendamento: new Date(dataAgendamentoStr + 'T12:00:00Z'),
      status: 'Agendado',
      pacienteConfirmado: false
    },
    include: { executionLocation: true, solicitingClinic: true, executingDoctor: true }
  });

  // Notificar todos os captadores que pertencem à clinica solicitante
  if (patient.solicitingClinicId) {
    const userClinics = await prisma.userClinic.findMany({
      where: { clinicId: patient.solicitingClinicId }
    });
    const captadorIds = userClinics.map(uc => uc.userId);

    for (const cid of captadorIds) {
      await prisma.notification.create({
        data: {
          userId: cid,
          message: `Agendado! O paciente ${patient.nome} realizará o procedimento na ${patient.executionLocation?.nome} dia ${new Date(dataAgendamentoStr).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}.`
        }
      });
    }
  }

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pacientes');
  return patient;
}

export async function confirmPaciente(patientId: string) {
  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: { pacienteConfirmado: true }
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pacientes');
  return patient;
}

export async function undoConfirmPaciente(patientId: string) {
  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: { pacienteConfirmado: false }
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pacientes');
  return patient;
}

export async function markPatientAsCompleted(patientId: string, userId: string) {
  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: { 
      status: 'Realizado',
      executedAt: new Date(),
      executedById: userId
    }
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pacientes');
  return patient;
}

export async function undoPatientCompletion(patientId: string) {
  const patient = await prisma.patient.update({
    where: { id: patientId },
    data: { status: 'Agendado' }
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pacientes');
  return patient;
}

export async function cancelPatient(patientId: string, justificativa: string, userId: string) {
  await prisma.patient.update({
    where: { id: patientId },
    data: { status: "Cancelado" }
  });

  await prisma.cancellationLog.create({
    data: {
      patientId,
      userId,
      justificativa
    }
  });

  revalidatePath('/dashboard');
  revalidatePath('/dashboard/pacientes');
  revalidatePath('/dashboard/relatorios');
}

export async function getDashboardStats(userId?: string, userRole?: string) {
  let whereClause: any = {};
  
  if (userRole === 'CAPTADOR' && userId) {
    const userClinics = await prisma.userClinic.findMany({ where: { userId } });
    const clinicIds = userClinics.map(uc => uc.clinicId);
    whereClause.OR = [
      { solicitingClinicId: { in: clinicIds } },
      { requesterId: userId }
    ];
  } else if (userRole === 'MEDICO' && userId) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.executingDoctorId) {
      whereClause.OR = [
        { executingDoctorId: user.executingDoctorId },
        { requesterId: userId }
      ];
    } else {
      whereClause.requesterId = userId;
    }
  }

  const patients = await prisma.patient.findMany({
    where: whereClause,
    include: { executionLocation: true }
  });
  
  const total = patients.length;
  const agendados = patients.filter(p => p.status === 'Agendado').length;
  const aguardo = patients.filter(p => p.status === 'No Aguardo').length;
  const cancelados = patients.filter(p => p.status === 'Cancelado').length;
  
  const locais: Record<string, number> = {};
  patients.forEach(p => {
    if (p.status !== 'Cancelado' && p.executionLocation) {
      const locNome = p.executionLocation.nome;
      locais[locNome] = (locais[locNome] || 0) + 1;
    }
  });
  const dataLocais = Object.keys(locais).map(key => ({ name: key, value: locais[key] }));

  const procedimentos: Record<string, number> = {};
  patients.forEach(p => {
    if (p.status !== 'Cancelado') {
      procedimentos[p.procedimento] = (procedimentos[p.procedimento] || 0) + 1;
    }
  });
  const dataProcedimentos = Object.keys(procedimentos).map(key => ({ name: key, value: procedimentos[key] }));

  return {
    total, agendados, aguardo, cancelados, dataLocais, dataProcedimentos
  };
}

export async function getRelatoriosData() {
  const cancelamentos = await prisma.cancellationLog.findMany({
    include: {
      patient: true,
      user: true
    },
    orderBy: { createdAt: 'desc' }
  });

  const realizados = await prisma.patient.findMany({
    where: { status: 'Realizado' },
    include: {
      executingDoctor: true,
      solicitingClinic: true
    },
    orderBy: { updatedAt: 'desc' }
  });

  const doctors = await prisma.executingDoctor.findMany({
    orderBy: { nome: 'asc' }
  });

  return { cancelamentos, realizados, doctors };
}

// --- CONFIGURACOES - PROCEDIMENTOS ---

export async function getProcedures() {
  return await prisma.procedure.findMany();
}

export async function createProcedure(name: string, price: string, sigla?: string, lateralidade?: string) {
  const procedure = await prisma.procedure.create({
    data: { name, price, sigla, lateralidade }
  });
  revalidatePath('/dashboard/configuracoes');
  return procedure;
}

export async function updateProcedure(id: string, name: string, price: string, sigla?: string, lateralidade?: string) {
  const p = await prisma.procedure.update({
    where: { id },
    data: { name, price, sigla, lateralidade }
  });
  revalidatePath('/dashboard/configuracoes');
  return p;
}

export async function deleteProcedure(id: string) {
  await prisma.procedure.delete({ where: { id } });
  revalidatePath('/dashboard/configuracoes');
}

// --- CONFIGURACOES - CLINICAS SOLICITANTES ---

export async function getSolicitingClinics() {
  return await prisma.solicitingClinic.findMany();
}

export async function createSolicitingClinic(data: { nome: string, endereco: string, cep: string, contato: string, observacao: string }) {
  const c = await prisma.solicitingClinic.create({ data });
  revalidatePath('/dashboard/configuracoes');
  return c;
}

export async function updateSolicitingClinic(id: string, data: { nome: string, endereco: string, cep: string, contato: string, observacao: string }) {
  const c = await prisma.solicitingClinic.update({ where: { id }, data });
  revalidatePath('/dashboard/configuracoes');
  return c;
}

export async function deleteSolicitingClinic(id: string) {
  await prisma.solicitingClinic.delete({ where: { id } });
  revalidatePath('/dashboard/configuracoes');
}

// --- CONFIGURACOES - LOCAIS DE EXECUÇÃO ---

export async function getExecutionLocations() {
  return await prisma.executionLocation.findMany({
    include: { locationFees: true }
  });
}

export async function createExecutionLocation(data: { nome: string, endereco: string, logoUrl: string, cep: string, contato: string, observacao: string }) {
  const loc = await prisma.executionLocation.create({ data });
  revalidatePath('/dashboard/configuracoes');
  return loc;
}

export async function updateExecutionLocation(id: string, data: { nome: string, endereco: string, logoUrl: string, cep: string, contato: string, observacao: string }) {
  const loc = await prisma.executionLocation.update({ where: { id }, data });
  revalidatePath('/dashboard/configuracoes');
  return loc;
}

export async function deleteExecutionLocation(id: string) {
  await prisma.executionLocation.delete({ where: { id } });
  revalidatePath('/dashboard/configuracoes');
}

// --- NOTIFICACOES ---

export async function getNotifications(userId: string) {
  return await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50 // limit to last 50
  });
}

export async function markNotificationAsRead(id: string) {
  await prisma.notification.update({
    where: { id },
    data: { read: true }
  });
  revalidatePath('/dashboard');
}

export async function markAllNotificationsAsRead(userId: string) {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true }
  });
  revalidatePath('/dashboard');
}

// --- USUARIOS / CAPTADORES ---

export async function createProvisionalUser(data: any) {
  // Check if exists
  const exists = await prisma.user.findUnique({ where: { email: data.email } });
  if (exists) throw new Error("Email já cadastrado.");

  const hashed = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      password: hashed,
      role: data.role || 'CAPTADOR',
      status: 'APPROVED'
    }
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/configuracoes');
  return user;
}

export async function getUsers() {
  return await prisma.user.findMany({
    include: { userClinics: { include: { clinic: true } } }
  });
}

export async function approveUser(id: string, role: string) {
  await prisma.user.update({
    where: { id },
    data: { status: 'APPROVED', role }
  });
  revalidatePath('/dashboard/configuracoes');
}

export async function assignUserToClinic(userId: string, clinicId: string) {
  await prisma.userClinic.create({
    data: { userId, clinicId }
  });
  revalidatePath('/dashboard/configuracoes');
}

export async function removeUserFromClinic(userId: string, clinicId: string) {
  await prisma.userClinic.deleteMany({
    where: { userId, clinicId }
  });
  revalidatePath('/dashboard/configuracoes');
}

// --- MÉDICOS EXECUTORES ---

export async function getExecutingDoctors() {
  return await prisma.executingDoctor.findMany({
    include: { 
      repasses: { include: { procedure: true } },
      executionLocations: { include: { location: true } }
    }
  });
}

export async function assignLocationToDoctor(doctorId: string, locationId: string) {
  await prisma.doctorExecutionLocation.create({
    data: { doctorId, locationId }
  });
  revalidatePath('/dashboard/configuracoes');
}

export async function removeLocationFromDoctor(doctorId: string, locationId: string) {
  await prisma.doctorExecutionLocation.deleteMany({
    where: { doctorId, locationId }
  });
  revalidatePath('/dashboard/configuracoes');
}

export async function createExecutingDoctor(nome: string, crm?: string, contato?: string) {
  const doc = await prisma.executingDoctor.create({
    data: { nome, crm, contato }
  });
  revalidatePath('/dashboard/configuracoes');
  return doc;
}

export async function updateExecutingDoctor(id: string, nome: string, crm?: string, contato?: string) {
  const doc = await prisma.executingDoctor.update({
    where: { id },
    data: { nome, crm, contato }
  });
  revalidatePath('/dashboard/configuracoes');
  return doc;
}

export async function deleteExecutingDoctor(id: string) {
  await prisma.executingDoctor.delete({ where: { id } });
  revalidatePath('/dashboard/configuracoes');
}

// --- REPASSES E TAXAS ---

export async function upsertDoctorRepasse(doctorId: string, procedureId: string, valor: string) {
  const repasse = await prisma.doctorRepasse.upsert({
    where: { doctorId_procedureId: { doctorId, procedureId } },
    update: { valor },
    create: { doctorId, procedureId, valor }
  });
  revalidatePath('/dashboard/configuracoes');
  return repasse;
}

export async function upsertLocationFee(locationId: string, procedureId: string, valor: string) {
  const fee = await prisma.locationFee.upsert({
    where: { locationId_procedureId: { locationId, procedureId } },
    update: { valor },
    create: { locationId, procedureId, valor }
  });
  revalidatePath('/dashboard/configuracoes');
  return fee;
}

export async function getLocationFees(locationId: string) {
  return await prisma.locationFee.findMany({
    where: { locationId },
    include: { procedure: true }
  });
}

// --- CONFIGURACOES - USUARIOS ---
export async function updateUser(id: string, name: string, email: string, role: string) {
  const user = await prisma.user.update({
    where: { id },
    data: { name, email, role }
  });
  revalidatePath('/dashboard/configuracoes');
  return user;
}

export async function generateProvisionalPassword(id: string) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let tempPassword = '';
  for (let i = 0; i < 6; i++) {
    tempPassword += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const hashedPassword = await bcrypt.hash(tempPassword, 10);
  
  await prisma.user.update({
    where: { id },
    data: { password: hashedPassword }
  });
  return tempPassword;
}

export async function saveFcmToken(userId: string, token: string) {
  try {
    await prisma.fcmToken.upsert({
      where: { token },
      update: { userId },
      create: { token, userId }
    });
  } catch (err) {
    console.error("Failed to save FCM token", err);
  }
}

export async function getSystemSetting(key: string, defaultValue: string) {
  try {
    const setting = await prisma.systemSetting.findUnique({ where: { key } });
    return setting?.value || defaultValue;
  } catch (err) {
    console.error("Failed to get system setting", err);
    return defaultValue;
  }
}

export async function setSystemSetting(key: string, value: string) {
  try {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  } catch (err) {
    console.error("Failed to set system setting", err);
  }
}

export async function assignDoctorToUser(userId: string, executingDoctorId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { executingDoctorId }
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/configuracoes');
  return user;
}

export async function removeDoctorFromUser(userId: string) {
  const user = await prisma.user.update({
    where: { id: userId },
    data: { executingDoctorId: null }
  });
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/configuracoes');
  return user;
}
