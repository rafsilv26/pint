import 'package:flutter_test/flutter_test.dart';
import 'package:softinsa_badges_mobile/models/mobile_api_data.dart';
import 'package:softinsa_badges_mobile/repositories/mobile_api_repository.dart';
import 'package:softinsa_badges_mobile/services/badges_api_service.dart';

void main() {
  test('a candidatura termina sem esperar por novas sincronizacoes', () async {
    final api = _RecordingApi();
    final repository = MobileApiRepository(apiService: api);

    final message = await repository.submitCandidatura(badgeId: 42);

    expect(message, 'Candidatura recebida.');
    expect(api.submitCalls, 1);
    expect(api.followUpReads, 0);
  });
}

class _RecordingApi extends BadgesApiService {
  int submitCalls = 0;
  int followUpReads = 0;

  @override
  Future<Map<String, dynamic>?> submitCandidatura({
    required int badgeId,
    List<int> requisitoIds = const [],
    List<EvidenceAttachment> evidenceFiles = const [],
    String? descricao,
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
