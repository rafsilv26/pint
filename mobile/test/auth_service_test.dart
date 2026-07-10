import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:softinsa_badges_mobile/services/auth_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('devolve mensagem de sucesso vinda da api', () async {
    SharedPreferences.setMockInitialValues({
      'softinsa_user_logged_in': true,
      'softinsa_auth_token': _fakeValidToken(),
      'softinsa_user_email': 'consultor@softinsa.pt',
      'softinsa_user_must_change_password': true,
    });

    final service = AuthService(
      client: MockClient((request) async {
        if (request.url.path.endsWith('/auth/change-password')) {
          return http.Response(
            '{"message":"Mensagem de sucesso da API."}',
            200,
            headers: {'content-type': 'application/json'},
          );
        }

        if (request.url.path.endsWith('/auth/me')) {
          return http.Response(
            '{"user":{"id":1,"nome":"Consultor Teste","email":"consultor@softinsa.pt","mustChangePassword":false}}',
            200,
            headers: {'content-type': 'application/json'},
          );
        }

        return http.Response('{}', 404);
      }),
    );

    final result = await service.changePassword(
      currentPassword: 'PasswordAtual123!',
      newPassword: 'NovaPassword123!',
    );
    final preferences = await SharedPreferences.getInstance();

    expect(result.message, 'Mensagem de sucesso da API.');
    expect(preferences.getBool('softinsa_user_must_change_password'), isFalse);
  });

  test('propaga mensagem de erro vinda da api', () async {
    SharedPreferences.setMockInitialValues({
      'softinsa_user_logged_in': true,
      'softinsa_auth_token': _fakeValidToken(),
      'softinsa_user_email': 'consultor@softinsa.pt',
    });

    final requestedPaths = <String>[];
    final service = AuthService(
      client: MockClient((request) async {
        requestedPaths.add(request.url.path);

        if (request.url.path.endsWith('/auth/change-password')) {
          return http.Response(
            '{"message":"Password atual invalida."}',
            401,
            headers: {'content-type': 'application/json'},
          );
        }

        return http.Response('{}', 404);
      }),
    );

    await expectLater(
      service.changePassword(
        currentPassword: 'PasswordErrada123!',
        newPassword: 'NovaPassword123!',
      ),
      throwsA(
        isA<AuthException>().having(
          (error) => error.message,
          'message',
          'Password atual invalida.',
        ),
      ),
    );
    expect(requestedPaths, isNot(contains(endsWith('/auth/login'))));
  });
}

String _fakeValidToken() {
  final payload = {
    'exp':
        DateTime.now().add(const Duration(hours: 2)).millisecondsSinceEpoch ~/
        1000,
  };
  final encodedPayload = base64Url.encode(utf8.encode(jsonEncode(payload)));
  return 'header.$encodedPayload.signature';
}
