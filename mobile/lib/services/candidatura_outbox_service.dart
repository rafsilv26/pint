import 'dart:async';
import 'dart:io';
import 'dart:math';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:http/http.dart' as http;

import '../models/mobile_api_data.dart';
import '../models/pending_badge_application.dart';
import 'auth_service.dart';
import 'app_sync_trigger_service.dart';
import 'badges_api_service.dart';
import 'local_badges_database.dart';

abstract interface class CandidaturaOutbox {
  Future<BadgeApplicationSubmissionResult> submit({
    required int badgeId,
    required List<EvidenceAttachment> evidenceFiles,
    String? description,
  });

  Future<OutboxFlushResult> flushPendingApplications();

  Future<bool> hasPendingWork();

  Future<bool> hasSentApplicationsAwaitingRefresh();

  Future<void> completeSentApplications(AuthSessionSnapshot session);
}

abstract interface class CandidaturaOutboxStore {
  Future<PendingBadgeApplication> enqueue({
    required String clientRequestId,
    required int ownerUserId,
    required int badgeId,
    required List<EvidenceAttachment> evidenceFiles,
    String? description,
  });

  Future<List<PendingBadgeApplication>> getForOwner(
    int ownerUserId, {
    String? clientRequestId,
    List<String>? states,
  });

  Future<void> markRetry(int localId, {required String error, int? httpStatus});

  Future<void> markSent(int localId, {int? serverApplicationId});

  Future<void> markFailed(
    int localId, {
    required String error,
    int? httpStatus,
  });

  Future<void> delete(int localId);

  Future<void> deleteSentForOwner(int ownerUserId);
}

class LocalCandidaturaOutboxStore implements CandidaturaOutboxStore {
  LocalCandidaturaOutboxStore(this.database);

  final LocalBadgesDatabase database;

  @override
  Future<PendingBadgeApplication> enqueue({
    required String clientRequestId,
    required int ownerUserId,
    required int badgeId,
    required List<EvidenceAttachment> evidenceFiles,
    String? description,
  }) {
    return database.enqueuePendingBadgeApplication(
      clientRequestId: clientRequestId,
      ownerUserId: ownerUserId,
      badgeId: badgeId,
      evidenceFiles: evidenceFiles,
      description: description,
    );
  }

  @override
  Future<List<PendingBadgeApplication>> getForOwner(
    int ownerUserId, {
    String? clientRequestId,
    List<String>? states,
  }) {
    return database.getPendingBadgeApplications(
      ownerUserId,
      clientRequestId: clientRequestId,
      states: states,
    );
  }

  @override
  Future<void> markRetry(
    int localId, {
    required String error,
    int? httpStatus,
  }) {
    return database.markPendingBadgeApplicationRetry(
      localId,
      error: error,
      httpStatus: httpStatus,
    );
  }

  @override
  Future<void> markSent(int localId, {int? serverApplicationId}) {
    return database.markPendingBadgeApplicationSent(
      localId,
      serverApplicationId: serverApplicationId,
    );
  }

  @override
  Future<void> markFailed(
    int localId, {
    required String error,
    int? httpStatus,
  }) {
    return database.markPendingBadgeApplicationFailed(
      localId,
      error: error,
      httpStatus: httpStatus,
    );
  }

  @override
  Future<void> delete(int localId) {
    return database.deletePendingBadgeApplication(localId);
  }

  @override
  Future<void> deleteSentForOwner(int ownerUserId) {
    return database.deleteSentPendingBadgeApplications(ownerUserId);
  }
}

class OutboxFlushResult {
  const OutboxFlushResult({
    this.sentMessages = const {},
    this.permanentErrors = const {},
    this.retryPending = false,
    this.localStateChanged = false,
    this.session,
  });

  final Map<String, String> sentMessages;
  final Map<String, Object> permanentErrors;
  final bool retryPending;
  final bool localStateChanged;
  final AuthSessionSnapshot? session;

  bool get sentAny => sentMessages.isNotEmpty;
}

class CandidaturaOutboxService implements CandidaturaOutbox {
  CandidaturaOutboxService({
    BadgesApiService? apiService,
    LocalBadgesDatabase? database,
    CandidaturaOutboxStore? store,
    Future<AuthSessionSnapshot?> Function()? sessionProvider,
    Future<bool> Function()? connectivityProvider,
    String Function()? requestIdProvider,
    void Function()? syncRequestCallback,
  }) : apiService = apiService ?? BadgesApiService(),
       store =
           store ??
           LocalCandidaturaOutboxStore(
             database ?? LocalBadgesDatabase.instance,
           ),
       sessionProvider = sessionProvider ?? AuthService().getSessionSnapshot,
       connectivityProvider = connectivityProvider ?? _hasNetworkInterface,
       requestIdProvider = requestIdProvider ?? _newRequestId,
       syncRequestCallback =
           syncRequestCallback ?? AppSyncTriggerService.instance.requestSync;

