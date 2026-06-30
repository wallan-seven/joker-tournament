'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import styles from './login.module.css';

export default function LoginPage() {
  const { login } = useAuth();
  const [usuario, setUsuario] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      await login(usuario, senha);
    } catch (err) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <img src="/logo.png" alt="Joker Tournament" className={styles.logo} />
        <h1 className={styles.title}>JOKER</h1>
        <p className={styles.subtitle}>Painel Administrativo</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          {erro && <div className={styles.erro}>{erro}</div>}

          <div className={styles.campo}>
            <label>Usuário</label>
            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div className={styles.campo}>
            <label>Senha</label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button type="submit" disabled={carregando} className={styles.btnLogin}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

          <p className={styles.hint}>
            <i className="fa-solid fa-circle-info"></i> Padrão: admin / admin123
          </p>
        </form>
      </div>
    </div>
  );
}
