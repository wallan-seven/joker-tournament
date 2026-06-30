const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'joker_tournament_secret_2024';
const DB_PATH = path.join(__dirname, 'database.sqlite');

app.use(cors());
app.use(express.json());

// ─── DB Setup ───────────────────────────────────────────────────────────────

let db;

async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      usuario TEXT UNIQUE NOT NULL,
      senha TEXT NOT NULL,
      criado_em TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS jogadores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      apelido TEXT,
      telefone TEXT,
      criado_em TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS torneios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      modalidade TEXT NOT NULL,
      formato TEXT NOT NULL,
      data TEXT NOT NULL,
      max_participantes INTEGER NOT NULL,
      status TEXT DEFAULT 'Inscrições Abertas',
      criado_em TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS inscricoes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      torneio_id INTEGER NOT NULL,
      jogador_id INTEGER NOT NULL,
      criado_em TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (torneio_id) REFERENCES torneios(id),
      FOREIGN KEY (jogador_id) REFERENCES jogadores(id),
      UNIQUE(torneio_id, jogador_id)
    )
  `);

  // Seed admin user
  const adminRes = db.exec("SELECT id FROM usuarios WHERE usuario = 'admin'");
  if (!adminRes.length || !adminRes[0].values.length) {
    const hash = bcrypt.hashSync('admin123', 10);
    db.run("INSERT INTO usuarios (usuario, senha) VALUES ('admin', ?)", [hash]);
  }

  saveDB();
  console.log('✅ Banco de dados inicializado');
}

function saveDB() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function query(sql, params = []) {
  const res = db.exec(sql, params);
  if (!res.length) return [];
  const { columns, values } = res[0];
  return values.map(row =>
    Object.fromEntries(columns.map((col, i) => [col, row[i]]))
  );
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDB();
}

// ─── Auth Middleware ─────────────────────────────────────────────────────────

function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ erro: 'Não autenticado' });
  const token = header.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido' });
  }
}

// ─── Auth Routes ─────────────────────────────────────────────────────────────

app.post('/api/login', (req, res) => {
  const { usuario, senha } = req.body;
  const rows = query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);
  if (!rows.length) return res.status(401).json({ erro: 'Usuário não encontrado' });
  const user = rows[0];
  if (!bcrypt.compareSync(senha, user.senha))
    return res.status(401).json({ erro: 'Senha incorreta' });
  const token = jwt.sign({ id: user.id, usuario: user.usuario }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token, usuario: user.usuario });
});

// ─── Jogadores CRUD ──────────────────────────────────────────────────────────

app.get('/api/jogadores', auth, (req, res) => {
  const { busca } = req.query;
  let sql = 'SELECT * FROM jogadores ORDER BY nome';
  let params = [];
  if (busca) {
    sql = 'SELECT * FROM jogadores WHERE nome LIKE ? OR apelido LIKE ? ORDER BY nome';
    params = [`%${busca}%`, `%${busca}%`];
  }
  res.json(query(sql, params));
});

app.get('/api/jogadores/:id', auth, (req, res) => {
  const rows = query('SELECT * FROM jogadores WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ erro: 'Jogador não encontrado' });
  res.json(rows[0]);
});

app.post('/api/jogadores', auth, (req, res) => {
  const { nome, apelido, telefone } = req.body;
  if (!nome) return res.status(400).json({ erro: 'Nome é obrigatório' });
  run('INSERT INTO jogadores (nome, apelido, telefone) VALUES (?, ?, ?)', [nome, apelido || '', telefone || '']);
  const rows = query('SELECT * FROM jogadores ORDER BY id DESC LIMIT 1');
  res.status(201).json(rows[0]);
});

app.put('/api/jogadores/:id', auth, (req, res) => {
  const { nome, apelido, telefone } = req.body;
  const rows = query('SELECT * FROM jogadores WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ erro: 'Jogador não encontrado' });
  run('UPDATE jogadores SET nome = ?, apelido = ?, telefone = ? WHERE id = ?',
    [nome || rows[0].nome, apelido ?? rows[0].apelido, telefone ?? rows[0].telefone, req.params.id]);
  res.json(query('SELECT * FROM jogadores WHERE id = ?', [req.params.id])[0]);
});

app.delete('/api/jogadores/:id', auth, (req, res) => {
  const rows = query('SELECT * FROM jogadores WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ erro: 'Jogador não encontrado' });
  run('DELETE FROM inscricoes WHERE jogador_id = ?', [req.params.id]);
  run('DELETE FROM jogadores WHERE id = ?', [req.params.id]);
  res.json({ mensagem: 'Jogador removido' });
});

// ─── Torneios CRUD ───────────────────────────────────────────────────────────

app.get('/api/torneios', auth, (req, res) => {
  const { modalidade } = req.query;
  let sql = `
    SELECT t.*, 
      (SELECT COUNT(*) FROM inscricoes i WHERE i.torneio_id = t.id) as inscritos
    FROM torneios t ORDER BY t.data
  `;
  let params = [];
  if (modalidade && modalidade !== 'Todos') {
    sql = `
      SELECT t.*, 
        (SELECT COUNT(*) FROM inscricoes i WHERE i.torneio_id = t.id) as inscritos
      FROM torneios t WHERE t.modalidade = ? ORDER BY t.data
    `;
    params = [modalidade];
  }
  res.json(query(sql, params));
});

app.get('/api/torneios/:id', auth, (req, res) => {
  const rows = query(`
    SELECT t.*, 
      (SELECT COUNT(*) FROM inscricoes i WHERE i.torneio_id = t.id) as inscritos
    FROM torneios t WHERE t.id = ?
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ erro: 'Torneio não encontrado' });
  const torneio = rows[0];
  torneio.jogadores = query(`
    SELECT j.* FROM jogadores j
    JOIN inscricoes i ON i.jogador_id = j.id
    WHERE i.torneio_id = ?
  `, [req.params.id]);
  res.json(torneio);
});

