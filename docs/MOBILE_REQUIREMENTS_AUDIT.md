# Auditoria dos requisitos mobile

Fonte verificada: tabela "Plataforma Mobile - Consultor" do enunciado
`PINT_2025_Plataforma de Badges da Softinsa - V3.2 - Mobile.pdf`.

## Fluxo de dados pedido em PDM

Implementado: `API -> SQLite -> Repository -> Interface`.

- `/api/mobile-sync/status` devolve uma versao SHA-256 e `changed`.
- o mobile pede os datasets apenas quando `changed == true`;
- a versao so e guardada depois de uma sincronizacao completa;
- os ecras leem os repositories/SQLite e continuam disponiveis sem rede;
- arranque, login, regresso ao foreground e push usam o mesmo gate de versao,
  sem polling periodico.

Evidencia principal: `mobileSyncController.js`, `app_sync_service.dart`,
`local_badges_database.dart`, `mobile_api_repository.dart` e
`app_lifecycle_sync.dart`.

## Matriz funcional

| Req. | Resultado | Evidencia de implementacao |
| --- | --- | --- |
| 1 | Implementado | Auto-registo, confirmacao real por email antes do login e alteracao forcada da password no primeiro acesso (`authController`, `register_page`, `confirmation_page`, `auth_gate`). |
| 2 | Implementado | Escolha obrigatoria de uma area ativa no registo; area e usada no perfil e nas recomendacoes (`authController`, `register_page`). |
| 3 | Implementado | Catalogo integral vindo da API e persistido em SQLite (`catalog_page`, `local_badges_database`). |
| 4 | Implementado | Dashboard pessoal com percurso e progresso (`home_page`, `dashboard_repository`). |
| 5 | Implementado | Selecao e upload de evidencias na candidatura (`badge_detail_page`, `badges_api_service`). |
| 6 | Implementado | Estado atual da candidatura e atualizacao por sync/push (`my_badges_page`, `notification.service`). |
| 7 | Implementado | Badges conquistadas, em curso e historico de transicoes/comentarios (`my_badges_page`, `mobile_api_data`). |
| 8 | Implementado | Descricao no catalogo e detalhe da badge (`catalog_page`, `badge_detail_page`). |
| 9 | Implementado | Requisitos associados apresentados no detalhe (`badge_detail_page`). |
| 10 | Implementado | Politicas RGPD pendentes bloqueiam a aplicacao ate serem aceites na API (`rgpd_policy_page`, `auth_service`). |
| 11 | Implementado | Partilha LinkedIn da pagina publica da conquista (`public_links_service`, `my_badges_page`). |
| 13 | Implementado | Pontos totais e por badge no dashboard/historico (`home_page`, `my_badges_page`). |
| 14 | Implementado | Conquistas premium/especiais consultaveis (`special_achievements_page`, `home_page`). |
| 15 | Implementado | Metricas visuais de progresso e percentagens (`home_page`, `gamification_page`). |
| 16 | Implementado | Celebracao visual ao atingir marcos de badges (`home_page`). |
| 17 | Implementado | Recomendacoes de proximas badges personalizadas (`gamification_page`, dados locais sincronizados). |
| 18 | Implementado | Download/abertura de certificado PDF personalizado (`public_links_service`, `relatorioController`, `pdf.service`). |
| 19 | Implementado | Email automatico apos submissao da candidatura (`candidaturaController`, `email.service`). |
| 20 | Implementado | Aviso in-app, email e push na aprovacao/rejeicao (`candidaturaController`, `pushNotification.service`). |
| 21 | Implementado | Job de validade cria aviso/push deduplicado; a app mostra data, estado expirado e alerta de proximidade (`expirationAlert.service`, `my_badges_page`). |
| 22 | Implementado | Objetivos com prazo/prioridade, conclusao, remocao e realce de atrasos (`gamification_page`, endpoints timeline). |
| 24 | Implementado | Pagina publica individual em `/badge/:token` (`PublicBadgePage.jsx`, `relatorioController`). |
| 25 | Implementado | Token UUID unico por conquista, backfill das antigas e endpoint publico de verificacao (`ConsultorBadge`, `publicBadgeToken.service`). |
| 26 | Implementado | Pagina publica e certificado mostram os dados/competencias certificados (`PublicBadgePage.jsx`, `pdf.service`). |
| Bonus: timeline | Implementado | Timeline de evolucao profissional editavel (`gamification_page`). |
| Bonus: push/SLA | Implementado | FCM para mudancas, avisos e SLA; push aciona sync condicionado pela versao (`DevicePushToken`, `sla.service`, `push_notification_service.dart`). |

Os numeros 12 e 23 nao constam da tabela de requisitos fornecida.

## Requisitos gerais aplicaveis

- sessao persistente e opcao de memorizar dados de login;
- validacao visual a vermelho nos formularios de autenticacao;
- recuperacao de password com cancelar e confirmacao de sucesso;
- confirmacao/cancelamento de logout;
- portugues, ingles e espanhol;
- saudacao de primeiro acesso, por periodo do dia e de regresso apos 15 dias;
- HTTPS configuravel pela URL da API e navegacao responsiva Flutter;
- pagina de notificacoes/avisos alimentada pelos dados locais.

## Validacao executada

- `flutter analyze`: sem problemas;
- `flutter test`: 25 testes aprovados;
- `flutter build apk --debug`: APK criado com sucesso;
- `node --check` em todos os ficheiros backend alterados: aprovado;
- testes backend de email e isolamento por Service Line: 7 aprovados;
- carregamento dos novos modulos backend com `DATABASE_URL` de teste: aprovado.
