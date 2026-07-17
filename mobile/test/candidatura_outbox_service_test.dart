import 'dart:async';
import 'dart:io';

import 'package:flutter_test/flutter_test.dart';
import 'package:softinsa_badges_mobile/models/mobile_api_data.dart';
import 'package:softinsa_badges_mobile/models/pending_badge_application.dart';
import 'package:softinsa_badges_mobile/services/auth_service.dart';
import 'package:softinsa_badges_mobile/services/badges_api_service.dart';
import 'package:softinsa_badges_mobile/services/candidatura_outbox_service.dart';
import 'package:softinsa_badges_mobile/services/local_badges_database.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test('offline guarda a candidatura sem chamar a API', () async {
    final store = _MemoryStore();
    final api = _Api();
    final service = CandidaturaOutboxService(
      apiService: api,
      store: store,
      sessionProvider: () async => _session(22),
      connectivityProvider: () async => false,
      requestIdProvider: () => 'pedido-offline',
    );

    final result = await service.submit(badgeId: 42, evidenceFiles: const []);

    expect(result.isQueued, isTrue);
    expect(api.submitCalls, 0);
    expect(store.items.single.clientRequestId, 'pedido-offline');
    expect(store.items.single.state, 'queued');
  });

  test('envia a candidatura pendente quando a ligacao regressa', () async {
    var connected = false;
    final store = _MemoryStore();
    final api = _Api();
    final service = CandidaturaOutboxService(
      apiService: api,
      store: store,
      sessionProvider: () async => _session(22),
      connectivityProvider: () async => connected,
      requestIdProvider: () => 'pedido-reenviado',
    );

    await service.submit(badgeId: 42, evidenceFiles: const []);
    connected = true;
    final flush = await service.flushPendingApplications();

    expect(flush.sentAny, isTrue);
    expect(api.submitCalls, 1);
    expect(api.lastClientRequestId, 'pedido-reenviado');
    expect(api.lastAuthToken, 'token-22');
    expect(store.items.single.state, 'sent');

    await service.completeSentApplications(_session(22));
    expect(store.items, isEmpty);
  });

  test('erro de validacao nao fica na fila para repeticao', () async {
    final store = _MemoryStore();
    final service = CandidaturaOutboxService(
      apiService: _Api(error: const ApiRequestException(400, 'Inválida.')),
      store: store,
      sessionProvider: () async => _session(22),
      connectivityProvider: () async => true,
      requestIdProvider: () => 'pedido-invalido',
    );

    await expectLater(
      service.submit(badgeId: 42, evidenceFiles: const []),
      throwsA(
        isA<ApiRequestException>().having(
          (error) => error.statusCode,
          'statusCode',
          400,
        ),
      ),
    );
    expect(store.items, isEmpty);
  });

  test('nunca envia a fila pertencente a outro utilizador', () async {
    final store = _MemoryStore();
    await store.enqueue(
      clientRequestId: 'pedido-user-99',
      ownerUserId: 99,
      badgeId: 42,
      evidenceFiles: const [],
    );
    final api = _Api();
    final service = CandidaturaOutboxService(
      apiService: api,
      store: store,
      sessionProvider: () async => _session(22),
      connectivityProvider: () async => true,
    );

    final result = await service.flushPendingApplications();

    expect(result.sentAny, isFalse);
    expect(api.submitCalls, 0);
    expect(store.items.single.ownerUserId, 99);
  });

  test('dois gatilhos concorrentes fazem apenas um POST', () async {
    final store = _MemoryStore();
    await store.enqueue(
      clientRequestId: 'pedido-unico',
      ownerUserId: 22,
      badgeId: 42,
      evidenceFiles: const [],
    );
    final release = Completer<void>();
    final api = _Api(beforeResponse: () => release.future);
    final service = CandidaturaOutboxService(
      apiService: api,
      store: store,
      sessionProvider: () async => _session(22),
      connectivityProvider: () async => true,
    );

    final first = service.flushPendingApplications();
    final second = service.flushPendingApplications();
    await Future<void>.delayed(Duration.zero);
    release.complete();
    await Future.wait([first, second]);

    expect(api.submitCalls, 1);
  });

  test(
    'submissoes concorrentes com filtros diferentes sao ambas enviadas',
    () async {
      final store = _MemoryStore();
      final release = Completer<void>();
      final api = _Api(beforeResponse: () => release.future);
      final requestIds = ['pedido-a', 'pedido-b'].iterator;
      final service = CandidaturaOutboxService(
        apiService: api,
        store: store,
        sessionProvider: () async => _session(22),
        connectivityProvider: () async => true,
        requestIdProvider: () {
          requestIds.moveNext();
          return requestIds.current;
        },
      );

      final first = service.submit(badgeId: 41, evidenceFiles: const []);
      await Future<void>.delayed(Duration.zero);
      final second = service.submit(badgeId: 42, evidenceFiles: const []);
      await Future<void>.delayed(Duration.zero);

      release.complete();
      final results = await Future.wait([first, second]);

      expect(api.submitCalls, 2);
      expect(results.every((result) => !result.isQueued), isTrue);
    },
  );

  test(
    'filas de utilizadores diferentes nao partilham o mesmo flush',
    () async {
      final store = _MemoryStore();
      await store.enqueue(
        clientRequestId: 'pedido-22',
        ownerUserId: 22,
        badgeId: 41,
        evidenceFiles: const [],
      );
      await store.enqueue(
        clientRequestId: 'pedido-99',
        ownerUserId: 99,
        badgeId: 42,
        evidenceFiles: const [],
      );
      final release = Completer<void>();
      final api22 = _Api(beforeResponse: () => release.future);
      final api99 = _Api();
      final service22 = CandidaturaOutboxService(
        apiService: api22,
        store: store,
        sessionProvider: () async => _session(22),
        connectivityProvider: () async => true,
      );
      final service99 = CandidaturaOutboxService(
        apiService: api99,
        store: store,
        sessionProvider: () async => _session(99),
        connectivityProvider: () async => true,
      );

      final first = service22.flushPendingApplications();
      await Future<void>.delayed(Duration.zero);
      final second = service99.flushPendingApplications();
      await Future<void>.delayed(Duration.zero);

      expect(api22.submitCalls, 1);
      expect(api99.submitCalls, 1);
      release.complete();
      await Future.wait([first, second]);
    },
  );

  test('handshake e resposta incerta permanecem na fila', () async {
    for (final error in <Object>[
      const HandshakeException('TLS indisponivel'),
      const ApiInvalidResponseException(),
    ]) {
      final store = _MemoryStore();
      var syncRequests = 0;
      final service = CandidaturaOutboxService(
        apiService: _Api(error: error),
        store: store,
        sessionProvider: () async => _session(22),
        connectivityProvider: () async => true,
        requestIdProvider: () => 'pedido-incerto-$syncRequests',
        syncRequestCallback: () => syncRequests++,
      );

      final result = await service.submit(badgeId: 42, evidenceFiles: const []);

      expect(result.isQueued, isTrue);
      expect(store.items.single.state, 'queued');
      expect(syncRequests, 1);

      final retry = await service.flushPendingApplications();
      expect(retry.retryPending, isTrue);
    }
  });

  test('fila emite trigger quando nao ha Internet', () async {
    var syncRequests = 0;
    final service = CandidaturaOutboxService(
      apiService: _Api(),
      store: _MemoryStore(),
      sessionProvider: () async => _session(22),
      connectivityProvider: () async => false,
      requestIdProvider: () => 'pedido-sem-wan',
      syncRequestCallback: () => syncRequests++,
    );

    final result = await service.submit(badgeId: 42, evidenceFiles: const []);

    expect(result.isQueued, isTrue);
    expect(syncRequests, 1);
  });

  test('envia identificador estavel para cada evidencia', () async {
    final directory = await Directory.systemTemp.createTemp('outbox-test-');
    addTearDown(() => directory.delete(recursive: true));
    final evidence = File('${directory.path}/evidencia.pdf');
    await evidence.writeAsBytes(const [0x25, 0x50, 0x44, 0x46]);
    final api = _Api();
    final service = CandidaturaOutboxService(
      apiService: api,
      store: _MemoryStore(),
      sessionProvider: () async => _session(22),
      connectivityProvider: () async => true,
      requestIdProvider: () => 'pedido-evidencia',
    );

    await service.submit(
      badgeId: 42,
      evidenceFiles: [
        EvidenceAttachment(
          requirementId: 7,
          path: evidence.path,
          fileName: 'evidencia.pdf',
        ),
      ],
    );

    expect(api.lastClientEvidenceIds, ['pedido-evidencia:1']);
  });

  test('nao envia se a conta mudar antes do POST', () async {
    final store = _MemoryStore();
    var session = _session(22, token: 'token-antigo');
    var reads = 0;
    final api = _Api();
    final service = CandidaturaOutboxService(
      apiService: api,
      store: store,
      sessionProvider: () async {
        reads++;
        if (reads == 2) session = _session(99, token: 'token-novo');
        return session;
      },
      connectivityProvider: () async => true,
      requestIdProvider: () => 'pedido-conta-antiga',
    );

    final result = await service.submit(badgeId: 42, evidenceFiles: const []);

    expect(result.isQueued, isTrue);
    expect(api.submitCalls, 0);
    expect(store.items.single.ownerUserId, 22);
    expect(store.items.single.state, 'queued');
  });

  test('nao envia se o JWT mudar mesmo mantendo o mesmo utilizador', () async {
    final store = _MemoryStore();
    var reads = 0;
    final api = _Api();
    final service = CandidaturaOutboxService(
      apiService: api,
      store: store,
      sessionProvider: () async {
        reads++;
        return _session(
          22,
          token: reads == 1 ? 'token-original' : 'token-renovado',
        );
      },
      connectivityProvider: () async => true,
      requestIdProvider: () => 'pedido-token-original',
    );

    final result = await service.submit(badgeId: 42, evidenceFiles: const []);

    expect(result.isQueued, isTrue);
    expect(api.submitCalls, 0);
    expect(store.items.single.state, 'queued');
  });

  test('cleanup nao apaga sent se a sessao tiver mudado', () async {
    final store = _MemoryStore();
    final pending = await store.enqueue(
      clientRequestId: 'pedido-owner-b',
      ownerUserId: 22,
      badgeId: 42,
      evidenceFiles: const [],
    );
    await store.markSent(pending.localId);
    var activeSession = _session(99, token: 'token-owner-a');
    final service = CandidaturaOutboxService(
      store: store,
      sessionProvider: () async => activeSession,
    );

    await service.completeSentApplications(
      _session(22, token: 'token-owner-b'),
    );
    expect(store.items, hasLength(1));

    activeSession = _session(22, token: 'token-owner-b');
    await service.completeSentApplications(activeSession);
    expect(store.items, isEmpty);
  });

  test(
    'dois enqueues concorrentes do mesmo owner e badge criam uma fila',
    () async {
      final database = LocalBadgesDatabase.instance;
      final suffix = DateTime.now().microsecondsSinceEpoch;
      final ownerId = 800000 + suffix % 100000;
      final badgeId = 900000 + suffix % 100000;

      final results = await Future.wait([
        database.enqueuePendingBadgeApplication(
          clientRequestId: 'concorrente-a-$suffix',
          ownerUserId: ownerId,
          badgeId: badgeId,
          evidenceFiles: const [],
        ),
        database.enqueuePendingBadgeApplication(
          clientRequestId: 'concorrente-b-$suffix',
          ownerUserId: ownerId,
          badgeId: badgeId,
          evidenceFiles: const [],
        ),
      ]);
      final rows = await database.getPendingBadgeApplications(
        ownerId,
        badgeId: badgeId,
      );

      expect(results[0].localId, results[1].localId);
      expect(rows, hasLength(1));
      await database.deletePendingBadgeApplication(rows.single.localId);
    },
  );
}

