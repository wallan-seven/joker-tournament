'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

const MODALIDADES = ['Todos', 'Truco', 'Canastra', 'Cacheta', '66'];

const STATUS_STYLE = {
  'Inscrições Abertas': { bg: '#dcfce7', color: '#16a34a' },
  'Em Andamento': { bg: '#fef9c3', color: '#ca8a04' },
  'Finalizado': { bg: '#f3f4f6', color: '#6b7280' },
};

export default function HomePage() {
  const [torneios, setTorneios] = useState([]);
  const [stats, setStats] = useState(null);
  const [modalidade, setModalidade] = useState('Todos');
  const [carregando, setCarregando] = useState(true);

  async function carregar() {
    setCarregando(true);
    try {
      const [t, s] = await Promise.all([api.listarTorneios(modalidade), api.dashboard()]);
      setTorneios(t);
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [modalidade]);

  async function excluir(id) {
    if (!confirm('Excluir este torneio?')) return;
    await api.excluirTorneio(id);
    carregar();
  }

  return (
    <AppLayout>
      <div className={styles.topbar}>
        <div>
          <h1>Dashboard</h1>
          <p>Bem-vindo ao painel administrativo</p>
        </div>
        <Link href="/torneios/novo" className={styles.btnNovo}>
          <i className="fa-solid fa-plus"></i> Novo Torneio
        </Link>
      </div>

      {stats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <i className="fa-solid fa-trophy" style={{color:'#0d6efd'}}></i>
            <div>
              <span>{stats.totalTorneios}</span>
              <p>Total de Torneios</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <i className="fa-solid fa-fire" style={{color:'#f39c12'}}></i>
            <div>
              <span>{stats.torneiosAtivos}</span>
              <p>Torneios Ativos</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <i className="fa-solid fa-users" style={{color:'#2ecc71'}}></i>
            <div>
              <span>{stats.totalJogadores}</span>
              <p>Jogadores</p>
            </div>
          </div>
          <div className={styles.statCard}>
            <i className="fa-solid fa-id-card" style={{color:'#ff2d4f'}}></i>
            <div>
              <span>{stats.totalInscritos}</span>
              <p>Inscrições</p>
            </div>
          </div>
        </div>
      )}

      <section className={styles.filtros}>
        <h3>Filtrar por modalidade</h3>
        <div className={styles.botoesFiltro}>
          {MODALIDADES.map((m) => (
            <button
              key={m}
              className={`${styles.btnFiltro} ${modalidade === m ? styles.ativo : ''}`}
              onClick={() => setModalidade(m)}
            >
              {m}
            </button>
          ))}
        </div>
      </section>

      {carregando ? (
        <p className={styles.loading}>Carregando...</p>
      ) : torneios.length === 0 ? (
        <div className={styles.vazio}>
          <i className="fa-solid fa-face-sad-tear"></i>
          <p>Nenhum torneio encontrado.</p>
          <Link href="/torneios/novo">Criar primeiro torneio</Link>
        </div>
      ) : (
        <div className={styles.cards}>
          {torneios.map((t) => {
            const st = STATUS_STYLE[t.status] || STATUS_STYLE['Finalizado'];
            return (
              <div key={t.id} className={styles.card}>
                <span className={styles.status} style={{ background: st.bg, color: st.color }}>
                  {t.status}
                </span>
                <h2>{t.nome}</h2>
                <div className={styles.info}>
                  <p><i className="fa-solid fa-calendar"></i> {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR')}</p>
                  <p><i className="fa-solid fa-user-group"></i> {t.inscritos}/{t.max_participantes}</p>
                </div>
                <div className={styles.detalhes}>
                  <div>
                    <small>Modalidade</small>
                    <strong>{t.modalidade}</strong>
                  </div>
                  <div>
                    <small>Formato</small>
                    <strong>{t.formato}</strong>
                  </div>
                </div>
                <div className={styles.acoes}>
                  <Link href={`/torneios/${t.id}`} className={styles.btnVer}>
                    Ver Detalhes
                  </Link>
                  <Link href={`/torneios/${t.id}?editar=1`} className={styles.btnEditar}>
                    <i className="fa-solid fa-pen"></i>
                  </Link>
                  <button className={styles.btnExcluir} onClick={() => excluir(t.id)}>
                    <i className="fa-solid fa-trash"></i>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}
