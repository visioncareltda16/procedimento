import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Todos os campos são obrigatórios." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "E-mail já está em uso." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Se for o e-mail do admin, já nasce aprovado e como ADMIN
    const isAdmin = email === "leonardoamaral.vision@gmail.com";
    const status = isAdmin ? "APPROVED" : "PENDING";
    const role = isAdmin ? "ADMIN" : "USER";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        status,
        role,
      },
    });

    return NextResponse.json({
      message: "Usuário registrado com sucesso.",
      user: { id: user.id, email: user.email, status: user.status },
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Erro ao registrar usuário." },
      { status: 500 }
    );
  }
}