AuthSessionSnapshot _session(int userId, {String? token}) {
  return AuthSessionSnapshot(userId: userId, token: token ?? 'token-$userId');
}

class _Api extends BadgesApiService {
  _Api({this.error, this.beforeResponse});

  final Object? error;
  final Future<void> Function()? beforeResponse;
  int submitCalls = 0;
  String? lastClientRequestId;
  List<String> lastClientEvidenceIds = const [];
  String? lastAuthToken;

  @override
  Future<Map<String, dynamic>?> submitCandidatura({
    required int badgeId,
    List<int> requisitoIds = const [],
    List<EvidenceAttachment> evidenceFiles = const [],
    List<String> clientEvidenceIds = const [],
    String? descricao,
    String? clientRequestId,
    String? authToken,
  }) async {
    submitCalls++;
    lastClientRequestId = clientRequestId;
    lastClientEvidenceIds = clientEvidenceIds;
    lastAuthToken = authToken;
    await beforeResponse?.call();
    final failure = error;
    if (failure != null) throw failure;
    return {'mensagem': 'Candidatura enviada.', 'candidaturaId': 71};
  }
}

class _MemoryStore implements CandidaturaOutboxStore {
  final List<PendingBadgeApplication> items = [];
  int nextId = 1;

  @override
  Future<PendingBadgeApplication> enqueue({
    required String clientRequestId,
    required int ownerUserId,
    required int badgeId,
    required List<EvidenceAttachment> evidenceFiles,
    String? description,
  }) async {
    final now = DateTime.now().toUtc();
    final item = PendingBadgeApplication(
      localId: nextId++,
      clientRequestId: clientRequestId,
      ownerUserId: ownerUserId,
      badgeId: badgeId,
      description: description,
      state: 'queued',
      attemptCount: 0,
      createdAt: now,
      updatedAt: now,
      evidences: [
        for (var index = 0; index < evidenceFiles.length; index++)
          PendingBadgeEvidence(
            id: index + 1,
            requirementId: evidenceFiles[index].requirementId,
            storedPath: evidenceFiles[index].path,
            originalName: evidenceFiles[index].fileName,
          ),
      ],
    );
    items.add(item);
    return item;
  }