  final BadgesApiService apiService;
  final CandidaturaOutboxStore store;
  final Future<AuthSessionSnapshot?> Function() sessionProvider;
  final Future<bool> Function() connectivityProvider;
  final String Function() requestIdProvider;
  final void Function() syncRequestCallback;

  static final Map<int, Future<void>> _ownerFlushTails = {};

  @override
  Future<BadgeApplicationSubmissionResult> submit({
    required int badgeId,
    required List<EvidenceAttachment> evidenceFiles,
    String? description,
  }) async {
    final session = await sessionProvider();
    if (session == null) {
      throw const ApiRequestException(
        401,
        'Sessão expirada. Inicia sessão novamente.',
      );
    }

    final pending = await store.enqueue(
      clientRequestId: requestIdProvider(),
      ownerUserId: session.userId,
      badgeId: badgeId,
      evidenceFiles: evidenceFiles,
      description: description,
    );

    if (!await _canAttemptNetwork()) {
      syncRequestCallback();
      return const BadgeApplicationSubmissionResult(
        delivery: BadgeApplicationDelivery.queued,
        message:
            'Candidatura guardada no telemóvel. Será enviada automaticamente quando houver Internet.',
      );
    }

    final flushResult = await _flushPendingApplications(
      session: session,
      clientRequestId: pending.clientRequestId,
    );
    final permanentError = flushResult.permanentErrors[pending.clientRequestId];
    if (permanentError != null) {
      await store.delete(pending.localId);
      throw permanentError;
    }

    final sentMessage = flushResult.sentMessages[pending.clientRequestId];
    if (sentMessage != null) {
      return BadgeApplicationSubmissionResult(
        delivery: BadgeApplicationDelivery.sent,
        message: sentMessage,
      );
    }

    syncRequestCallback();
    return const BadgeApplicationSubmissionResult(
      delivery: BadgeApplicationDelivery.queued,
      message:
          'Candidatura guardada no telemóvel. Será enviada automaticamente quando houver Internet.',
    );
  }

  @override
  Future<OutboxFlushResult> flushPendingApplications() async {
    final session = await sessionProvider();
    if (session == null || !await _canAttemptNetwork()) {
      return const OutboxFlushResult();
    }
    return _flushPendingApplications(session: session);
  }

  Future<OutboxFlushResult> _flushPendingApplications({
    required AuthSessionSnapshot session,
    String? clientRequestId,
  }) async {
    final ownerUserId = session.userId;
    final previous = _ownerFlushTails[ownerUserId] ?? Future<void>.value();
    final turnCompleted = Completer<void>();
    final currentTurn = turnCompleted.future;
    _ownerFlushTails[ownerUserId] = currentTurn;
    try {
      await previous;
      final result = await _performFlush(
        session: session,
        clientRequestId: clientRequestId,
      );
      if (clientRequestId == null ||
          result.sentMessages.containsKey(clientRequestId) ||
          result.permanentErrors.containsKey(clientRequestId)) {
        return result;
      }
      return _includePreviouslyCompletedResult(
        result,
        ownerUserId: ownerUserId,
        clientRequestId: clientRequestId,
      );
    } finally {
      turnCompleted.complete();
      if (identical(_ownerFlushTails[ownerUserId], currentTurn)) {
        _ownerFlushTails.remove(ownerUserId);
      }
    }
  }

  Future<OutboxFlushResult> _includePreviouslyCompletedResult(
    OutboxFlushResult result, {
    required int ownerUserId,
    required String clientRequestId,
  }) async {
    final sent = await store.getForOwner(
      ownerUserId,
      clientRequestId: clientRequestId,
      states: const ['sent'],
    );
    if (sent.isEmpty) return result;

    return OutboxFlushResult(
      sentMessages: {
        ...result.sentMessages,
        clientRequestId: 'Candidatura submetida com sucesso.',
      },
      permanentErrors: result.permanentErrors,
      retryPending: result.retryPending,
      localStateChanged: result.localStateChanged,
      session: result.session,
    );
  }

