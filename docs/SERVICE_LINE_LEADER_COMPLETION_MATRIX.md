# Service Line Leader - Matriz de cobertura funcional

Data da validação: 11 de julho de 2026

Fontes de requisitos:

- `PINT_2025_Plataforma de Badges da Softinsa - V3.2 - Mobile.pdf`, páginas 4, 5 e 8.
- `docs/AUDITORIA_FUNCIONAL_FRONTEND.md`, secção 5.

## Regra de workflow

| Etapa | Responsável | Implementação validada |
|---|---|---|
| Submissão e upload de evidências | Consultor | A candidatura entra em `SUBMITTED`. |
| Validação das evidências | Talent Manager | Só o TM pode validar evidências; quando aceita a candidatura, esta passa para `VALIDATED`. |
| Decisão final sobre a badge | Service Line Leader | O SLL pode `APROVAR`, `REJEITAR` ou `SEND_BACK`, exclusivamente na sua Service Line. |
| Aprovação | Service Line Leader | Passa para `APPROVED`, atribui a badge, notifica o consultor e disponibiliza certificado. |
| Devolução | Service Line Leader | Exige comentário, passa para `OPEN` e notifica o consultor. |

## Requisitos do perfil

| Nº | Estado | Evidência atual |
|---:|---|---|
| 1 | Implementado | O catálogo e toda a hierarquia (Learning Path, Service Line, área, nível e requisito) são filtrados no backend pela Service Line autenticada. |
| 2 | Implementado | O dashboard mostra todos os consultores da Service Line, ranking, badges, pontos e progresso na área. |
| 3 | Implementado | A lista apresenta todos os estados, pesquisa, contadores e atualização automática a cada 30 segundos. |
| 4 | Implementado | Pedidos em processo/fechados e badges conquistadas são consultáveis na lista e no perfil de cada consultor. |
| 5 | Implementado | O catálogo apresenta badges ativas da Service Line e detalhe com descrição real. |
| 6 | Implementado | O detalhe da badge apresenta requisitos, descrição, obrigatoriedade e imagem/ícone quando disponível. |
| 8 | Implementado | Pontos são apresentados no catálogo, pedidos, perfis, ranking e relatórios, incluindo valor zero. |
| 9 | Implementado | Conquistas Premium são devolvidas pela API e apresentadas no perfil e nos relatórios. |
| 10 | Implementado | Relatórios filtráveis por área, período, estado e faixa de experiência. |
| 11 | Implementado | Exportação dos pedidos filtrados para Excel e PDF. |
| 12 | Implementado | Exportação do catálogo de badges para Excel e PDF. |
| 13 | Implementado | Exportação dos consultores e respetivas métricas para Excel e PDF. |
| 14 | Implementado | Exportação das aprovações para Excel e PDF. |
| 15 | Implementado | Download autenticado do certificado PDF de uma conquista concreta; o backend aplica o âmbito da Service Line. |
| 16 | Implementado | A validação do TM identifica os SLL responsáveis pela Service Line e dispara email em background. |
| 17 | Implementado | O workflow cria notificações in-app para novo pedido final, aprovação, rejeição e devolução. |
| 18 | Implementado | Ranking comparativo limitado aos consultores da Service Line, com badges, pontos e progresso. |
| 19 | Implementado | Histórico auditável com estado anterior, estado novo, responsável, data e comentário. |

## Bónus

| Requisito | Estado | Evidência atual |
|---|---|---|
| Comparar consultores com experiência e área semelhantes | Implementado | Relatórios permitem filtrar por área e faixa de experiência e comparam progresso, pontos, badges e Premium. |
| Badge na assinatura de email | Implementado | Rota e editor de assinatura disponíveis no painel SLL; badges pessoais conquistadas podem ser selecionadas. |

## Segurança validada

- Um SLL sem Service Line associada falha de forma fechada com `403`.
- A conta de teste da Service Line `Technology QA` recebeu apenas a Service Line 4, a área 3 e os consultores 17, 29 e 31.
- A candidatura 253, pertencente a outra Service Line, devolveu `403` por acesso direto.
- A candidatura 254, da Service Line correta, devolveu `200` e ficou disponível para decisão final.
- `/api/users` e `/api/catalog/evidencias` devolveram `403` ao SLL.
- Um certificado da Service Line correta devolveu PDF; um certificado externo devolveu `403`.

## Fluxos integrados executados

- Candidatura 256: evidências validadas pelo TM, badge aprovada pelo SLL, atribuição criada, notificação criada e certificado PDF gerado.
- Candidatura 255: `SUBMITTED -> VALIDATED -> OPEN`, comentário obrigatório e histórico com TM e SLL identificados.
- Candidatura 254: deixada em `VALIDATED`, com três evidências validadas, para teste manual das três decisões finais.

## Verificações técnicas

- ESLint: sem erros.
- Testes frontend: 9 testes aprovados.
- Testes de âmbito backend: 3 testes aprovados.
- Build Vite de produção: concluído.
- Teste visual autenticado: dashboard, pedidos, relatórios e menu mobile sem erros de consola ou dados de outra Service Line.
