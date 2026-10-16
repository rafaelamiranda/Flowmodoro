# 🌲 Flowmodoro

App de **Flowmodoro** com visual inspirado no Forest: você escolhe uma tarefa, foca sem limite de tempo, e a pausa é proporcional ao foco (**pausa = foco ÷ fator**, padrão 5). Uma árvore cresce durante o foco; cancelar cedo a faz murchar. Tudo roda localmente no navegador.

## Instalação e scripts

```bash
npm install
npm run dev        # desenvolvimento em http://localhost:3000
npm run build      # build de produção (necessário para o service worker/PWA)
npm start          # serve o build
npm test           # Vitest (lógica pura)
npm run typecheck  # tsc --noEmit
npm run lint
```

## Como funciona

- **Foco** conta para cima. Ao parar, `calcBreak(focusMs, fator, min, max)` define a pausa (foco < 1 min não gera pausa), que começa como contagem regressiva.
- Ao zerar: som (Web Audio), notificação do navegador e `aria-live`. Botões: *Iniciar novo foco* ou *Encerrar*. Também há *Pular pausa* e *+1 min*.
- **Só "Parar" salva a árvore.** Cancelar o foco (a qualquer momento) registra uma árvore perdida 🥀; antes de 5 min isso é avisado na tela.
- Estágios da árvore (`src/lib/constants.ts`): semente → broto (5 min) → muda (15) → árvore (30) → completa (45+).
- Estatísticas contam como tempo focado apenas sessões **concluídas**; canceladas entram só em "árvores perdidas".
- Atalhos: **Espaço** inicia/para, **Esc** cancela (com confirmação).

## Estrutura

```
src/
  app/                 rotas: / (timer), /floresta, /tarefas, /estatisticas, /configuracoes, manifest
  components/          Nav, Modal/Button/Card (ui.tsx), RegisterSW
  features/
    timer/             engine.ts (puro) · store.ts · TimerRuntime · TimerScreen · useNow
    tasks/             store · TaskForm · TasksScreen
    forest/            TreeSvg (5 espécies) · growth · species · ForestScreen
    stats/             aggregate.ts (puro) · dataIO.ts (CSV/JSON) · gráficos · tabela
    settings/          store · SettingsScreen · DataSection (exportar/importar)
  lib/                 calcBreak · audio · notifications · format · storage · channel
    repository/        interface Repository + implementação Dexie
public/                sw.js, ícones
```

## Decisões principais

- **Precisão do tempo:** o timer guarda `phaseStartedAt`/`breakEndsAt` (epoch ms) em `localStorage` e calcula tudo com `Date.now()`. O `setInterval` só dispara re-render; nunca acumula tempo. Refresh, aba em segundo plano, suspensão e pausa expirada com o app fechado funcionam porque o estado é só timestamps. Relógio recuado reancora o timer (`normalize`) e o tempo nunca fica negativo.
- **Fim da pausa em segundo plano:** `setTimeout` calculado pelo timestamp + verificação em `visibilitychange`/`focus`/`pageshow` + tick de 1 s. Um marcador em `localStorage` e um Web Lock garantem **um único** aviso, mesmo com várias abas.
- **Várias abas:** o timer é compartilhado via evento `storage`; mudanças em tarefas/sessões se propagam por `BroadcastChannel`. Não existem dois timers independentes.
- **Zustand** (stores pequenas por feature) em vez de Context + reducer: menos boilerplate e seletores granulares.
- **Persistência:** IndexedDB (Dexie) atrás da interface `Repository` em `src/lib/repository`. Para trocar por API, implemente a interface e altere `repository/index.ts`. Timer ativo e configurações ficam em `localStorage` por precisarem de leitura síncrona.
- **Áudio:** 3 sons sintetizados com Web Audio API (sino, gota, marimba) — sem arquivos externos, sem licenças. O `AudioContext` é liberado no clique/tecla de "Iniciar foco".
- **Árvores:** 5 espécies em SVG próprio (carvalho, pinheiro, cerejeira, bétula, palmeira); a espécie é definida por um hash estável do id da tarefa.
- **Backup:** JSON validado na importação (registros inválidos são descartados e contados; modos mesclar/substituir). CSV neutraliza fórmulas de planilha.
- **PWA:** `manifest.webmanifest`, ícones e `public/sw.js` (rede primeiro, cache como fallback), registrado só em produção.
- Interface em pt-BR, mobile-first, `prefers-reduced-motion` respeitado, navegação por teclado.

## Limitações

- Navegadores só tocam o som se o usuário já interagiu com a página (por isso o desbloqueio no primeiro clique). Se a aba nunca foi usada após abrir o navegador, o som pode ser bloqueado; a notificação e o título ainda avisam.
- Abas em segundo plano têm timers throttled pelo navegador; o aviso pode atrasar alguns segundos, mas o tempo exibido é sempre correto ao voltar.
- Dados ficam só neste navegador: use *Configurações → Exportar* para backup.