  Future<OutboxFlushResult> _performFlush({
    required AuthSessionSnapshot session,
    String? clientRequestId,
  }) async {
    final ownerUserId = session.userId;
    final pendingApplications = await store.getForOwner(
      ownerUserId,
      clientRequestId: clientRequestId,
      states: const ['queued'],
    );
    final sentMessages = <String, String>{};
    final permanentErrors = <String, Object>{};
    var retryPending = false;
    var localStateChanged = false;

    for (final pending in pendingApplications) {
      try {
        await _assertEvidenceAvailable(pending);
        if (await sessionProvider() != session) {
          retryPending = true;
          break;
        }
        final response = await apiService.submitCandidatura(
          badgeId: pending.badgeId,
          evidenceFiles: pending.evidences.map((evidence) {
            return EvidenceAttachment(
              requirementId: evidence.requirementId,
              path: evidence.storedPath,
              fileName: evidence.originalName,
            );
          }).toList(),
          clientEvidenceIds: pending.evidences
              .map((evidence) => '${pending.clientRequestId}:${evidence.id}')
              .toList(),
          descricao: pending.description,
          clientRequestId: pending.clientRequestId,
          authToken: session.token,
        );
        final message = _apiMessage(response);
        await store.markSent(
          pending.localId,
          serverApplicationId: _serverApplicationId(response),
        );
        localStateChanged = true;
        sentMessages[pending.clientRequestId] = message;
      } on ApiRequestException catch (error) {
        if (!_isDeterministicClientFailure(error.statusCode)) {
          retryPending = true;
          await store.markRetry(
            pending.localId,
            error: error.message ?? 'API temporariamente indisponível.',
            httpStatus: error.statusCode,
          );
          localStateChanged = true;
          break;
        }
        await store.markFailed(
          pending.localId,
          error: error.message ?? 'A API rejeitou a candidatura.',
          httpStatus: error.statusCode,
        );
        localStateChanged = true;
        permanentErrors[pending.clientRequestId] = error;
      } on TimeoutException catch (error) {
        retryPending = true;
        await store.markRetry(pending.localId, error: error.toString());
        localStateChanged = true;
        break;
      } on HandshakeException catch (error) {
        retryPending = true;
        await store.markRetry(pending.localId, error: error.message);
        localStateChanged = true;
        break;
      } on SocketException catch (error) {
        retryPending = true;
        await store.markRetry(pending.localId, error: error.message);
        localStateChanged = true;
        break;
      } on http.ClientException catch (error) {
        retryPending = true;
        await store.markRetry(pending.localId, error: error.message);
        localStateChanged = true;
        break;
      } on FileSystemException catch (error) {
        await store.markFailed(pending.localId, error: error.message);
        localStateChanged = true;
        permanentErrors[pending.clientRequestId] = error;
      } on ApiNotConfiguredException catch (error) {
        await store.markFailed(
          pending.localId,
          error: 'A API não está configurada.',
        );
        localStateChanged = true;
        permanentErrors[pending.clientRequestId] = error;
      } on ApiInvalidResponseException {
        retryPending = true;
        await store.markRetry(
          pending.localId,
          error: 'A API devolveu uma resposta inválida.',
        );
        localStateChanged = true;
        break;
      } catch (error) {
        // Uma falha desconhecida pode acontecer depois de a API ter recebido o
        // POST. Mantem-se a operacao idempotente na fila para confirmacao.
        retryPending = true;
        await store.markRetry(pending.localId, error: error.toString());
        localStateChanged = true;
        break;
      }
    }

    return OutboxFlushResult(
      sentMessages: sentMessages,
      permanentErrors: permanentErrors,
      retryPending: retryPending,
      localStateChanged: localStateChanged,
      session: session,
    );
  }

  @override
  Future<bool> hasPendingWork() async {
    final session = await sessionProvider();
    if (session == null) return false;
    final pending = await store.getForOwner(
      session.userId,
      states: const ['queued', 'sent'],
    );
    return pending.isNotEmpty;
  }

  @override
  Future<bool> hasSentApplicationsAwaitingRefresh() async {
    final session = await sessionProvider();
    if (session == null) return false;
    final sent = await store.getForOwner(
      session.userId,
      states: const ['sent'],
    );
    return sent.isNotEmpty;
  }

  @override
  Future<void> completeSentApplications(AuthSessionSnapshot session) async {
    if (await sessionProvider() != session) return;
    await store.deleteSentForOwner(session.userId);
  }

  Future<bool> _canAttemptNetwork() async {
    try {
      return await connectivityProvider();
    } catch (_) {
      // O plugin é só um gatilho; se falhar, o próprio pedido decide.
      return true;
    }
  }

  Future<void> _assertEvidenceAvailable(PendingBadgeApplication pending) async {
    for (final evidence in pending.evidences) {
      if (!await File(evidence.storedPath).exists()) {
        throw FileSystemException(
          'Uma evidência pendente deixou de estar disponível.',
          evidence.storedPath,
        );
      }
    }
  }

  bool _isDeterministicClientFailure(int statusCode) {
    return statusCode >= 400 &&
        statusCode < 500 &&
        !const {401, 408, 425, 429}.contains(statusCode);
  }

  String _apiMessage(Map<String, dynamic>? response) {
    final message =
        response?['mensagem'] ?? response?['message'] ?? response?['erro'];
    if (message is String && message.trim().isNotEmpty) return message;
    return 'Candidatura submetida com sucesso.';
  }

  int? _serverApplicationId(Map<String, dynamic>? response) {
    final value = response?['candidaturaId'] ?? response?['id'];
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '');
  }

  static Future<bool> _hasNetworkInterface() async {
    final results = await Connectivity().checkConnectivity();
    return results.any((result) => result != ConnectivityResult.none);
  }

  static String _newRequestId() {
    final random = Random.secure();
    final randomPart = List.generate(
      16,
      (_) => random.nextInt(256).toRadixString(16).padLeft(2, '0'),
    ).join();
    return '${DateTime.now().microsecondsSinceEpoch}-$randomPart';
  }
}
