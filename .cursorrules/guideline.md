---
description: Research, plan, execute, terminal checks, optional Browser MCP validation
alwaysApply: true
---

# AI Assistant — regras do projeto

## Como o Cursor aplica isso automaticamente

As instruções que o agente deve seguir estão em **`.cursor/rules/ai-workflow.mdc`** com `alwaysApply: true`. O Cursor carrega esse **arquivo** em **todas** as conversas neste workspace; não depende de abrir um arquivo específico.

Este `guideline.md` serve como **referência legível** e para **configurações do editor** (auto-run, permissões). Se você mudar o fluxo de trabalho, atualize **principalmente** o `.mdc` para o agente ver as alterações.

---

## Fluxo de trabalho (espelho da regra)

Você é um Senior Software Engineer. Para pedidos **não triviais** (features, bugs complexos), siga este pipeline. Para correções triviais (typo, null check óbvio, uma linha de config), você pode pular o passo 1 ou resumir a pesquisa no chat.

### 1. Pesquisa

- Quando APIs ou documentação externa importarem, crie ou atualize **`research.md`** na raiz do projeto, ou **`.cursor/research.md`** se quiser manter notas fora do Git.
- Use pesquisa na web e ferramentas MCP; sintetize conclusões, não apenas cópias longas.

### 2. Plano

- Leia o contexto da pesquisa (ou do histórico).
- Escreva um **plano passo a passo no chat** antes do código central de implementação.
- Se não houver resposta imediata do **usuário**, declare **premissas** e siga em frente.

### 3. Execução

- Implemente conforme o plano (ou premissas).
- Testes unitários quando o comportamento mudar.
- **Execute você mesmo** os comandos de verificação do projeto (`npm run lint`, `test`, `build`, etc.), conforme `package.json`.
- Peça permissão **network** quando houver `npm install` ou chamadas externas.
- **Concluído** só quando lint, testes e build passarem, ou explique por que estão N/A e o que você rodou.

### 4. Validação no browser integrado (opcional)

Use quando a mudança for **visível na interface** (telas, fluxos, formulários) e existir app web rodando localmente.

- **Ferramenta:** o Cursor expõe ao agente o MCP **Browser** integrado (`cursor-ide-browser`). Não precisa configurar servidor extra no `mcp.json` para isso — o Agent já pode navegar, tirar snapshot da página e interagir (clique, digitar, scroll), desde que as ferramentas apareçam em *Available Tools*.
- **Servidor local:** suba o dev server no terminal (ex.: `npm run dev`) se ainda não estiver no ar; use permissão **network** se o sandbox bloquear porta ou install.
- **Fluxo recomendado:** abrir a URL correta (`http://localhost:<porta>` conforme `package.json`, README ou o que você indicar) → **`browser_snapshot`** para ver a árvore da página e refs dos elementos → exercitar a **feature implementada** → ao terminar, seguir o ciclo de lock/unlock descrito nas instruções do MCP.
- **O que validar:** caminho feliz da feature, estados óbvios (erro de validação, loading), regressões visuais gritantes. Registre no chat o que foi testado e o resultado.
- **Quando pular:** só API/backend sem UI, app desktop/mobile sem URL local, login que o agente não consegue completar, ou você pedir explicitamente para não usar o browser.
- **Limitação:** o conteúdo **dentro de iframes** não é acessível a essa automação.

### Repositório e segurança

- Sem Git no projeto: não assuma fluxos `git`; confirme antes.
- Nunca faça commit de segredos. Cuidado com comandos destrutivos.

---

## MCP do GitHub (oficial)

A configuração em **`~/.cursor/mcp.json`** usa o **GitHub MCP Server oficial**, o mesmo projeto open source **[github/github-mcp-server](https://github.com/github/github-mcp-server)**:

- **Remoto (recomendado no Cursor):** URL `https://api.githubcopilot.com/mcp/` — instância hospedada pelo GitHub, mesma base do repositório acima.
- **Local (alternativa):** imagem Docker `ghcr.io/github/github-mcp-server` com `GITHUB_PERSONAL_ACCESS_TOKEN`, conforme o README do repositório.

O pacote npm antigo `@modelcontextprotocol/server-github` está **descontinuado**; o caminho suportado é remoto ou Docker desse repositório.

Autenticação no `mcp.json` aqui: `Authorization: Bearer ${env:GITHUB_PERSONAL_ACCESS_TOKEN}` — defina a variável no ambiente antes de abrir o Cursor.

---

## Menos confirmações ao rodar comandos (terminal)

Isso **não** se configura dentro deste markdown: é definição do **Cursor** e da sua máquina.

1. **Ativar auto-run**  
   Em **Cursor Settings → Agent** (ou área equivalente de *Chat / Agent* na sua versão), ative a execução automática de comandos permitidos. A documentação descreve modos como **Auto-Run in Sandbox** ou **Run Everything** (este último é mais permissivo; use com consciência dos riscos).

2. **Lista de comandos permitidos (recomendado)**  
   Você pode definir prefixos que rodam sem pedir aprovação em **`~/.cursor/permissions.json`** (arquivo global; JSONC permitido). Exemplo para projetos Node habituais:

   ```jsonc
   {
     "terminalAllowlist": [
       "git",
       "npm",
       "yarn",
       "pnpm",
       "node",
       "npx"
     ]
   }
   ```

   Quando `terminalAllowlist` existe nesse arquivo, **substitui** a lista da interface para o terminal (não faz merge). Entradas vazias `[]` bloqueiam tudo na prática para esse tipo — evite isso se quiser auto-run útil.

   Documentação: [permissions.json](https://cursor.com/docs/reference/permissions) e [Agent Security](https://cursor.com/docs/agent/security).

3. **Limitações**  
   Comandos que precisam de **acesso fora do sandbox** ou permissões especiais podem continuar pedindo confirmação. Allowlist é conveniência, não substitui julgamento de segurança.

---

## Resumo

| O quê | Onde |
|--------|------|
| Regra sempre ativa para o AI | `.cursor/rules/ai-workflow.mdc` (`alwaysApply: true`) |
| Leitura humana + auto-run / MCP / browser | `.cursorrules/guideline.md` (este arquivo) |
| Comandos sem aprovação repetida | Cursor Settings (auto-run) + `~/.cursor/permissions.json` |
