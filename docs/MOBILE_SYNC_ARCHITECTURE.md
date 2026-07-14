# Arquitetura de dados da aplicacao mobile

Esta implementacao segue o fluxo pedido nas aulas 7 e 9 e na ficha 10 de PDM:

```text
API -> SQLite local -> Repository (leitura local) -> Interface Flutter
```

## Arranque e atualizacao a pedido

1. A aplicacao le de `SharedPreferences` a ultima versao de dados conhecida.
2. Faz apenas `GET /api/mobile-sync/status?version=<versao>`.
3. A API calcula uma assinatura SHA-256 leve a partir da quantidade, data mais
   recente e estados relevantes das tabelas que alimentam o mobile.
4. Se `changed` for `false`, nao e feito qualquer pedido aos endpoints de dados.
5. Se `changed` for `true`, os servicos descarregam os dados e gravam-nos em
   SQLite. A nova versao so e guardada depois de todas as sincronizacoes terem
   terminado com sucesso.
6. Os ecras consultam os repositories, que leem exclusivamente SQLite.

O mesmo processo e usado no arranque, depois do login e num gesto de refresh.
Nao existe temporizador nem sincronizacao periodica. Se a rede falhar, a versao
nao avanca e a interface continua a apresentar os dados locais.

## Escritas

Operacoes iniciadas pelo utilizador (por exemplo, submeter candidatura ou
marcar notificacao como lida) continuam a ser enviadas diretamente para a API.
Depois de uma escrita confirmada, apenas os recursos afetados sao atualizados
na base local.

## Notificacoes push

O backend regista os tokens dos dispositivos autenticados em
`DEVICE_PUSH_TOKEN` e envia notificacoes FCM quando cria avisos, quando uma
candidatura muda de estado e quando o SLA e ultrapassado. Todas levam o comando
`atualizar`.

Ao receber esse comando em foreground, background ou ao abrir a notificacao, o
mobile chama silenciosamente `AppSyncService.synchronizeIfNeeded()`. Mesmo
nesse caso, a aplicacao consulta primeiro `/api/mobile-sync/status`: os dados da
API so sao descarregados quando a assinatura tiver mudado.

O mobile tambem volta a fazer esta verificacao quando regressa ao primeiro
plano. Nao existe polling periodico.

## Configuracao Firebase

No backend deve ser definida `FIREBASE_SERVICE_ACCOUNT_JSON` com o JSON da
conta de servico Firebase numa unica linha. Se ja existir a configuracao global
de notificacoes, a opcao PUSH tem tambem de estar ativa no painel Admin.

No arranque/build Flutter devem ser passados os valores publicos do projeto:

```bash
flutter run \
  --dart-define=FIREBASE_API_KEY=... \
  --dart-define=FIREBASE_APP_ID=... \
  --dart-define=FIREBASE_IOS_APP_ID=... \
  --dart-define=FIREBASE_MESSAGING_SENDER_ID=... \
  --dart-define=FIREBASE_PROJECT_ID=... \
  --dart-define=FIREBASE_STORAGE_BUCKET=...
```

`FIREBASE_IOS_APP_ID` e opcional quando Android e iOS partilham o mesmo App ID.
Sem estas variaveis, o suporte push fica inativo de forma segura e a restante
aplicacao continua funcional.
