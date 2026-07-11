# Matriz de conclusao - Talent Manager

Referencia: `PINT_2025_Plataforma de Badges da Softinsa - V3.2 - Mobile.pdf`, pagina do perfil Talent Manager e reporting minimo.

Legenda:

- `Concluido`: comportamento implementado e validado no frontend com a API real.
- `Parcial API`: frontend implementado, mas o contrato atual nao garante o requisito de ponta a ponta.
- `Bloqueado API`: nao existe permissao/modelo/endpoint suficiente e o backend nao foi alterado.

| Nº | Requisito | Estado | Evidencia atual |
|---:|---|---|---|
| 1 | Consultar badges disponiveis | Concluido | Catalogo dinamico, filtro ativa/inativa, pesquisa, Area, Nivel e exportacao em `TalentCatalogPage.jsx`. |
| 2 | Dashboard com progresso dos consultores | Concluido | Progresso completo, filtros de Service Line/Area e ligacao ao perfil em `TalentDashboardPage.jsx`. |
| 3 | Verificacao de evidencias | Parcial API | Validacao individual e cobertura de requisitos obrigatorios no detalhe. A API ainda deve repetir a regra na transacao de aprovacao. |
| 4 | Status em tempo real | Parcial API | Polling visivel a cada 30 segundos; falta SSE/WebSocket para atualizacao instantanea. |
| 5 | Historico de badges obtidos/em processo | Concluido | Perfil do consultor, candidaturas globais e estados finais/em curso reais. |
| 6 | Catalogo com descricoes | Concluido | Descricao, imagem, fornecedor, hierarquia, validade e estado vindos da API. |
| 7 | Requisitos por badge | Concluido | Titulo, descricao, obrigatoriedade, ordem e imagem/icone quando disponivel. |
| 8 | Relatorios por area/periodo | Concluido | Filtros de periodo, Learning Path, Service Line, Area, Nivel, Badge e Estado. |
| 9 | Exportar pedidos Excel/PDF | Concluido | Dataset de candidaturas exportavel em `.xls` e PDF. |
| 10 | Exportar badges Excel/PDF | Concluido | Catalogo e atribuicoes exportaveis. |
| 11 | Exportar consultores Excel/PDF | Concluido | Diretorio e dataset de relatorios exportaveis. |
| 12 | Exportar aprovacoes Excel/PDF | Concluido | Separador dedicado no relatorio. |
| 13 | Exportar rejeicoes Excel/PDF | Concluido | Separador dedicado no relatorio. |
| 14 | Badge na assinatura de email | Parcial API | Selecao ate quatro badges, copia HTML real, links publicos e download. A API nao persiste template sem badge atribuida ao proprio TM. |
| 15 | Sistema de pontos por badge | Concluido | Catalogo, detalhe, perfil, Learning Paths e relatorios de pontos atribuidos. |
| 16 | Conquistas especiais | Concluido | Detalhe por consultor, KPI global, pesquisa por area e exportacao. |
| 17 | Certificado PDF personalizado | Parcial API | Download exposto no perfil; o token pertence a `Badge`, nao a conquista individual. |
| 18 | Emails de pedidos/validacoes | Parcial API | Fluxos backend existentes; entrega depende da configuracao externa e nao tem estado consultavel. |
| 19 | Notificacoes de aprovacao/rejeicao | Parcial API | Pagina e leitura real implementadas; o workflow nao cria automaticamente todos os avisos in-app. |
| 20 | Badges proximas da expiracao | Concluido | Calculo automatico, filtros, lista dedicada, dashboard e exportacao. |
| 21 | Historico de cada processo | Concluido | Estado, motivo, autor e data reconstruidos a partir de historico, utilizadores e catalogo de estados. |
| Bonus | Criar timeline por consultor | Bloqueado API | Leitura e visualizacao existem; escrita em `/catalog/timeline` e exclusiva de Admin. |

## Reporting minimo

| Indicador | Estado | Evidencia |
|---|---|---|
| Percentagem mensal de badges | Concluido | Serie mensal com quantidade e percentagem. |
| Numero de badges por intervalo | Concluido | Datas `Desde/Ate` aplicadas as atribuicoes. |
| Numero por Learning Path | Concluido | Distribuicao e filtro por Learning Path. |
| Numero por nivel | Concluido | Distribuicao e filtro por nivel. |
| Numero de utilizadores registados | Concluido | `GET /users` consumido pelo workspace e apresentado como KPI. |

## Bonus gerais relevantes

| Bonus | Estado | Evidencia/limite |
|---|---|---|
| Portugues, Ingles e Espanhol | Concluido | Seletor na conta de gestao e textos novos nos tres idiomas. |
| Saudacao contextual | Concluido | Primeiro acesso, regresso apos 15 dias e saudacao por hora, com historico local por utilizador. |
| Informacoes/Avisos | Parcial API | Consulta global e notificacoes pessoais existem; criacao/edicao por TM esta bloqueada pela autorizacao. |
| Teams/Slack | Bloqueado API | Nao existem contratos especializados de envio. |
