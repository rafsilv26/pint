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

O ponto de entrada para uma futura notificacao Firebase com comando
`atualizar` e `AppSyncService.synchronizeIfNeeded()`. A notificacao deve chamar
este metodo silenciosamente; o metodo verifica primeiro a versao e so depois
descarrega dados, correspondendo ao fluxo apresentado na aula 9.
