import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:softinsa_badges_mobile/services/badges_api_service.dart';

void main() {
  test(
    'multipart inclui os identificadores idempotentes das evidencias',
    () async {
      late String requestBody;
      late String? authorization;
      final service = BadgesApiService(
        baseUrl: 'https://api.example.test',
        tokenProvider: () async => 'token',
        client: MockClient((request) async {
          requestBody = request.body;
          authorization = request.headers['authorization'];
          return http.Response(
            '{"mensagem":"Candidatura enviada.","candidaturaId":71}',
            201,
            headers: {'content-type': 'application/json'},
          );
        }),
      );

      await service.submitCandidatura(
        badgeId: 42,
        clientRequestId: 'pedido-42',
        clientEvidenceIds: const ['pedido-42:7'],
        authToken: 'token-snapshot',
      );

      expect(requestBody, contains('clientSubmissionId'));
      expect(requestBody, contains('pedido-42'));
      expect(requestBody, contains('clientEvidenceIds'));
      expect(requestBody, contains('pedido-42:7'));
      expect(authorization, 'Bearer token-snapshot');
    },
  );

  test('resposta HTTP de erro vazia nao e tratada como sucesso', () async {
    final service = BadgesApiService(
      baseUrl: 'https://api.example.test',
      tokenProvider: () async => 'token',
      client: MockClient((_) async => http.Response('', 503)),
    );

    await expectLater(
      service.submitCandidatura(badgeId: 42),
      throwsA(
        isA<ApiRequestException>().having(
          (error) => error.statusCode,
          'statusCode',
          503,
        ),
      ),
    );
  });

  test('resposta 2xx vazia fica como resultado incerto', () async {
    final service = BadgesApiService(
      baseUrl: 'https://api.example.test',
      tokenProvider: () async => 'token',
      client: MockClient((_) async => http.Response('', 200)),
    );

    await expectLater(
      service.submitCandidatura(badgeId: 42),
      throwsA(isA<ApiInvalidResponseException>()),
    );
  });
}