  @override
  Future<List<PendingBadgeApplication>> getForOwner(
    int ownerUserId, {
    String? clientRequestId,
    List<String>? states,
  }) async {
    return items.where((item) {
      return item.ownerUserId == ownerUserId &&
          (clientRequestId == null ||
              item.clientRequestId == clientRequestId) &&
          (states == null || states.contains(item.state));
    }).toList();
  }

  @override
  Future<void> markRetry(
    int localId, {
    required String error,
    int? httpStatus,
  }) async {
    _replace(
      localId,
      (item) => item.copyWith(
        state: 'queued',
        attemptCount: item.attemptCount + 1,
        lastError: error,
        lastHttpStatus: httpStatus,
      ),
    );
  }

  @override
  Future<void> markSent(int localId, {int? serverApplicationId}) async {
    _replace(
      localId,
      (item) => item.copyWith(
        state: 'sent',
        attemptCount: item.attemptCount + 1,
        serverApplicationId: serverApplicationId,
      ),
    );
  }

  @override
  Future<void> markFailed(
    int localId, {
    required String error,
    int? httpStatus,
  }) async {
    _replace(
      localId,
      (item) => item.copyWith(
        state: 'failed',
        attemptCount: item.attemptCount + 1,
        lastError: error,
        lastHttpStatus: httpStatus,
      ),
    );
  }

  @override
  Future<void> delete(int localId) async {
    items.removeWhere((item) => item.localId == localId);
  }

  @override
  Future<void> deleteSentForOwner(int ownerUserId) async {
    items.removeWhere(
      (item) => item.ownerUserId == ownerUserId && item.state == 'sent',
    );
  }

  void _replace(
    int localId,
    PendingBadgeApplication Function(PendingBadgeApplication) update,
  ) {
    final index = items.indexWhere((item) => item.localId == localId);
    items[index] = update(items[index]);
  }
}
