# PAD PLAN — Aion 2 Personal Build Analytics

Planejador local-first para qualquer personagem carregado. Separa build atual e planejada, analisa equipamentos, adicionais, skills e arcanas, persiste imagem/enquadramento no IndexedDB e exporta backups e capturas PNG.

## Executar

Requer Node.js 20+: `npm install` e `npm run dev`. Produção: `npm run build && npm run preview`. Testes: `npm test`.

No Windows, também é possível dar dois cliques em `INICIAR_ASEO.cmd`. Ele prepara as dependências quando necessário, abre o navegador e mantém o servidor local ativo enquanto a janela permanecer aberta.

### Link privado com senha

`INICIAR_ASEO_TUNEL.cmd` compila o app, pede uma senha sem gravá-la e inicia o servidor protegido e um Cloudflare Quick Tunnel. O endereço público `https://...trycloudflare.com` aparece na janela; o usuário HTTP é `aseo`. Mantenha a janela aberta enquanto estiver usando ou compartilhando o link. O endereço muda a cada nova execução.

O executável oficial `cloudflared.exe` deve ficar em `tools/` e não é versionado. Baixe-o em [Cloudflare cloudflared releases](https://github.com/cloudflare/cloudflared/releases/latest).

Não há conta nem telemetria. A imagem fica no navegador. Backups incluem a imagem; trate-os como arquivo pessoal. O catálogo é parcial e campos não validados aparecem como “a conferir”.

## Importação oficial por personagem

Digite nickname e servidor diretamente no centro da tela ou use **Atualizar** no topo para escolher outra região. O app lê somente dados públicos oficiais do Aion 2: equipamentos, ícones, aprimoramentos, atributos principais, adicionais rolados, habilidades concedidas, manastones, theostones, asas, arcanas, níveis, GS e CP. A distribuição interna dos pontos das arcanas continua manual, sem dados inventados.

O Shugo.gg informa que não oferece API pública. O ASEO usa os mesmos endpoints públicos oficiais da NCSOFT que sustentam os perfis e complementa o que não é exposto com edição manual validada.

Em desenvolvimento, o Vite fornece o proxy local. Em produção, publique `worker/` com Cloudflare Workers, configure `ALLOWED_ORIGINS` com o domínio do GitHub Pages e crie a variável do repositório `VITE_AION_API_BASE` contendo a URL do Worker:

```powershell
cd worker
npx wrangler deploy
```

O GitHub Pages é publicado automaticamente por `.github/workflows/pages.yml` após o push em `main`.

Pesquisa consultada em 05/11/2026: SolAshur (Global S1, 30/10), AION2 Guidance (Global S1, 24/10), Daeva Guides (Global, 21/10) e gaming.tools (Global 2.0.7.0, 14/10). Veja `docs/`.
