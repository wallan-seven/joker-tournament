'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { api } from '@/lib/api';
import Link from 'next/link';
import styles from './page.module.css';

export default function TorneioPage() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const modoEditar = searchParams.get('editar') === '1';

  const [torneio, setTorneio] = useState(null);
  const [jogadores, setJogadores] = useState([]);
  const [form, setForm] = useState({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState('');
  const [jogadorSelecionado, setJogadorSelecionado] = useState('');

  async function carregar() {
    try {
      const [t, js] = await Promise.all([api.obterTorneio(id), api.listarJogadores()]);
      setTorneio(t);
      setForm({ nome: t.nome, modalidade: t.modalidade, formato: t.formato, data: t.data, max_participantes: t.max_participantes, status: t.status });
      setJogadores(js);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, [id]);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await api.editarTorneio(id, { ...form, max_participantes: Number(form.max_participantes) });
      setMsg('Torneio atualizado!');
      carregar();
      setTimeout(() => setMsg(''), 3000);
    } catch (err) {
      setMsg('Erro: ' + err.message);
    } finally {
      setSalvando(false);
    }
  }

  async function inscrever() {
    if (!jogadorSelecionado) return;
    try {
      await api.inscreverJogador(id, jogadorSelecionado);
      setJogadorSelecionado('');
      carregar();
    } catch (err) {
      alert(err.message);
    }
  }

  async function removerInscricao(jogadorId) {
    if (!confirm('Remover inscrição?')) return;
    await api.removerInscricao(id, jogadorId);
    carregar();
  }

  async function excluir() {
    if (!confirm('Excluir este torneio definitivamente?')) return;
    await api.excluirTorneio(id);
    router.push('/');
  }

  if (carregando) return <AppLayout><p style={{padding:'60px',textAlign:'center',color:'#9ca3af'}}>Carregando...</p></AppLayout>;
  if (!torneio) return <AppLayout><p>Torneio não encontrado.</p></AppLayout>;

  const jogadoresInscritos = torneio.jogadores || [];
  const idsInscritos = jogadoresInscritos.map(j => j.id);
  const jogadoresDisponiveis = jogadores.filter(j => !idsInscritos.includes(j.id));

  return (
    <AppLayout>
      <div className={styles.header}>
        <div>
          <Link href="/" className={styles.voltar}><i className="fa-solid fa-arrow-left"></i> Voltar</Link>
          <h1>{torneio.nome}</h1>
        </div>
        <button onClick={excluir} className={styles.btnExcluir}>
          <i className="fa-solid fa-trash"></i> Excluir Torneio
        </button>
      </div>

      <div className={styles.grid}>
        <div className={styles.col}>
          <div className={styles.card}>
            <h2>Dados do Torneio</h2>
            {msg && <div className={msg.startsWith('Erro') ? styles.erro : styles.sucesso}>{msg}</div>}
            <form onSubmit={salvar} className={styles.form}>
              <div className={styles.campo}>
                <label>Nome</label>
                <input value={form.nome || ''} onChange={e => setForm({...form, nome: e.target.value})} required />
              </div>
              <div className={styles.linha}>
                <div className={styles.campo}>
                  <label>Modalidade</label>
                  <select value={form.modalidade || ''} onChange={e => setForm({...form, modalidade: e.target.value})}>
                    <option>Truco</option>
                    <option>Canastra</option>
                    <option>Cacheta</option>
                    <option>66</option>
                  </select>
                </div>
                <div className={styles.campo}>
                  <label>Formato</label>
                  <select value={form.formato || ''} onChange={e => setForm({...form, formato: e.target.value})}>
                    <option>Individual</option>
                    <option>Dupla</option>
                  </select>
                </div>
              </div>
              <div className={styles.linha}>
                <div className={styles.campo}>
                  <label>Data</label>
                  <input type="date" value={form.data || ''} onChange={e => setForm({...form, data: e.target.value})} required />
                </div>
                <div className={styles.campo}>
                  <label>Vagas</label>
                  <select value={form.max_participantes || ''} onChange={e => setForm({...form, max_participantes: e.target.value})}>
                    <option value="4">4</option>
                    <option value="8">8</option>
                    <option value="16">16</option>
                  </select>
                </div>
              </div>
              <div className={styles.campo}>
                <label>Status</label>
                <select value={form.status || ''} onChange={e => setForm({...form, status: e.target.value})}>
                  <option>Inscrições Abertas</option>
                  <option>Em Andamento</option>
                  <option>Finalizado</option>
                </select>
              </div>
              <button type="submit" disabled={salvando} className={styles.btnSalvar}>
                {salvando ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </form>
          </div>
        </div>

        <div className={styles.col}>
          <div className={styles.card}>
            <h2>Jogadores Inscritos ({jogadoresInscritos.length}/{torneio.max_participantes})</h2>

            <div className={styles.inscricaoForm}>
              <select value={jogadorSelecionado} onChange={e => setJogadorSelecionado(e.target.value)}>
                <option value="">Selecionar jogador...</option>
                {jogadoresDisponiveis.map(j => (
                  <option key={j.id} value={j.id}>{j.nome}{j.apelido ? ` (${j.apelido})` : ''}</option>
                ))}
              </select>
              <button onClick={inscrever} className={styles.btnInscrever} disabled={!jogadorSelecionado}>
                <i className="fa-solid fa-user-plus"></i> Inscrever
              </button>
            </div>

            {jogadoresInscritos.length === 0 ? (
              <p className={styles.semJogadores}>Nenhum jogador inscrito ainda.</p>
            ) : (
              <ul className={styles.listaJogadores}>
                {jogadoresInscritos.map(j => (
                  <li key={j.id} className={styles.itemJogador}>
                    <div>
                      <strong>{j.nome}</strong>
                      {j.apelido && <span> ({j.apelido})</span>}
                    </div>
                    <button onClick={() => removerInscricao(j.id)} className={styles.btnRemover}>
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
