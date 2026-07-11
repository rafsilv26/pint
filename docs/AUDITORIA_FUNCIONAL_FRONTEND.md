# Auditoria funcional do frontend Web - Plataforma de Badges Softinsa

Data da auditoria: 11 de julho de 2026
Documento de referência: `PINT_2025_Plataforma de Badges da Softinsa - V3.2 - Mobile.pdf`
Âmbito analisado: `frontend/`, rotas e contratos disponíveis em `backend/` (backend apenas consultado, sem alterações).

> Nota: este documento regista o estado encontrado antes da implementacao do workspace Talent Manager. Para o estado atual desse perfil, consultar `TALENT_MANAGER_COMPLETION_MATRIX.md` e `TALENT_MANAGER_API_GAPS.md`.

## 1. Objetivo e legenda

Esta auditoria compara as funcionalidades exigidas no PDF com o comportamento atualmente implementado no portal Web. Foram analisados os quatro perfis: Consultor, Talent Manager, Service Line Leader e Administrador/Gestor.

Legenda:

- **OK**: interface existente, ligada à API e com comportamento coerente com o requisito.
- **Parcial**: existe uma parte funcional, mas faltam dados, ações, filtros, persistência ou regras.
- **Estático**: a interface existe, mas apenas altera estado local, mostra valores fixos ou apresenta botões sem ação real.
- **Em falta**: não existe implementação no frontend.
- **Bloqueado pela API**: não pode ficar correto apenas com alterações no frontend; requer endpoint, regra ou alteração do modelo de dados.

## 2. Resumo executivo

Nenhum dos quatro perfis está funcionalmente completo face ao PDF.

Os maiores riscos são:

1. **O Service Line Leader vê e pode operar dados globais.** Consultores, rankings, pedidos e relatórios não estão limitados à sua Service Line. Um SLL pode ainda abrir por URL e decidir uma candidatura de outra Service Line. Referências: `frontend/src/services/apiReal.js:356`, `backend/src/controllers/candidaturaController.js:464`, `backend/src/controllers/consultantController.js:68`.
2. **Os links públicos não identificam uma conquista individual.** O token está na entidade `Badge`, e não na atribuição `ConsultorBadge`. Quando várias pessoas têm a mesma badge, a API devolve a atribuição mais recente e pode mostrar ou certificar a pessoa errada. Referências: `backend/src/models/Badge.js:60`, `backend/src/controllers/relatorioController.js:19`.
3. **A submissão de candidatura não é atómica.** A candidatura é criada antes da validação e upload das evidências. Se a evidência falhar, fica uma candidatura órfã que bloqueia nova submissão. Referência: `backend/src/controllers/candidaturaController.js:148`.
4. **Relatórios e exportações estão praticamente por implementar.** A página de relatórios do SLL é uma cópia da página de pedidos; os botões de exportação de TM, SLL e Admin não recebem dados e não usam os endpoints reais. Referências: `frontend/src/pages/sll/SLLRelatoriosPage.jsx:9`, `frontend/src/components/ExportButtons.jsx:7`.
5. **Vários ecrãs simulam sucesso sem persistir.** Escolha de área, preferências, RGPD, privacidade, notificações, tema e configurações SLA/push são locais ou fixos.
6. **O fluxo de recuperação de password é fictício.** A API real devolve apenas “indisponível” e o ecrã de nova password usa um temporizador sem chamar o backend. Referências: `frontend/src/services/apiReal.js:39`, `frontend/src/pages/auth/AtualizarPasswordPage.jsx:15`.
7. **O portal de gestão não é utilizável em mobile.** A sidebar desaparece abaixo do breakpoint `md` e não existe menu alternativo. Referência: `frontend/src/components/layout/ManagerLayout.jsx:28`.
8. **O modo mock é o comportamento por omissão.** Sem `VITE_USE_REAL_API=true` no ambiente de build, todo o portal usa dados simulados. A página de ranking contorna o seletor e chama sempre a API real. Referências: `frontend/src/services/api.js:15`, `frontend/src/pages/RankingPage.jsx:5`.

### 2.1 Cobertura do modelo funcional descrito no PDF

