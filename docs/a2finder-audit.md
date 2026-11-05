# Auditoria funcional do a2finder e estratégia do PAD PLAN

Consulta: 05/11/2026. Superfície pública auditada: a2finder 0.30.0, site, tutorial e descrições públicas. Esta análise não contorna login, assinatura, proteção técnica nem extrai código proprietário.

## O que o produto realmente é

O a2finder não é somente um planner web. É um aplicativo Windows com overlays. Segundo a documentação pública, ele usa Npcap para observar passivamente o tráfego que já chega ao computador, sem ler memória, injetar código, modificar arquivos ou enviar pacotes ao jogo. O site é a apresentação; DPS, detecção do personagem e overlays dependem do cliente local.

## Inventário auditado

| Área | Capacidades públicas observadas | Dependência | Situação no PAD PLAN |
|---|---|---|---|
| Personagem e build | busca por região/classe/servidor; equipamento, pedras, atributos, skills e Daevanion | API/perfil público e/ou tráfego local | perfil e equipamento funcionais; pedras/Daevanion ainda incompletos |
| Nota do gear | D a BiS conforme semelhança com linhas usadas pelos melhores da classe/slot | amostra de builds e critérios versionados | motor de recomendações iniciado; ranking estatístico ainda não implementado |
| DPS ao vivo | DPS, dano, cura, dano recebido, mortes, vida do chefe e party | cliente Windows + Npcap + decodificador de protocolo | impossível somente no navegador; requer companion local |
| Histórico de combate | lutas por 8 horas, skills, crítico, média e alvos | eventos de combate locais + banco local | não implementado |
| PvP | medidor próprio; buffs ativos e duração no plano VIP | tráfego local | não implementado |
| Healer | vida da party e membros sob controle | tráfego local | não implementado |
| Teste/análise de combate | relatório por skill e histórico; não há confirmação pública de um simulador matemático fechado | dados observados; fórmulas não publicadas | planejado como replay/análise real, sem inventar DPS teórico |
| Mascotes | 207 mascotes, nível e almas por personagem; rota/radar e ganho por kill | tráfego local + catálogo/mapa | não implementado |
| Chefes | 84 chefes, vivo/morto/respawn, mapa e alertas | catálogo + eventos locais/comunitários | não implementado |
| Farm | Kinah, AP, minérios, Odyle, drops/hora e últimas 50 sessões | tráfego local + banco local | não implementado |
| Eventos | Fenda, Kaira, cerco, Nahma, Shugo, invasão e resets no horário do servidor | calendário versionado | não implementado |
| Overlays | nove overlays, reposicionamento por Alt+E e integração OBS | janela nativa transparente/click-through | requer companion desktop |
| Cubos e radar | cubo oculto até 150 m e rota | tráfego/coordenadas + mapas | não implementado |
| Mercado | integração mencionada pelo usuário, mas não descrita na superfície pública auditada | a confirmar: API oficial, tráfego ou catálogo local | não será simulada até a origem ser confirmada |

## Arquitetura equivalente, privada e local

1. **PAD PLAN Web**: UI atual, planejamento, comparações, captura, backup e IndexedDB.
2. **PAD Companion**: processo local Windows somente leitura. Captura opcional via Npcap, decodifica eventos suportados e publica apenas em `127.0.0.1` com token local.
3. **Combat Store**: SQLite local para encontros, skills, jogadores, alvos e sessões de farm.
4. **Overlay Host**: janelas transparentes e click-through; nenhuma injeção no jogo.
5. **Catalog Service**: catálogos versionados de itens, adicionais, skills, arcanas, pets, chefes e mapas, sempre com região/patch/fonte.
6. **Optional Sync**: desligado por padrão. Nenhum log, personagem ou imagem sai do PC sem uma ação explícita.

## Ordem de implementação recomendada

1. Fechar planner multiclasse: catálogos verificados por classe/slot, Daevanion, pedras e notas do gear.
2. Criar o protocolo local e um importador de logs gravados, antes de captura ao vivo.
3. Implementar histórico e análise de combate local.
4. Adicionar captura passiva opcional e overlay de DPS.
5. Farm, eventos, chefes, mascotes e mapas.
6. Mercado somente depois de confirmar uma origem de dados permitida e estável.

## Riscos e limites

- Captura de tráfego exige Npcap e software nativo; GitHub Pages não executa isso.
- Protocolos e identificadores podem mudar a cada patch/região.
- Mesmo sem memória ou injeção, ferramentas de captura podem ser tratadas pelas regras do jogo como software de terceiros. A opção deve ser explícita e documentada.
- Não copiar assets, código, textos internos, credenciais ou endpoints privados do a2finder. A paridade é funcional e arquitetural, com implementação própria.

## Fontes

- a2finder — página oficial e tutorial, versão pública 0.30.0: https://a2finder.app/
- Tutorial oficial indicado pelo site: https://www.youtube.com/watch?v=xX0SoE0JeY4
- A2Tools — referência pública e aberta para arquitetura de medidor passivo: https://www.a2tools.app/
- FullAIon2Companion — implementação aberta de companion passivo: https://github.com/l33tm3/FullAIon2Companion

