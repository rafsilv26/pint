import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:softinsa_badges_mobile/services/auth_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('auto-registo envia a area e nao inicia sessao antes da confirmacao', () async {
    SharedPreferences.setMockInitialValues({});
    late Map<String, dynamic> payload;
    final service = AuthService(
      client: MockClient((request) async {
        expect(request.url.path, endsWith('/auth/signup'));
        payload = Map<String, dynamic>.from(jsonDecode(request.body) as Map);
        return http.Response(
          '{"message":"Conta criada. Confirma o teu email."}',
          201,
          headers: {'content-type': 'application/json'},
        );
      }),
    );

    await service.createAccount(
      name: 'Consultora Teste',
      email: 'consultora@softinsa.pt',
      password: 'Password123!',
      areaId: 7,
    );

    final preferences = await SharedPreferences.getInstance();
    expect(payload['areaId'], 7);
    expect(payload['email'], 'consultora@softinsa.pt');
    expect(preferences.getBool('softinsa_user_logged_in'), isNot(true));
    expect(await service.getSavedEmail(), 'consultora@softinsa.pt');
  });

  test('login só memoriza o email quando a opção é selecionada', () async {
    SharedPreferences.setMockInitialValues({
      'softinsa_user_email': 'anterior@softinsa.pt',
    });
    final service = AuthService(
      client: MockClient((request) async => http.Response(
        jsonEncode({
          'token': _fakeValidToken(),
          'user': {'id': 3, 'nome': 'Consultora', 'role': 'Consultor'},
        }),
        200,
        headers: {'content-type': 'application/json'},
      )),
    );

    await service.login(
      email: 'nova@softinsa.pt',
      password: 'Password123!',
      rememberLogin: false,
    );

    expect(await service.getSavedEmail(), isNull);
    expect(await service.isLoggedIn(), isTrue);
  });

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