| Regra estrutural/funcional | Estado atual | Trabalho necessário |
|---|---|---|
| Learning Path contém Service Lines; Service Line contém Áreas; Área contém Níveis; Nível contém Requisitos | **Parcial** | As associações existem no backend, mas o frontend não apresenta a árvore completa nem permite navegar/progredir nela. O CRUD genérico não valida a coerência da hierarquia. |
| Pelo menos cinco níveis por área | **Não garantido** | Não existe validação da quantidade/ordem de níveis nem indicação de níveis em falta. |
| Um badge por nível | **Não garantido** | O modelo permite vários badges no mesmo nível (`Level.hasMany(Badge)`) e não existe restrição única ou validação funcional. A equipa deve confirmar se a regra “um badge por nível” é obrigatória e, sendo, aplicá-la na BD/API. |
| Requisitos A1...An com título, descrição e imagem | **Parcial** | O modelo tem título, descrição e ícone, mas o CRUD Admin não permite imagem/ícone e o frontend de detalhe descarta a descrição real. |
| Obter a badge apenas após evidenciar todos os requisitos do nível | **Não cumprido** | O backend exige apenas que as evidências enviadas tenham algum `requisitoId`; não verifica cobertura de todos os requisitos obrigatórios. |
| Candidatura a qualquer nível sem badges anteriores | **OK** | O frontend não impõe pré-requisitos de níveis anteriores. Deve manter-se assim, validando apenas os requisitos do nível escolhido. |
| Intervalo temporal opcional para obter a badge | **Em falta/ambíguo** | Há campos de expiração da badge atribuída e campos de SLA, mas não há regra de prazo para o consultor concluir requisitos. É necessário separar “prazo da candidatura” de “validade da badge depois de obtida”. |
| Base de dados preparada para vários Learning Paths | **Parcial** | O modelo e CRUD aceitam vários Learning Paths. O dashboard e reporting não apresentam progresso por Learning Path. |
| Pontos permanecem depois de a badge expirar | **Inconsistente** | O ranking global inclui badges expiradas, mas o dashboard pessoal calcula pontos e posição apenas com `valid: true`. Todos os cálculos devem usar a mesma regra e conservar os pontos históricos. Referências: `backend/src/controllers/gamificationController.js:35`, `backend/src/controllers/dashboardController.js:60` e `:123`. |

### 2.2 Cobertura do workflow de aprovação

| Etapa exigida | Estado atual | Divergência |
|---|---|---|
| Consultor submete candidatura e evidências (`SUBMITTED`) | **Parcial** | A candidatura é criada antes de validar/upload das evidências e pode ficar órfã. Não é garantido que todos os requisitos estejam cobertos. |
| TM vê todas as submissões e fica registado quem avaliou/quando | **Parcial** | Vê todas as `SUBMITTED`; `talentManagerId`, data e validação de evidências são guardados. A interface/histórico não apresenta claramente o responsável e todas as datas. |
| Evidência correta segue para o SLL da área | **Parcial/inseguro** | O email é dirigido ao SLL relacionado com a badge, mas a listagem e decisão do SLL não são filtradas por Service Line. |
| Evidência incorreta regressa ao consultor para retificação (`OPEN`) | **Incorreto** | O TM muda diretamente para `REJECTED`. A UI apresenta “Reenviar” criando outra candidatura. Deve reabrir a mesma candidatura, guardar feedback e permitir substituir/adicionar evidências. Referência: `backend/src/controllers/candidaturaController.js:384`. |
| SLL aprova, rejeita ou devolve com comentário | **Parcial/inseguro** | As três decisões existem, mas qualquer SLL pode decidir uma candidatura validada de outra Service Line através do endpoint/URL. |
| Aprovação atribui e publica a badge | **Parcial/incorreto** | A atribuição é criada e o email é enviado, mas a publicação usa token comum da definição da badge, não token da conquista individual. |
| Rejeição/devolução notifica e deixa feedback auditável | **Parcial** | Há email e histórico, mas não são criadas notificações in-app; o feedback é descartado na lista do consultor. |

## 3. Problemas transversais de integração e segurança

### P0 - Corrigir antes de colocar em produção

- **Isolamento de Service Line inexistente:** criar filtros server-side a partir do SLL autenticado. Nunca aceitar `serviceLineId` fornecido pelo browser como fonte de autorização.
- **Autorização demasiado aberta no catálogo genérico:** qualquer utilizador autenticado pode listar recursos como `evidencias`, `consultor-badges`, `policy-acceptances`, `rankings` e `email-signatures`. O frontend atual usa este catálogo para dados pessoais. Referências: `backend/src/controllers/catalogController.js:4`, `backend/src/routes/catalogRoutes.js:6`.
- **Listagem de utilizadores aberta a qualquer perfil autenticado:** `GET /api/users` e `GET /api/users/:id` não têm `authorize('Admin')`. Referência: `backend/src/routes/userRoutes.js:7`.
- **Token público por catálogo e não por conquista:** criar token único por `ConsultorBadge`; certificado, página pública e partilha devem usar esse token.
- **Submissão sem transação:** validar badge, requisitos, quantidade e tipos de ficheiro antes de criar; envolver candidatura, evidências e histórico numa transação.
- **JWT exposto na consola:** `http.js` imprime o token completo. Remover imediatamente. Referência: `frontend/src/services/http.js:39`.
- **Sessão não validada no arranque:** o `AuthContext` confia no conteúdo do `localStorage` sem chamar `/auth/me`, verificar expiração ou tratar globalmente respostas 401. Referência: `frontend/src/context/AuthContext.jsx:13`.

### P1 - Corrigir na base comum do frontend

