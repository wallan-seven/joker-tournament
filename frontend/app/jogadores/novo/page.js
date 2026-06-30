'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

export default function NovoJogadorPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nome: '', apelido: '', telefone: '' });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      await api.criarJogador(form);
      router.push('/jogadores');
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  }

  return (
    <AppLayout>
      <div className={styles.header}>
        <Link href="/jogadores" className={styles.voltar}><i className="fa-solid fa-arrow-left"></i> Voltar</Link>
        <h1>Cadastrar Jogador</h1>
        <p>Adicione um novo participante</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {erro && <div className={styles.erro}>{erro}</div>}

          <div className={styles.campo}>
            <label>Nome Completo *</label>
            <input
              type="text"
              placeholder="Digite o nome do jogador"
              value={form.nome}
              onChange={e => setForm({...form, nome: e.target.value})}
              required
            />
          </div>

          <div className={styles.campo}>
            <label>Apelido <span>(opcional)</span></label>
            <input
              type="text"
              placeholder="Como é conhecido"
              value={form.apelido}
              onChange={e => setForm({...form, apelido: e.target.value})}
            />
          </div>

          <div className={styles.campo}>
            <label>Telefone <span>(opcional)</span></label>
            <input
              type="tel"
              placeholder="(00) 00000-0000"
              value={form.telefone}
              onChange={e => setForm({...form, telefone: e.target.value})}
            />
          </div>

          <button type="submit" disabled={salvando} className={styles.btnSalvar}>
            {salvando ? 'Cadastrando...' : <><i className="fa-solid fa-user-plus"></i> Cadastrar Jogador</>}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
