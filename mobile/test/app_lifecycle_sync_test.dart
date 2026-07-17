import 'dart:async';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:softinsa_badges_mobile/widgets/app_lifecycle_sync.dart';

void main() {
  testWidgets('sincronizar nao recria o formulario filho', (tester) async {
    var initializations = 0;
    final syncRequests = StreamController<void>();

    await tester.pumpWidget(
      MaterialApp(
        home: AppLifecycleSync(
          synchronize: () async => true,
          connectivityChanges: const Stream<List<ConnectivityResult>>.empty(),
          syncRequests: syncRequests.stream,
          retryDelays: const [],
          child: _StateProbe(onInitialized: () => initializations++),
        ),
      ),
    );
    syncRequests.add(null);
    await tester.pump();

    expect(initializations, 1);
    await syncRequests.close();
  });

  testWidgets('evento durante sync fica pendente e corre no fim', (
    tester,
  ) async {
    final connectivity = StreamController<List<ConnectivityResult>>();
    final syncRequests = StreamController<void>();
    final firstSync = Completer<bool>();
    var calls = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: AppLifecycleSync(
          synchronize: () {
            calls++;
            if (calls == 1) return firstSync.future;
            return Future.value(true);
          },
          connectivityChanges: connectivity.stream,
          syncRequests: syncRequests.stream,
          retryDelays: const [],
          child: const SizedBox(),
        ),
      ),
    );
    syncRequests.add(null);
    await tester.pump();
    expect(calls, 1);

    connectivity.add(const [ConnectivityResult.none]);
    connectivity.add(const [ConnectivityResult.wifi]);
    await tester.pump();
    expect(calls, 1);

    firstSync.complete(true);
    await tester.pump();
    await tester.pump();
    expect(calls, 2);

    await connectivity.close();
    await syncRequests.close();
  });

  testWidgets('primeiro estado online apenas inicializa connectivity', (
    tester,
  ) async {
    final connectivity = StreamController<List<ConnectivityResult>>();
    var calls = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: AppLifecycleSync(
          synchronize: () async {
            calls++;
            return true;
          },
          connectivityChanges: connectivity.stream,
          syncRequests: const Stream<void>.empty(),
          retryDelays: const [],
          child: const SizedBox(),
        ),
      ),
    );

    connectivity.add(const [ConnectivityResult.wifi]);
    await tester.pump();
    expect(calls, 0);

    connectivity.add(const [ConnectivityResult.none]);
    connectivity.add(const [ConnectivityResult.wifi]);
    await tester.pump();
    expect(calls, 1);

    await connectivity.close();
  });

  testWidgets(
    'pedido da outbox inicia backoff mesmo sem mudanca de interface',
    (tester) async {
      final syncRequests = StreamController<void>();
      var calls = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: AppLifecycleSync(
            synchronize: () async {
              calls++;
              return calls >= 3;
            },
            connectivityChanges: const Stream<List<ConnectivityResult>>.empty(),
            syncRequests: syncRequests.stream,
            retryDelays: const [Duration.zero, Duration.zero],
            child: const SizedBox(),
          ),
        ),
      );
      syncRequests.add(null);
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 1));
      await tester.pump(const Duration(milliseconds: 1));
      await tester.pump(const Duration(milliseconds: 1));

      expect(calls, 3);
      await syncRequests.close();
    },
  );

  testWidgets('backoff termina depois do limite configurado', (tester) async {
    var calls = 0;
    final connectivity = StreamController<List<ConnectivityResult>>();

    await tester.pumpWidget(
      MaterialApp(
        home: AppLifecycleSync(
          synchronize: () async {
            calls++;
            return false;
          },
          connectivityChanges: connectivity.stream,
          syncRequests: const Stream<void>.empty(),
          retryDelays: const [Duration.zero, Duration.zero],
          child: const SizedBox(),
        ),
      ),
    );
    connectivity.add(const [ConnectivityResult.none]);
    connectivity.add(const [ConnectivityResult.wifi]);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 1));
    await tester.pump(const Duration(milliseconds: 1));
    await tester.pump(const Duration(milliseconds: 1));

    expect(calls, 3);
    await connectivity.close();
  });

  testWidgets('fila pendente repete o ultimo delay alem do limite', (
    tester,
  ) async {
    final syncRequests = StreamController<void>();
    var calls = 0;

    await tester.pumpWidget(
      MaterialApp(
        home: AppLifecycleSync(
          synchronize: () async {
            calls++;
            return calls >= 5;
          },
          connectivityChanges: const Stream<List<ConnectivityResult>>.empty(),
          syncRequests: syncRequests.stream,
          retryDelays: const [Duration.zero, Duration.zero],
          child: const SizedBox(),
        ),
      ),
    );
    syncRequests.add(null);
    for (var index = 0; index < 7; index++) {
      await tester.pump(const Duration(milliseconds: 1));
    }

    expect(calls, 5);
    await syncRequests.close();
  });
}

class _StateProbe extends StatefulWidget {
  const _StateProbe({required this.onInitialized});

  final VoidCallback onInitialized;

  @override
  State<_StateProbe> createState() => _StateProbeState();
}

class _StateProbeState extends State<_StateProbe> {
  @override
  void initState() {
    super.initState();
    widget.onInitialized();
  }

  @override
  Widget build(BuildContext context) => const SizedBox();
}
