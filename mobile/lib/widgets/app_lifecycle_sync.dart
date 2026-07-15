import 'package:flutter/material.dart';

import '../services/app_sync_service.dart';

/// Sincroniza a pedido quando a app regressa ao primeiro plano. Nao usa
/// temporizadores: um toque numa notificacao push/resume apenas verifica a
/// versao e descarrega dados se a API confirmar alteracoes.
class AppLifecycleSync extends StatefulWidget {
  const AppLifecycleSync({super.key, required this.child});

  final Widget child;

  @override
  State<AppLifecycleSync> createState() => _AppLifecycleSyncState();
}

class _AppLifecycleSyncState extends State<AppLifecycleSync>
    with WidgetsBindingObserver {
  int generation = 0;
  bool syncing = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) _sync();
  }

  Future<void> _sync() async {
    if (syncing) return;
    syncing = true;
    final succeeded = await AppSyncService().synchronizeIfNeeded();
    syncing = false;
    if (succeeded && mounted) setState(() => generation++);
  }

  @override
  Widget build(BuildContext context) {
    return KeyedSubtree(key: ValueKey(generation), child: widget.child);
  }
}
