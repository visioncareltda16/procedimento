import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function GET(request: Request) {
  try {
    // Verifica se já existe algum admin
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    });

    if (existingAdmin) {
      return NextResponse.json({ message: 'Admin já existe', email: existingAdmin.email });
    }

    // Cria o admin inicial
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Administrador Vercel',
        email: 'admin@vision.com',
        password: hashedPassword,
        role: 'ADMIN'
      }
    });

    return NextResponse.json({ 
      message: 'Admin criado com sucesso!', 
      email: admin.email,
      senha: 'admin123'
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