- Tornar a API real o comportamento seguro por omissão em builds de produção, ou falhar o build quando as variáveis não estiverem configuradas.
- Fazer todas as páginas importarem `services/api.js`; o ranking importa diretamente `apiReal.js`.
- Implementar tratamento global de 401/403, expiração de sessão e limpeza do estado autenticado.
- O “Lembrar-me” do login não tem efeito; a sessão é sempre guardada em `localStorage`. Deve escolher entre `localStorage` e `sessionStorage`. Referências: `frontend/src/pages/auth/LoginPage.jsx:62`, `frontend/src/context/AuthContext.jsx:32`.
- O logout é imediato em todos os perfis. O PDF exige confirmação e opção de cancelar.
- O `RoleGuard` considera apenas `user.role`, enquanto o backend suporta `user.roles`. Utilizadores com vários perfis ficam presos ao primeiro papel. Referência: `frontend/src/components/RoleGuard.jsx:17`.
- A pesquisa do cabeçalho dos painéis de gestão é apenas decorativa. Referência: `frontend/src/components/layout/ManagerLayout.jsx:71`.
- Vários pedidos à API usam `.catch(() => [])` ou `.catch(() => {})`; isto transforma erros reais em listas vazias e mensagens de sucesso falsas.

## 4. Perfil Consultor

### 4.1 Requisitos do PDF

| Nº | Estado | Constatação e trabalho necessário |
|---|---|---|
| 1 | **Parcial / bloqueado pela API** | A mudança obrigatória no primeiro login está ligada a `/auth/change-password`. Não existe rota pública de registo; `/auth/register` é exclusivo do Admin. Faltam email de confirmação de registo, confirmação de email e respetivo ecrã/token. |
| 2 | **Estático / bloqueado pela API** | `/escolher-area` contém cinco áreas fixas e apenas regressa ao perfil. Não há registo público com escolha de área. Deve carregar `areas`, mostrar contagens reais e persistir `Consultant.areaId`. |
| 3 | **Parcial** | O catálogo carrega badges da API, mas mostra também badges inativas e não recebe Level/Area completos. Deve listar apenas as disponíveis para o consultor, mantendo acesso transversal conforme o requisito 3. |
| 4 | **Parcial** | O backend devolve título e progresso do Learning Path, mas `apiReal.getDashboard()` descarta ambos. A Home não mostra a progressão do Learning Path. Referências: `backend/src/controllers/dashboardController.js:182`, `frontend/src/services/apiReal.js:52`. |
| 5 | **Parcial / bloqueado pela API** | Upload PDF/JPG/PNG funciona em parte. A interface anuncia vídeo e link, mas a API só aceita PDF/JPG/PNG e os links são descartados. Título e descrição de cada evidência também são descartados. |
| 6 | **Parcial** | O estado é obtido da API apenas ao abrir/recarregar a página. Não existe polling, SSE ou WebSocket; portanto não é “tempo real”. |
| 7 | **Parcial** | Existem candidaturas e histórico de badges conquistadas. Falta uma visão completa do processo, o feedback é descartado no adaptador e “Adicionar evidências” tenta criar uma candidatura duplicada. |
| 8 | **Parcial** | Catálogo e detalhe existem. O detalhe adiciona texto genérico estático à descrição real. |
| 9 | **Parcial / bloqueado pela API** | Pesquisar requisitos pelo `nivelId` é coerente com a hierarquia do PDF, onde os requisitos pertencem ao nível e a badge representa esse nível. Porém, a descrição real é descartada e substituída por texto estático, a API não devolve tudo num detalhe tipado e não valida que as evidências cobrem os requisitos obrigatórios desse nível. |
| 10 | **Estático / bloqueado pela API** | Os toggles de privacidade/RGPD não persistem. Não há endpoint para consultar e aceitar a política ativa como consultor. |
| 11 | **Em falta** | O botão “Partilhar no LinkedIn” não tem `onClick`. Implementar LinkedIn share URL com o link da conquista individual. |
| 13 | **OK** | Pontos são apresentados no catálogo, dashboard, histórico e ranking a partir da API. Rever apenas coerência de filtros e badges expiradas. |
| 14 | **Parcial** | A API de gamificação já devolve detalhes das conquistas especiais, mas `apiReal.getGamification()` descarta `achievements` e o frontend mostra apenas uma contagem vinda do perfil. Falta catálogo/detalhe e ligação ao dashboard. |
| 15 | **Parcial** | Existem cartões de pontos, badges, candidaturas e ranking. Falta a métrica visual do Learning Path e evolução temporal. |
| 16 | **Em falta** | Não há celebração dinâmica de marcos nem regras para identificar os marcos atingidos. |
| 17 | **Parcial** | Existem recomendações reais por área, mas não consideram progressão, requisitos já cumpridos ou próximos níveis; o frontend mostra só três resultados. |
| 18 | **Parcial / incorreto** | “Download” abre um certificado HTML e usa `window.print()`. Existe endpoint PDF no backend, mas não é usado. O token atual pode certificar o consultor errado. |
| 19 | **Parcial** | O backend tenta enviar email na submissão. É necessário confirmar configuração de produção, template, destinatário e criar testes de integração. O frontend ignora os detalhes de entrega devolvidos pela API. |
| 20 | **Parcial** | Existem emails de aprovação/rejeição no workflow. Não são criadas notificações in-app, e o frontend só atualiza ao recarregar. |
| 21 | **Em falta** | A data de expiração pode ser mostrada no histórico, mas não existe processo agendado nem alerta de aproximação/expiração. |
| 22 | **Em falta** | Não há objetivos, prazos, lembretes nem timeline editável. O dashboard força `eventos: []`. |
| 24 | **Em falta** | `/perfil/publico` exige login e mostra apenas o próprio utilizador; não é uma galeria pública acessível externamente. |
| 25 | **Parcial / incorreto** | A página pública da badge existe, mas usa token do catálogo e escolhe a atribuição mais recente dessa badge. Deve usar a conquista individual. |
| 26 | **Incorreto** | O link não é único por badge atribuída ao consultor. Requer alteração de modelo/API. |
| 27 | **Em falta** | A página pública mostra identificação e datas, mas não lista competências/requisitos certificados. |
| 28 | **Em falta** | Não existe ligação para informação de competências em `softinsa.pt`. |

