# ASEO — Aion 2 Gear Planner

Planejador local-first para Aseo (Templário, Zikel, América do Sul). Separa build atual e planejada, registra equipamentos e arcanas, persiste imagem/enquadramento no IndexedDB e exporta backups e capturas PNG.

## Executar

Requer Node.js 20+: `npm install` e `npm run dev`. Produção: `npm run build && npm run preview`. Testes: `npm test`.

No Windows, também é possível dar dois cliques em `INICIAR_ASEO.cmd`. Ele prepara as dependências quando necessário, abre o navegador e mantém o servidor local ativo enquanto a janela permanecer aberta.

Não há conta nem telemetria. A imagem fica no navegador. Backups incluem a imagem; trate-os como arquivo pessoal. O catálogo é parcial e campos não validados aparecem como “a conferir”.

## Importação oficial por personagem

Use **Perfil** no topo, digite o nickname, escolha a região e selecione o servidor correto. O app lê somente dados públicos do perfil oficial do Aion 2: equipamentos, ícones, aprimoramentos, asas, arcanas, níveis, GS e CP. Adicionais rolados e a distribuição interna das arcanas não são expostos e continuam manuais, sem dados inventados.

Em desenvolvimento, o Vite fornece o proxy local. Em produção, publique `worker/` com Cloudflare Workers, configure `ALLOWED_ORIGINS` com o domínio do GitHub Pages e crie a variável do repositório `VITE_AION_API_BASE` contendo a URL do Worker:

```powershell
cd worker
npx wrangler deploy
```

O GitHub Pages é publicado automaticamente por `.github/workflows/pages.yml` após o push em `main`.

Pesquisa consultada em 05/11/2026: SolAshur (Global S1, 30/10), AION2 Guidance (Global S1, 24/10), Daeva Guides (Global, 21/10) e gaming.tools (Global 2.0.7.0, 14/10). Veja `docs/`.
