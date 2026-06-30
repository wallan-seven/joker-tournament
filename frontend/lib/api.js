const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('jt_token');
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.erro || 'Erro na requisição');
  }

  return data;
}

export const api = {
  // Auth
  login: (usuario, senha) =>
    apiFetch('/login', { method: 'POST', body: JSON.stringify({ usuario, senha }) }),

  // Dashboard
  dashboard: () => apiFetch('/dashboard'),

  // Jogadores
  listarJogadores: (busca = '') =>
    apiFetch(`/jogadores${busca ? `?busca=${encodeURIComponent(busca)}` : ''}`),
  obterJogador: (id) => apiFetch(`/jogadores/${id}`),
  criarJogador: (dados) =>
    apiFetch('/jogadores', { method: 'POST', body: JSON.stringify(dados) }),
  editarJogador: (id, dados) =>
    apiFetch(`/jogadores/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluirJogador: (id) =>
    apiFetch(`/jogadores/${id}`, { method: 'DELETE' }),

  // Torneios
  listarTorneios: (modalidade = '') =>
    apiFetch(`/torneios${modalidade && modalidade !== 'Todos' ? `?modalidade=${encodeURIComponent(modalidade)}` : ''}`),
  obterTorneio: (id) => apiFetch(`/torneios/${id}`),
  criarTorneio: (dados) =>
    apiFetch('/torneios', { method: 'POST', body: JSON.stringify(dados) }),
  editarTorneio: (id, dados) =>
    apiFetch(`/torneios/${id}`, { method: 'PUT', body: JSON.stringify(dados) }),
  excluirTorneio: (id) =>
    apiFetch(`/torneios/${id}`, { method: 'DELETE' }),

  // Inscrições
  inscreverJogador: (torneioId, jogadorId) =>
    apiFetch(`/torneios/${torneioId}/inscricoes`, {
      method: 'POST',
      body: JSON.stringify({ jogador_id: jogadorId }),
    }),
  removerInscricao: (torneioId, jogadorId) =>
    apiFetch(`/torneios/${torneioId}/inscricoes/${jogadorId}`, { method: 'DELETE' }),
};