### 4.2 Bónus do Consultor

- **Assinatura de email - parcial:** o backend devolve as badges conquistadas e aceita até quatro IDs, mas o frontend mostra três ícones fixos, não permite selecionar badges, guarda `badgeIds: []` e o HTML gerado não contém badges. O botão de download não tem ação. Referências: `frontend/src/pages/EmailSignaturePage.jsx:8`, `backend/src/controllers/emailSignatureController.js:39`.
- **Linguagens - parcial:** PT/EN/ES existem e o detector persiste no browser. A preferência não é guardada no utilizador, não acompanha o utilizador noutro dispositivo e respostas/dados do backend continuam em português.

### 4.3 Erros concretos no fluxo de candidatura

- O formulário permite adicionar uma evidência sem selecionar requisito; a API falha depois de já ter criado a candidatura.
- Não é exigida uma evidência para cada requisito obrigatório.
- O limite é cinco ficheiros por candidatura, mas não é comunicado nem validado no frontend.
- A UI permite “Vídeo” e “Link”; o backend só aceita `PDF`, `image/jpeg` e `image/png`.
- A descrição enviada para a API é sempre `''`; descrições individuais nunca chegam à base de dados. Referência: `frontend/src/pages/SubmitApplicationPage.jsx:74`.
- Não existe endpoint para adicionar evidências a uma candidatura `OPEN`/devolvida. O botão atual abre uma nova candidatura e a API rejeita-a como duplicada.
- Não existe detalhe de candidatura para o consultor com visualização das evidências submetidas e histórico completo. “Ver detalhes” abre apenas a descrição da badge.
- A API não verifica se cada `requisitoId` pertence à badge/nível selecionado.
- A aprovação pelo TM permite candidatura sem evidências porque a regra considera zero evidências como válidas. Referência: `backend/src/controllers/candidaturaController.js:389`.
- A rejeição pelo TM fecha a candidatura em `REJECTED`, contrariando o workflow do PDF, que exige retorno a `OPEN` para retificação.

## 5. Perfil Service Line Leader

| Nº | Estado | Constatação e trabalho necessário |
|---|---|---|
| 1 | **Parcial / incorreto** | O catálogo existe, mas lista badges globais. Segundo o workflow do PDF, o SLL deve ver todas as áreas da sua Service Line, não outras Service Lines. |
| 2 | **Incorreto** | O dashboard usa todos os consultores. Deve mostrar apenas consultores da Service Line autenticada e respetivo progresso de Learning Path. |
| 3 | **Parcial / incorreto** | Lista pedidos validados, mas de todas as Service Lines e sem atualização em tempo real. |
| 4 | **Parcial / inseguro** | O perfil do consultor mostra histórico, mas o SLL consegue consultar qualquer consultor/candidatura. Falta limitar à Service Line. |
| 5 | **Parcial** | Catálogo e descrições existem, com as limitações de dados indicadas no perfil Consultor. |
| 6 | **Parcial** | Requisitos existem, mas as descrições reais são substituídas e estão ligados ao nível, não inequivocamente à badge. |
| 8 | **OK parcial** | Pontos por badge são visíveis. Falta garantir que a lista está limitada à Service Line e que badges sem pontos são representadas corretamente. |
| 9 | **Parcial** | Só existe contagem de conquistas especiais por consultor na interface; a API de gamificação tem detalhe apenas do próprio utilizador e não há endpoint adequado para o SLL consultar conquistas da sua equipa. |
| 10 | **Em falta** | Não existem relatórios por área/período. |
| 11 | **Estático** | Exportação de pedidos não funciona: `ExportButtons` é chamado sem dados. |
| 12 | **Estático** | Exportação de badges não existe. |
| 13 | **Estático** | Exportação de consultores não existe. |
| 14 | **Estático** | Exportação de aprovações não existe. |
| 15 | **Em falta/incorreto** | Não há ação de certificado nos perfis de gestão; o fluxo global de certificado também usa o token incorreto. |
| 16 | **Parcial** | O backend envia emails durante submissão/validação. Falta uma caixa/estado de notificações coerente e testes de entrega. |
| 17 | **Parcial** | Emails de decisão existem; notificações in-app não são criadas pelo workflow. |
| 18 | **Incorreto** | A tabela “Pontuação mensal” usa consultores globais e pontuação total, não ranking comparativo da Service Line nem dados mensais. |
| 19 | **Parcial** | Existe histórico de motivos e datas. O adaptador não traduz os IDs de estado anterior/novo, logo a transição auditável não é apresentada. |

