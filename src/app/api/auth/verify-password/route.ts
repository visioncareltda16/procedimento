import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, password } = await req.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: "Faltam parâmetros." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado." },
        { status: 404 }
      );
    }

    const isValid = await bcrypt.compare(password, user.password);

    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: "Senha incorreta." },
        { status: 401 }
      );
    }

  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 }
    );
  }
}
