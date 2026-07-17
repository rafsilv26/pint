import 'package:flutter/foundation.dart';

/// Avisa os ecras de que a sincronizacao ja atualizou a base de dados local.
///
/// O aviso nao recria a arvore da aplicacao: cada pagina interessada volta a
/// ler apenas os seus dados do SQLite, preservando rotas, formularios e ficheiros
/// que o utilizador tenha selecionado.
class AppDataRefreshService extends ChangeNotifier {
  AppDataRefreshService();

  static final AppDataRefreshService instance = AppDataRefreshService();

  void dataChanged() {
    notifyListeners();
  }
}
