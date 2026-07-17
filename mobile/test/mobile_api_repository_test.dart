import 'package:flutter_test/flutter_test.dart';
import 'package:softinsa_badges_mobile/models/mobile_api_data.dart';
import 'package:softinsa_badges_mobile/models/pending_badge_application.dart';
import 'package:softinsa_badges_mobile/repositories/mobile_api_repository.dart';
import 'package:softinsa_badges_mobile/services/auth_service.dart';
import 'package:softinsa_badges_mobile/services/badges_api_service.dart';
import 'package:softinsa_badges_mobile/services/candidatura_outbox_service.dart';

void main() {
  test('a candidatura termina sem esperar por novas sincronizacoes', () async {
    final api = _RecordingApi();
    final outbox = _RecordingOutbox();
    final repository = MobileApiRepository(
      apiService: api,
      candidaturaOutbox: outbox,
    );

    final result = await repository.submitCandidatura(badgeId: 42);

    expect(result.message, 'Candidatura recebida.');
    expect(result.isQueued, isFalse);
    expect(outbox.submitCalls, 1);
    expect(api.submitCalls, 0);
    expect(api.followUpReads, 0);
  });
}

class _RecordingOutbox implements CandidaturaOutbox {
  int submitCalls = 0;

  @override
  Future<BadgeApplicationSubmissionResult> submit({
    required int badgeId,
    required List<EvidenceAttachment> evidenceFiles,
    String? description,
  }) async {
    submitCalls++;
    return const BadgeApplicationSubmissionResult(
      delivery: BadgeApplicationDelivery.sent,
      message: 'Candidatura recebida.',
    );
  }

  @override
  Future<void> completeSentApplications(AuthSessionSnapshot session) async {}

  @override
  Future<OutboxFlushResult> flushPendingApplications() async {
    return const OutboxFlushResult();
  }

  @override
  Future<bool> hasPendingWork() async => false;

  @override
  Future<bool> hasSentApplicationsAwaitingRefresh() async => false;
}

class _RecordingApi extends BadgesApiService {
  int submitCalls = 0;
  int followUpReads = 0;

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
    return {'mensagem': 'Candidatura recebida.'};
  }

  @override
  Future<List<Map<String, dynamic>>> fetchCatalogResource(
    String resource,
  ) async {
    followUpReads++;
    return const [];
  }

  @override
  Future<List<Map<String, dynamic>>> fetchMyCandidaturas() async {
    followUpReads++;
    return const [];
  }

  @override
  Future<Map<String, dynamic>?> fetchNotifications() async {
    followUpReads++;
    return null;
  }

  @override
  Future<Map<String, dynamic>?> fetchGamification() async {
    followUpReads++;
    return null;
  }
}