Bónus em falta:

- Comparação entre consultores com experiência semelhante.
- Assinatura de email com badges para SLL; a rota de assinatura está disponível apenas ao Consultor.

Problemas adicionais:

- `/sll/relatorios` é uma cópia de `/sll/pedidos` e o componente ainda se chama `SLLPedidosPage`.
- Os cartões “Aprovados” e “Rejeitados” mostram sempre zero, porque a API só devolve candidaturas `VALIDATED`.
- Os botões para aprovar/rejeitar evidência individual no detalhe SLL não têm ação. Embora a decisão individual pertença ao TM, estes controlos não devem simular funcionalidade.
- O endpoint de exportação existente devolve todas as candidaturas e não filtra pela Service Line.

## 6. Perfil Talent Manager

| Nº | Estado | Constatação e trabalho necessário |
|---|---|---|
| 1 | **OK parcial** | Pode consultar o catálogo global, mas faltam Level/Area completos e filtro de badges ativas. |
| 2 | **Parcial** | O dashboard mostra contagens globais e lista de pontuação. Não mostra progresso de Learning Paths por consultor. O texto do requisito fala em área/Service Line, enquanto o workflow diz que o TM vê todas as submissões; esta divergência deve ser decidida pela equipa funcional. |
| 3 | **OK parcial** | Pode abrir evidências e validá-las individualmente. Faltam controlo de tipos, requisitos obrigatórios, indicação do validador e regras transacionais. |
| 4 | **Parcial** | Estados são reais, mas apenas atualizados em carregamento; não há tempo real. |
| 5 | **Parcial** | Perfis de consultor mostram badges e candidaturas, mas sem filtros, timeline ou detalhe completo das conquistas especiais. |
| 6 | **Parcial** | Descrição real existe, acompanhada por texto estático indevido. |
| 7 | **Parcial** | Mesmas limitações dos requisitos descritas anteriormente. |
| 8 | **Em falta** | Não existem relatórios por área/período. |
| 9 | **Estático** | Exportação de candidaturas não funciona na página. |
| 10 | **Em falta** | Exportação de badges não existe. |
| 11 | **Em falta** | Exportação de consultores não existe. |
| 12 | **Em falta** | Exportação de aprovações não existe. |
| 13 | **Em falta** | Exportação de rejeições não existe. |
| 14 | **Em falta** | Não há assinatura de email para TM. |
| 15 | **OK parcial** | Pontos são visíveis; falta segmentação temporal e por área. |
| 16 | **Parcial** | Só há contagem de conquistas especiais por consultor na interface; falta uma visão detalhada por consultor/área para TM. |
| 17 | **Em falta/incorreto** | Não existe download de certificado no perfil TM; o contrato público atual não identifica uma conquista individual. |
| 18 | **Parcial** | Emails de pedidos/validações estão presentes no backend, dependentes da configuração externa. |
| 19 | **Parcial** | A decisão chama a API e envia email. Não gera notificação in-app nem atualiza em tempo real. |
| 20 | **Em falta/parcial na API** | O backend do perfil devolve `expiraEm`, mas o frontend ignora a data e só mostra “expirado” quando a flag `valid` já foi alterada. Não existe lista de badges próximas da expiração, cálculo automático ou alerta. |
| 21 | **Parcial** | O histórico existe, mas as transições de estado aparecem sem nomes e não inclui uma vista transversal pesquisável. |

Bónus em falta: timeline de evolução profissional por consultor.

Problemas adicionais:

- A tab “Relatórios” devolve deliberadamente `[]`. Referência: `frontend/src/services/apiReal.js:300`.
- Os botões Excel/PDF não recebem `lista` e nunca exportam.
- O dashboard chama “Badges” à quantidade de badges do catálogo, e não a badges atribuídas.
- Não existe página de notificações no menu TM.

## 7. Perfil Administrador/Gestor

| Nº | Estado | Constatação e trabalho necessário |
|---|---|---|
| 1 | **Parcial** | CRUD de utilizadores existe, mas só permite um perfil de cada vez, não atribui área/Service Line e não apresenta todas as permissões. A remoção apresentada como “desativar” faz hard delete. |
| 2 | **Parcial** | Cria utilizadores e papel, mas não configura área do Consultor nem Service Line do SLL. Não envia confirmação de registo. |
| 3 | **Parcial/quebrado** | A grelha CRUD de badges envia `nivel`, mas a API exige `nivelId`; a criação real tende a falhar. Faltam estado ativo, tipo, fornecedor, custo, expiração, duração, imagem e slug. |
| 4 | **Parcial/quebrado** | Existem CRUDs genéricos, mas a chave primária de Level é confundida com `areaId`, podendo editar/apagar o nível errado. O `useEffect` das opções recebe uma nova referência a cada render e pode repetir chamadas continuamente. O formulário de requisitos não permite configurar imagem/ícone. |
| 5 | **Em falta** | Só a exportação local de utilizadores funciona. Não existem exportações funcionais por entidade/estado/período. |
| 6 | **Parcial** | O modelo suporta pontos/expiração, mas o formulário de badge só permite nome, “nível”, pontos e descrição. |
| 7 | **Estático** | Configuração de email/push apenas altera estado local e mostra “Guardado”. O modelo `NotificationConfig` não é usado pelo ecrã. |
| 8 | **Parcial** | CRUD de políticas existe, mas faltam expiração e fluxo de aceitação. Os selects booleanos enviam strings; não há garantia de coerção. |
| 9 | **Em falta** | “Pedidos” mostra apenas candidaturas `SUBMITTED`, não permite abrir/gerir, nem consultar todos os estados. |
| 12 | **Parcial/quebrado** | Informação genérica pode ser criada, mas não há página para os destinatários. Avisos são criados com `userId` do próprio Admin, portanto não são difundidos. Faltam campos ativo/inativo, tipo e público-alvo. |

