import 'dart:async';

/// Gatilhos pontuais para tentar sincronizar enquanto a app esta ativa.
///
/// Nao e um temporizador periodico. A fila emite um evento quando uma submissao
/// fica pendente e o ciclo de vida trata-o com um numero limitado de tentativas.
class AppSyncTriggerService {
  AppSyncTriggerService._();

  static final AppSyncTriggerService instance = AppSyncTriggerService._();

  final StreamController<void> _controller = StreamController<void>.broadcast(
    sync: true,
  );

  Stream<void> get requests => _controller.stream;

  void requestSync() {
    _controller.add(null);
  }
}
