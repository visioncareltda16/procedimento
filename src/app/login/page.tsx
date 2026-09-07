'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Users, Lock, Mail } from 'lucide-react';
import styles from './Login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isLogin) {
      const res = await signIn('credentials', {
        redirect: false,
        email: email.trim(),
        password,
      });

      if (res?.error) {
        setError(res.error);
        setLoading(false);
      } else {
        router.push('/dashboard');
      }
    } else {
      // Registration flow
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, password })
        });
        
        const data = await res.json();
        
        if (!res.ok) {
          setError(data.error || 'Erro ao registrar');
        } else {
          // Após registrar com sucesso, tentar fazer login automático
          const loginRes = await signIn('credentials', {
            redirect: false,
            email,
            password,
          });
          
          if (loginRes?.error) {
             // Se for PENDING, o NextAuth retorna 'Access Denied'
             if (loginRes.error === 'AccessDenied') {
               setError('Conta criada com sucesso, mas pendente de aprovação pelo Administrador.');
             } else {
               setError(loginRes.error);
             }
          } else {
            router.push('/dashboard');
          }
        }
      } catch (err) {
        setError('Erro na comunicação com o servidor.');
      }
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={`glass-panel ${styles.loginBox} animate-fade-in`}>
        <div className={styles.logoContainer}>
          <div className={styles.logoIcon}>
            <Users size={32} color="var(--primary-color)" />
          </div>
          <h2 className={styles.logoText}>MedCad</h2>
        </div>

        <h3 className={styles.title}>{isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}</h3>
        <p className={styles.subtitle}>
          {isLogin ? 'Faça login para acessar o sistema.' : 'Preencha seus dados para solicitar acesso.'}
        </p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Nome Completo</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input 
                  type="text" 
                  className={`form-input ${styles.inputWithIcon}`} 
                  required 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">E-mail</label>
            <div className={styles.inputWrapper}>
              <Mail size={18} className={styles.inputIcon} />
              <input 
                type="email" 
                className={`form-input ${styles.inputWithIcon}`} 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Senha</label>
            <div className={styles.inputWrapper}>
              <Lock size={18} className={styles.inputIcon} />
              <input 
                type="password" 
                className={`form-input ${styles.inputWithIcon}`} 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>

          <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={loading}>
            {loading ? 'Processando...' : (isLogin ? 'Entrar no Sistema' : 'Solicitar Acesso')}
          </button>
        </form>

        <div className={styles.toggleText}>
          {isLogin ? 'Ainda não tem conta? ' : 'Já tem uma conta? '}
          <button type="button" className={styles.toggleBtn} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Solicite acesso' : 'Faça login'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Small workaround for the User icon missing import above
import { User } from 'lucide-react';
