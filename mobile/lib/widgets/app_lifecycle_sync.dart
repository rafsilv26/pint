import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';

import '../services/app_sync_service.dart';
import '../services/app_sync_trigger_service.dart';

/// Sincroniza a pedido quando a app regressa ao primeiro plano ou a rede volta.
/// Uma falha normal inicia um ciclo limitado de backoff. Quando a outbox
/// confirma trabalho pendente, mantem tentativas espacadas (maximo 120 s)
/// enquanto a app esta ativa; os dados so sao descarregados se a API confirmar
/// alteracoes.
class AppLifecycleSync extends StatefulWidget {
  const AppLifecycleSync({
    super.key,
    required this.child,
    this.synchronize,
    this.connectivityChanges,
    this.syncRequests,
    this.retryDelays = const [
      Duration(seconds: 2),
      Duration(seconds: 5),
      Duration(seconds: 15),
      Duration(seconds: 30),
      Duration(seconds: 60),
      Duration(seconds: 120),
    ],
  });

  final Widget child;
  final Future<bool> Function()? synchronize;
  final Stream<List<ConnectivityResult>>? connectivityChanges;
  final Stream<void>? syncRequests;
  final List<Duration> retryDelays;

  @override
  State<AppLifecycleSync> createState() => _AppLifecycleSyncState();
}

class _AppLifecycleSyncState extends State<AppLifecycleSync>
    with WidgetsBindingObserver {
  late final Future<bool> Function() synchronize;

  bool syncing = false;
  bool syncRequested = false;
  bool retryWhilePending = false;
  bool appIsActive = true;
  bool? hadNetworkInterface;
  int retryIndex = 0;
  Timer? retryTimer;
  StreamSubscription<List<ConnectivityResult>>? connectivitySubscription;
  StreamSubscription<void>? syncRequestSubscription;

  @override
  void initState() {
    super.initState();
    synchronize = widget.synchronize ?? AppSyncService().synchronizeIfNeeded;
    final lifecycleState = WidgetsBinding.instance.lifecycleState;
    appIsActive =
        lifecycleState == null || lifecycleState == AppLifecycleState.resumed;
    WidgetsBinding.instance.addObserver(this);
    connectivitySubscription =
        (widget.connectivityChanges ?? Connectivity().onConnectivityChanged)
            .listen(_connectivityChanged, onError: (_) {});
    syncRequestSubscription =
        (widget.syncRequests ?? AppSyncTriggerService.instance.requests).listen(
          (_) => _requestSync(pendingWork: true),
          onError: (_) {},
        );
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    connectivitySubscription?.cancel();
    syncRequestSubscription?.cancel();
    retryTimer?.cancel();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      appIsActive = true;
      _requestSync();
      return;
    }

    appIsActive = false;
    retryTimer?.cancel();
    retryTimer = null;
  }

  void _connectivityChanged(List<ConnectivityResult> results) {
    final hasNetwork = results.any(
      (result) => result != ConnectivityResult.none,
    );
    final previousNetworkState = hadNetworkInterface;
    hadNetworkInterface = hasNetwork;
    if (previousNetworkState == null) return;
    final connectionReturned = hasNetwork && !previousNetworkState;
    if (connectionReturned) _requestSync();
  }

  void _requestSync({bool pendingWork = false}) {
    if (pendingWork) retryWhilePending = true;
    retryTimer?.cancel();
    retryTimer = null;
    retryIndex = 0;
    syncRequested = true;
    if (appIsActive) unawaited(_drainSyncRequests());
  }

  Future<void> _drainSyncRequests() async {
    if (syncing || !appIsActive) return;
    syncing = true;
    try {
      while (mounted && appIsActive && syncRequested) {
        syncRequested = false;
        final succeeded = await synchronize();
        if (!mounted) return;

        if (succeeded) {
          retryIndex = 0;
          retryWhilePending = false;
        } else if (!syncRequested) {
          _scheduleRetry();
        }
      }
    } finally {
      syncing = false;
      if (mounted && appIsActive && syncRequested && retryTimer == null) {
        unawaited(_drainSyncRequests());
      }
    }
  }

  void _scheduleRetry() {
    if (!appIsActive || retryTimer != null) return;
    if (widget.retryDelays.isEmpty) return;
    final delay = retryIndex < widget.retryDelays.length
        ? widget.retryDelays[retryIndex++]
        : retryWhilePending
        ? widget.retryDelays.last
        : null;
    if (delay == null) return;
    retryTimer = Timer(delay, () {
      retryTimer = null;
      if (!mounted || !appIsActive) return;
      syncRequested = true;
      unawaited(_drainSyncRequests());
    });
  }

  @override
  Widget build(BuildContext context) {
    return widget.child;
  }
}
