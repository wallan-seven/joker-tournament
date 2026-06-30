# 🃏 Joker Tournament

Sistema web de gerenciamento de torneios de baralho (Truco, Canastra, Cacheta, 66).

## Tecnologias

### Backend
- **Node.js** + **Express** — API REST
- **sql.js** — SQLite em JavaScript puro (sem dependências nativas)
- **bcryptjs** — hash de senhas
- **jsonwebtoken** — autenticação JWT

### Frontend
- **Next.js 15** (App Router) — framework React
- **CSS Modules** — estilização componentizada
- **Font Awesome** — ícones

## Arquitetura

```
joker-tournament/
├── backend/          ← API REST (porta 3001)
│   ├── server.js     ← servidor principal
│   └── database.sqlite (gerado automaticamente)
└── frontend/         ← Next.js (porta 3000)
    ├── app/          ← páginas (App Router)
    ├── components/   ← componentes reutilizáveis
    └── lib/          ← api.js, auth.js
```

## Como Rodar

### Backend
```bash
cd backend
npm install
node server.js
# API disponível em http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App disponível em http://localhost:3000
```

## Login Padrão
- **Usuário:** admin  
- **Senha:** admin123

## Funcionalidades (CRUD Completo)

### Torneios
- Listar com filtro por modalidade
- Criar novo torneio (nome, modalidade, formato, data, vagas, status)
- Editar dados do torneio
- Excluir torneio
- Gerenciar inscrições de jogadores

### Jogadores
- Listar com busca em tempo real
- Cadastrar novo jogador (nome, apelido, telefone)
- Editar inline
- Excluir jogador

### Dashboard
- Total de torneios
- Torneios ativos
- Total de jogadores
- Total de inscrições

## Rotas da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/login | Autenticação |
| GET | /api/dashboard | Estatísticas |
| GET | /api/jogadores | Listar jogadores |
| POST | /api/jogadores | Criar jogador |
| PUT | /api/jogadores/:id | Editar jogador |
| DELETE | /api/jogadores/:id | Excluir jogador |
| GET | /api/torneios | Listar torneios |
| POST | /api/torneios | Criar torneio |
| PUT | /api/torneios/:id | Editar torneio |
| DELETE | /api/torneios/:id | Excluir torneio |
| POST | /api/torneios/:id/inscricoes | Inscrever jogador |
| DELETE | /api/torneios/:id/inscricoes/:jid | Remover inscrição |