Bónus em falta:

- Emails automáticos quando SLA é ultrapassado.
- Gestão de SLA por equipa de Talent/Service Line.
- Alertas push de SLA ultrapassado.

Defeitos do CRUD genérico a corrigir:

- `type="textarea"` é renderizado como `<input type="textarea">`; deve ser um `<textarea>`.
- Campos obrigatórios não recebem `required`.
- Valores numéricos e booleanos são enviados como strings.
- Chaves primárias suportadas são incompletas; `Level.id` perde para `areaId`.
- Botões “Cancelar” dentro dos formulários não têm `type="button"` e podem submeter o formulário.
- Não há pesquisa, ordenação, paginação ou feedback robusto de eliminação.
- Badges inativas e recursos apagados logicamente não têm controlos claros de reativação.

## 8. Requisitos gerais

| Requisito | Estado | Constatação |
|---|---|---|
| Responsivo desktop/mobile | **Parcial** | Consultor é razoavelmente responsivo. Os painéis Admin/TM/SLL perdem toda a navegação em mobile. |
| Decisões auditáveis | **Parcial** | O backend grava histórico, mas não inclui relações para nomes dos estados/utilizadores e o frontend mostra apenas motivo/data. |
| KPIs para gestores | **Em falta** | Os dashboards usam contagens simples e, em alguns casos, semanticamente erradas. Não cumprem o reporting mínimo. |
| HTTPS | **Configuração externa** | O frontend não força HTTPS. Deve ser garantido no Render/Vercel, incluindo `VITE_API_URL=https://.../api` e CORS restrito. |
| Login e validação | **Parcial** | Login real e campos obrigatórios existem. “Lembrar-me” é ignorado e a sessão não é revalidada. |
| Recuperar password | **Estático/em falta** | Não existem endpoints de pedido/reset, token, confirmação ou cancelamento completo. |
| Terminar sessão com confirmação | **Em falta** | Logout imediato, sem modal de confirmação/cancelamento. |
| Quatro perfis | **Parcial** | Rotas existem para os quatro perfis. Multi-role, escopos e permissões estão incompletos. |
| `%` de badges por mês | **Em falta** | Não existe endpoint, gráfico ou filtro. |
| Número de badges por intervalo | **Em falta** | Não existe. |
| Número por Learning Path | **Em falta** | Não existe. |
| Número por nível do Learning Path | **Em falta** | Não existe. |
| Número de utilizadores registados | **Parcial** | Admin reutiliza o dashboard TM e conta consultores, não todos os utilizadores registados. |
| PT/EN/ES | **Parcial** | Traduções existem; dados e mensagens da API não são localizados e gestores não têm seletor visível. |
| Saudações dinâmicas | **Parcial** | Só existe Bom dia/Boa tarde/Boa noite, sempre em português. Não há pós-registo, primeiro login ou regresso após 15 dias. |
| Página Informações/Avisos | **Em falta** | Só há CRUD Admin. TM/SLL não podem criar/editar e os utilizadores não têm uma página de informação global. |
| Teams/Slack | **Em falta** | Existe modelo genérico de integração no backend, sem endpoints especializados, UI ou envio real. |

### 8.1 Inventário consolidado de interfaces estáticas ou enganadoras

