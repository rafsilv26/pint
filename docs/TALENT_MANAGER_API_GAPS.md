# Talent Manager - lacunas da API

O frontend implementa tudo o que e possivel com os contratos atuais, sem alterar o backend. Os pontos abaixo precisam de trabalho na API para ficarem completos e robustos.

## 1. Listagem global de candidaturas

O endpoint `GET /api/candidaturas/talent/pendentes` devolve apenas `SUBMITTED`. O frontend usa atualmente `GET /api/candidaturas/serviceline/todas`, que para um Talent Manager nao aplica restricao de Service Line, e mantem a consulta por consultor apenas como fallback.

Necessario: um endpoint paginado e semanticamente proprio para Talent Manager, por exemplo `GET /api/candidaturas/talent/todas`, com filtros de estado, periodo, area, Service Line, Learning Path, nivel, badge e consultor.

## 2. Timeline de desenvolvimento

O Talent Manager consegue ler `GET /api/catalog/timeline`, mas as operacoes genericas de escrita em `/api/catalog/:resource` estao limitadas a Admin.

Necessario: endpoints proprios para o Talent Manager criar, editar e concluir objetivos da timeline de um consultor, com validacao de permissao e auditoria.

## 3. Assinatura de email sem badges

`PUT /api/email-signature` grava uma linha por badge selecionada. Quando uma conta de Talent Manager nao tem badges de consultor, `badgeIds` fica vazio e o `templateHtml` nao e persistido.

Necessario: permitir uma assinatura base independente de badges, ou tornar `badgeId` opcional e manter as badges selecionadas numa relacao separada.

## 4. Certificado personalizado

O `publicToken` pertence a `Badge`, nao a `ConsultorBadge`. Se varios consultores conquistarem a mesma badge, o token nao identifica inequivocamente a pessoa que deve aparecer no certificado.

Necessario: token publico unico por conquista (`ConsultorBadge`) e endpoint de certificado/verificacao baseado nessa conquista.

## 5. Notificacoes do workflow

O backend envia emails nas transicoes, mas nao cria automaticamente registos de notificacao in-app para todas as decisoes do Talent Manager e Service Line Leader.

Necessario: criar notificacoes transacionais no mesmo fluxo da alteracao de estado, incluindo links para a candidatura.

## 6. Tempo real

Nao existe SSE, WebSocket ou outro canal push. O frontend atualiza dashboard, candidaturas, relatorios, consultores, validades e notificacoes por polling de 30 segundos.

Necessario: SSE ou WebSocket para estados, evidencias e notificacoes quando for exigida atualizacao instantanea.

## 7. Validacao obrigatoria no servidor

O frontend cruza requisitos obrigatorios e evidencias validadas e bloqueia a aprovacao enquanto houver cobertura em falta. Contudo, uma chamada direta ao endpoint de decisao pode contornar esta regra.

Necessario: o backend deve verificar, na mesma transacao da aprovacao do Talent Manager, que existe pelo menos uma evidencia validada para cada requisito obrigatorio do nivel.

## 8. Informacoes e avisos

O Talent Manager consegue consultar informacoes globais, mas `POST`, `PUT` e `DELETE` em `/api/catalog/information` e `/api/catalog/notices` estao limitados a Admin.

Necessario: endpoints/permissoes para o Talent Manager criar e editar informacoes e avisos globais, com publico-alvo e auditoria.

## 9. Emails e integracoes corporativas

Os emails de workflow dependem da configuracao externa e nao existe no frontend uma forma de confirmar entrega. O recurso generico `integrations` nao implementa envios Teams/Slack.

Necessario: estado de entrega por notificacao, reenvio controlado e endpoints especializados para Teams/Slack.