app.post('/api/torneios', auth, (req, res) => {
  const { nome, modalidade, formato, data, max_participantes, status } = req.body;
  if (!nome || !modalidade || !formato || !data || !max_participantes)
    return res.status(400).json({ erro: 'Campos obrigatórios faltando' });
  run('INSERT INTO torneios (nome, modalidade, formato, data, max_participantes, status) VALUES (?, ?, ?, ?, ?, ?)',
    [nome, modalidade, formato, data, max_participantes, status || 'Inscrições Abertas']);
  const rows = query('SELECT * FROM torneios ORDER BY id DESC LIMIT 1');
  res.status(201).json(rows[0]);
});

app.put('/api/torneios/:id', auth, (req, res) => {
  const rows = query('SELECT * FROM torneios WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ erro: 'Torneio não encontrado' });
  const t = rows[0];
  const { nome, modalidade, formato, data, max_participantes, status } = req.body;
  run('UPDATE torneios SET nome=?, modalidade=?, formato=?, data=?, max_participantes=?, status=? WHERE id=?',
    [nome||t.nome, modalidade||t.modalidade, formato||t.formato, data||t.data,
     max_participantes||t.max_participantes, status||t.status, req.params.id]);
  res.json(query('SELECT * FROM torneios WHERE id = ?', [req.params.id])[0]);
});

app.delete('/api/torneios/:id', auth, (req, res) => {
  const rows = query('SELECT * FROM torneios WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ erro: 'Torneio não encontrado' });
  run('DELETE FROM inscricoes WHERE torneio_id = ?', [req.params.id]);
  run('DELETE FROM torneios WHERE id = ?', [req.params.id]);
  res.json({ mensagem: 'Torneio removido' });
});

// ─── Inscrições ──────────────────────────────────────────────────────────────

app.post('/api/torneios/:id/inscricoes', auth, (req, res) => {
  const { jogador_id } = req.body;
  const torneio = query('SELECT * FROM torneios WHERE id = ?', [req.params.id]);
  if (!torneio.length) return res.status(404).json({ erro: 'Torneio não encontrado' });
  const jogador = query('SELECT * FROM jogadores WHERE id = ?', [jogador_id]);
  if (!jogador.length) return res.status(404).json({ erro: 'Jogador não encontrado' });
  const inscritos = query('SELECT COUNT(*) as c FROM inscricoes WHERE torneio_id = ?', [req.params.id]);
  if (inscritos[0].c >= torneio[0].max_participantes)
    return res.status(400).json({ erro: 'Torneio com vagas esgotadas' });
  try {
    run('INSERT INTO inscricoes (torneio_id, jogador_id) VALUES (?, ?)', [req.params.id, jogador_id]);
    res.status(201).json({ mensagem: 'Jogador inscrito com sucesso' });
  } catch {
    res.status(400).json({ erro: 'Jogador já inscrito neste torneio' });
  }
});

app.delete('/api/torneios/:id/inscricoes/:jogador_id', auth, (req, res) => {
  run('DELETE FROM inscricoes WHERE torneio_id = ? AND jogador_id = ?',
    [req.params.id, req.params.jogador_id]);
  res.json({ mensagem: 'Inscrição removida' });
});

// ─── Dashboard stats ─────────────────────────────────────────────────────────

app.get('/api/dashboard', auth, (req, res) => {
  const totalTorneios = query('SELECT COUNT(*) as c FROM torneios')[0].c;
  const totalJogadores = query('SELECT COUNT(*) as c FROM jogadores')[0].c;
  const torneiosAtivos = query("SELECT COUNT(*) as c FROM torneios WHERE status != 'Finalizado'")[0].c;
  const totalInscritos = query('SELECT COUNT(*) as c FROM inscricoes')[0].c;
  res.json({ totalTorneios, totalJogadores, torneiosAtivos, totalInscritos });
});

// ─── Start ───────────────────────────────────────────────────────────────────

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🃏 Joker Tournament API rodando em http://localhost:${PORT}`);
  });
});