| Página/componente | Comportamento atual | Implementação necessária |
|---|---|---|
| Login - “Lembrar-me” | Checkbox sem estado nem efeito; a sessão é sempre persistida | Ligar a opção à estratégia `localStorage`/`sessionStorage` e revalidar sessão. |
| Recuperar password | A API real devolve mensagem de indisponibilidade | Implementar pedido, email com token, reset, confirmação e cancelamento. |
| Atualizar password | Temporizador e redirecionamento sem API | Validar token, nova/confirmar password e apresentar a resposta real. |
| Dashboard Consultor | Descarta Learning Path, aviso e conquista especial devolvidos pela API; eventos são sempre `[]` | Mapear dados reais, estados vazios e ações. |
| Mini perfil da Home | Iniciais fixas `US`; cargo e nível ficam vazios | Derivar do utilizador/perfil e Level/Area reais. |
| Ação “Ver diretório” | Abre `/catalogo` | Corrigir para `/consultores`. |
| Alterar password | A interface anuncia maiúscula, número e caráter especial, mas frontend e API só validam oito caracteres; também aceitam password nova igual à atual | Alinhar regras visuais e validação server-side, incluindo confirmação e igualdade com a password atual. |
| Escolha de área | Cinco áreas e contagens fixas; confirmar apenas navega | Ler áreas da API e persistir a escolha. |
| Preferências | Notificações, privacidade, tema, imagens e paginação vivem apenas em `useState` | Criar contrato de preferências e aplicar efetivamente cada opção. |
| Estatísticas das preferências | Valores fixos `1250`, `8`, `#12` | Usar dashboard/gamificação. |
| Ranking - período/categoria | Segmentos só alteram a seleção visual | Enviar filtros à API ou filtrar dados adequadamente; suportar período, pontos, badges e dias. |
| Ranking - percentil/evolução/área | Adaptador força `—`, vazio e delta vazio | Calcular e devolver métricas reais ou remover os campos até existirem. |
| Candidaturas - Partilhar | Botão sem ação | Criar partilha LinkedIn com URL da conquista individual. |
| Candidaturas - Adicionar evidências | Tenta criar candidatura duplicada | Abrir detalhe da candidatura e chamar endpoint de evidências. |
| Detalhe da badge | Parágrafos genéricos substituem conteúdo real dos requisitos | Mostrar `Requirement.description`, imagem e evidência esperada. |
| Certificado | “Download” executa `window.print()` | Consumir endpoint PDF com token individual. |
| Perfil “público” | Rota autenticada do próprio consultor | Criar rota e endpoint públicos, sujeitos a consentimento. |
| Assinatura de email | Três ícones fixos; badges reais não selecionáveis; download sem ação | Seleção de até quatro badges conquistadas, HTML real, guardar e descarregar. |
| Persistência da assinatura | O frontend envia `badgeIds: []`; o backend desativa as assinaturas e não cria nenhuma linha onde guardar `templateHtml` | Guardar configuração/template independentemente da seleção ou enviar os IDs selecionados corretamente. |
| Notificações - apagar | Apenas esconde localmente até ao próximo carregamento | Criar endpoint de eliminar/arquivar ou remover o botão. |
| Tipo das notificações | O adaptador lê `n.tipo`, mas o modelo/API devolve `type`; todas tendem a aparecer como `info` | Corrigir o mapeamento e cobrir `info`, `warning`, `success` e erros. |
| Notificações de workflow | Página lê `Notice`, mas o workflow não cria `Notice` | Criar avisos em submissão, validação, aprovação, rejeição, devolução, SLA e expiração. |
| Pesquisa dos painéis | Input sem estado, consulta ou navegação | Implementar pesquisa global por recursos permitidos ou remover. |
| Relatórios SLL | Cópia integral da lista de pedidos | Implementar KPIs, filtros, gráficos e exportações. |
| Dashboard SLL - badges atribuídas | O adaptador força `badgesAtribuidos: []`, deixando o gráfico permanentemente vazio | Criar série temporal real e filtrada pela Service Line. |
| ExportButtons em TM/SLL/Admin Pedidos | Chamado sem `data`; alerta sempre “sem dados” | Usar exportações server-side tipadas e filtradas. |
| Tab Relatórios TM | Adaptador devolve `[]` deliberadamente | Criar página/endpoint de relatórios. |
| Admin Definições | SLA/email/push locais; botão simula “Guardado” | Ler e persistir `SLAConfig`/`NotificationConfig`; aplicar regras em jobs. |
| Admin Pedidos | Só tabela de `SUBMITTED`, sem detalhe/ação | Listar todos os estados com pesquisa, detalhe e gestão auditável. |
| Detalhe SLL - evidências | Botões aprovar/rejeitar evidência sem handlers | Remover, porque a validação individual pertence ao TM, ou definir regra e API. |
| Navegação mobile de gestão | Sidebar simplesmente desaparece | Criar menu mobile para Admin/TM/SLL. |

## 9. Reporting e exportações a desenvolver

Criar uma área de relatórios comum a Admin, TM e SLL, com permissões server-side e os seguintes filtros:

- Intervalo de datas.
- Service Line e área, respeitando o âmbito do utilizador autenticado.
- Learning Path e nível.
- Badge.
- Estado da candidatura.
- Talent Manager/Service Line Leader responsável.
- Badge válida, expirada ou próxima de expirar.

Indicadores mínimos:

- Total e percentagem de badges atribuídas por mês.
- Badges atribuídas num intervalo de datas.
- Badges por Learning Path e por nível.
- Utilizadores registados, ativos e inativos.
- Candidaturas submetidas, validadas, aprovadas, rejeitadas, devolvidas e em atraso de SLA.
- Tempo médio por etapa e taxa de aprovação/rejeição.
- Ranking por Service Line/área/período.

Exportações necessárias em Excel e PDF:

- Candidaturas/pedidos.
- Badges do catálogo.
- Badges atribuídas.
- Consultores.
- Aprovações.
- Rejeições, incluindo motivo.

Os endpoints atuais `/relatorios/excel` e `/relatorios/pdf` exportam apenas todas as candidaturas, sem filtros e sem restrição de Service Line. Não devem ser reutilizados assim em produção.

