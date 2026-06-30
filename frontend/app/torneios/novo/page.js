'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

export default function NovoTorneioPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nome: '', modalidade: 'Truco', formato: 'Individual',
    data: '', max_participantes: '8', status: 'Inscrições Abertas',
  });
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');
    setSalvando(true);
    try {
      const novo = await api.criarTorneio({ ...form, max_participantes: Number(form.max_participantes) });
      router.push(`/torneios/${novo.id}`);
    } catch (err) {
      setErro(err.message);
      setSalvando(false);
    }
  }

  return (
    <AppLayout>
      <div className={styles.header}>
        <Link href="/" className={styles.voltar}><i className="fa-solid fa-arrow-left"></i> Voltar</Link>
        <h1>Cadastrar Torneio</h1>
        <p>Crie um novo torneio de baralho</p>
      </div>

      <div className={styles.card}>
        <form onSubmit={handleSubmit} className={styles.form}>
          {erro && <div className={styles.erro}>{erro}</div>}

          <div className={styles.campo}>
            <label>Nome do Torneio</label>
            <input
              type="text"
              placeholder="Ex: Torneio Municipal de Truco"
              value={form.nome}
              onChange={e => set('nome', e.target.value)}
              required
            />
          </div>

          <div className={styles.linha}>
            <div className={styles.campo}>
              <label>Modalidade</label>
              <select value={form.modalidade} onChange={e => set('modalidade', e.target.value)}>
                <option>Truco</option>
                <option>Canastra</option>
                <option>Cacheta</option>
                <option>66</option>
              </select>
            </div>
            <div className={styles.campo}>
              <label>Formato</label>
              <select value={form.formato} onChange={e => set('formato', e.target.value)}>
                <option>Individual</option>
                <option>Dupla</option>
              </select>
            </div>
          </div>

          <div className={styles.campo}>
            <label>Data do Torneio</label>
            <input type="date" value={form.data} onChange={e => set('data', e.target.value)} required />
          </div>

          <div className={styles.campo}>
            <label>Quantidade de Participantes</label>
            <div className={styles.radioGroup}>
              {['4', '8', '16'].map(v => (
                <label key={v} className={`${styles.radioLabel} ${form.max_participantes === v ? styles.radioAtivo : ''}`}>
                  <input
                    type="radio"
                    name="participantes"
                    value={v}
                    checked={form.max_participantes === v}
                    onChange={e => set('max_participantes', e.target.value)}
                  />
                  {v} Participantes
                </label>
              ))}
            </div>
          </div>

          <div className={styles.campo}>
            <label>Status</label>
            <select value={form.status} onChange={e => set('status', e.target.value)}>
              <option>Inscrições Abertas</option>
              <option>Em Andamento</option>
              <option>Finalizado</option>
            </select>
          </div>

          <button type="submit" disabled={salvando} className={styles.btnSalvar}>
            {salvando ? 'Criando...' : <><i className="fa-solid fa-plus"></i> Criar Torneio</>}
          </button>
        </form>
      </div>
    </AppLayout>
  );
}
