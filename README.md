# Socratic Forge (Next.js + Prisma + Postgres)

## Rodando 100% local no WSL (com Podman)

### Pré-requisitos

- Node.js (recomendado: LTS)
- Podman + `podman-compose` funcionando no WSL

### 1) Subir o Postgres

Na raiz do projeto:

```bash
podman-compose up -d
```

Para ver se está saudável:

```bash
podman ps
```

### 2) Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

> O Prisma lê `.env` por padrão, e o Next também carrega `.env` em desenvolvimento.

### 3) Instalar dependências

```bash
npm install
```

### 4) Criar as tabelas (migrations)

Se este repo ainda não tem migrations versionadas, você vai criar a primeira migration localmente:

```bash
npx prisma migrate dev --name init
```

Opcional (ver Prisma Studio):

```bash
npx prisma studio
```

### 5) Rodar a aplicação

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Solucionando o erro `Environment variable not found: DATABASE_URL`

Esse erro acontece quando o Prisma tenta acessar o banco e não encontra `DATABASE_URL`.

- Garanta que existe um `.env` na raiz (ou exporte `DATABASE_URL` no shell)
- Garanta que o Postgres está rodando (`podman-compose up -d`)