## 10. Contratos de API necessários

Sugestão de backlog de contratos, a ajustar ao padrão da equipa:

### Autenticação

- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/confirm-email`
- Reenvio de confirmação de registo.
- Respostas neutras no pedido de recuperação para não revelar se um email existe.

### Preferências e RGPD

- `GET/PUT /me/preferences` para idioma, notificações e visibilidade pública.
- `GET /policies/current`
- `POST /policies/:id/accept`
- Histórico de aceitação auditável.

### Catálogo e candidatura

- Endpoint de detalhe da badge que inclua Level, Area, Service Line e requisitos completos.
- Contrato inequívoco `Badge -> Level -> Requirements`, incluindo descrições/imagens e validação de todos os requisitos obrigatórios.
- `POST /candidaturas/:id/evidencias` para candidaturas devolvidas/abertas.
- `GET /candidaturas/:id` com visão própria do consultor.
- Regras server-side para todos os requisitos obrigatórios.
- Decisão explícita: suportar links/vídeo ou remover esses tipos da interface.

### Âmbito de gestão

- Endpoints de dashboard/listagem que derivem automaticamente a Service Line do SLL.
- TM global conforme workflow, ou filtros funcionais se a regra final for por área.
- Admin com consulta de todos os estados e ações auditáveis.

### Público e certificados

- Token/slug público por `ConsultorBadge` e não por `Badge`.
- `GET /public/awards/:token` com titular, badge, datas, validade e competências certificadas.
- `GET /public/consultants/:slug` para galeria pública, respeitando consentimento RGPD.
- Download PDF pelo mesmo token individual.

### Notificações, prazos e integrações

- Criar `Notice` para submissão, validação, aprovação, rejeição e devolução.
- Job agendado para expiração de badges, lembretes e SLA.
- CRUD real de SLA e NotificationConfig.
- Endpoints de informação/avisos com público-alvo e período de publicação.
- Integrações Teams/Slack com configuração e registo de entrega.

## 11. Qualidade técnica e validação executada

Resultados obtidos no frontend:

- `npm run build`: **concluído com sucesso**.
- Bundle principal: aproximadamente **992 kB** antes de gzip; Vite alerta para chunk superior a 500 kB. Aplicar code splitting às áreas Admin/TM/SLL e às bibliotecas de PDF.
- `npm run lint`: **falha com 10 erros**, incluindo efeitos com atualizações síncronas de estado e variáveis não usadas.
- `npm audit --omit=dev`: **0 vulnerabilidades em dependências de produção**.
- `npm audit`: **3 vulnerabilidades em dependências de desenvolvimento** (1 baixa, 1 moderada e 1 alta); atualizar toolchain após validar compatibilidade.
- Não existe script/suite de testes frontend. Devem ser adicionados testes unitários e E2E para autenticação, permissões, candidatura, validação, aprovação, relatórios e páginas públicas.

## 12. Ordem de implementação recomendada

### Fase 0 - Segurança e integridade

1. Corrigir escopo do SLL e autorizações dos endpoints genéricos/users.
2. Criar token público por conquista individual.
3. Tornar a submissão de candidatura transacional e validar requisitos.
4. Remover logs de JWT e validar sessão no arranque.
5. Garantir build de produção com API real e URL HTTPS.

### Fase 1 - Fluxo principal completo

1. Corrigir catálogo/detalhe/requisitos.
2. Corrigir upload e visualização de evidências, incluindo candidaturas devolvidas.
3. Criar detalhe de candidatura do consultor com feedback e histórico.
4. Criar notificações in-app a partir do workflow.
5. Corrigir certificados PDF, página pública e LinkedIn.
6. Mostrar Learning Path, avisos e conquistas especiais já devolvidos pelo dashboard.

### Fase 2 - Perfis de gestão

1. Dashboards corretos para TM, SLL e Admin.
2. Relatórios e exportações com filtros e permissões.
3. CRUD Admin tipado e completo.
4. Gestão de utilizadores com múltiplos perfis, área e Service Line.
5. Navegação mobile para os painéis de gestão.

### Fase 3 - Funcionalidades complementares

1. Recuperação de password e confirmação de registo.
2. RGPD e preferências persistentes.
3. Expiração, timeline, lembretes, marcos e SLA.
4. Informação/avisos globais.
5. Assinaturas de email por perfil e integrações Teams/Slack.
6. Internacionalização completa de respostas e dados da API.

## 13. Critérios de aceitação para a equipa

Uma funcionalidade só deve ser marcada como concluída quando:

- Usa a API real e continua funcional após refresh e novo login.
- A autorização é validada no backend, não apenas escondida no frontend.
- Estados de loading, vazio, sucesso e erro representam a resposta real.
- Não apresenta botões, filtros ou toggles sem efeito.
- Tem teste do caso feliz, erro da API e acesso por perfil indevido.
- Respeita o âmbito do perfil, sobretudo a Service Line do SLL.
- As decisões alteram a base de dados e aparecem no histórico auditável.
- O comportamento funciona em desktop e mobile.
