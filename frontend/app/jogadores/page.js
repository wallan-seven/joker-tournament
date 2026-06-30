'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

export default function JogadoresPage() {
  const [jogadores, setJogadores] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const js = await api.listarJogadores(busca);
      setJogadores(js);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(carregar, 300);
    return () => clearTimeout(t);
  }, [busca]);

  async function excluir(id) {
    if (!confirm('Excluir este jogador?')) return;
    await api.excluirJogador(id);
    carregar();
  }

  function abrirEditar(j) {
    setEditando(j.id);
    setFormEdit({ nome: j.nome, apelido: j.apelido, telefone: j.telefone });
  }

  async function salvarEditar(id) {
    setSalvando(true);
    try {
      await api.editarJogador(id, formEdit);
      setEditando(null);
      carregar();
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AppLayout>
      <div className={styles.topbar}>
        <div>
          <h1>Jogadores Cadastrados</h1>
          <p>Consulte e gerencie os participantes</p>
        </div>
        <Link href="/jogadores/novo" className={styles.btnNovo}>
          <i className="fa-solid fa-user-plus"></i> Novo Jogador
        </Link>
      </div>

      <div className={styles.buscaBox}>
        <i className="fa-solid fa-magnifying-glass"></i>
        <input
          type="text"
          placeholder="Pesquisar jogador pelo nome ou apelido..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {carregando ? (
        <p className={styles.loading}>Carregando...</p>
      ) : jogadores.length === 0 ? (
        <div className={styles.vazio}>
          <i className="fa-solid fa-users-slash"></i>
          <p>Nenhum jogador encontrado.</p>
          <Link href="/jogadores/novo">Cadastrar primeiro jogador</Link>
        </div>
      ) : (
        <div className={styles.grid}>
          {jogadores.map(j => (
            <div key={j.id} className={styles.card}>
              {editando === j.id ? (
                <div className={styles.editForm}>
                  <input
                    value={formEdit.nome || ''}
                    onChange={e => setFormEdit({...formEdit, nome: e.target.value})}
                    placeholder="Nome"
                  />
                  <input
                    value={formEdit.apelido || ''}
                    onChange={e => setFormEdit({...formEdit, apelido: e.target.value})}
                    placeholder="Apelido"
                  />
                  <input
                    value={formEdit.telefone || ''}
                    onChange={e => setFormEdit({...formEdit, telefone: e.target.value})}
                    placeholder="Telefone"
                  />
                  <div className={styles.editAcoes}>
                    <button onClick={() => salvarEditar(j.id)} disabled={salvando} className={styles.btnSalvar}>
                      {salvando ? '...' : 'Salvar'}
                    </button>
                    <button onClick={() => setEditando(null)} className={styles.btnCancelar}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className={styles.avatar}>
                    {j.nome.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.info}>
                    <h3>{j.nome}</h3>
                    {j.apelido && <p className={styles.apelido}>"{j.apelido}"</p>}
                    {j.telefone && (
                      <p className={styles.tel}>
                        <i className="fa-solid fa-phone"></i> {j.telefone}
                      </p>
                    )}
                  </div>
                  <div className={styles.acoes}>
                    <button onClick={() => abrirEditar(j)} className={styles.btnEditar}>
                      <i className="fa-solid fa-pen"></i> Editar
                    </button>
                    <button onClick={() => excluir(j.id)} className={styles.btnExcluir}>
                      <i className="fa-solid fa-trash"></i>
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
