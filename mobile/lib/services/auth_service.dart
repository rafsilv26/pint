import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'api_config.dart';

class AuthService {
  AuthService({http.Client? client}) : client = client ?? http.Client();

  static const String _loggedInKey = 'softinsa_user_logged_in';
  static const String _nameKey = 'softinsa_user_name';
  static const String _emailKey = 'softinsa_user_email';
  static const String tokenKey = 'softinsa_auth_token';
  static const String _userIdKey = 'softinsa_user_id';
  static const String _roleKey = 'softinsa_user_role';
  static const String _mustChangePasswordKey =
      'softinsa_user_must_change_password';

  final http.Client client;

  Future<bool> isLoggedIn() async {
    final preferences = await SharedPreferences.getInstance();
    final markedAsLoggedIn = preferences.getBool(_loggedInKey) ?? false;
    final token = preferences.getString(tokenKey);

    if (!markedAsLoggedIn || token == null || token.isEmpty) {
      await _clearSession(preferences);
      return false;
    }

    if (_isExpiredJwt(token)) {
      await _clearSession(preferences);
      return false;
    }

    return true;
  }

  Future<void> login({
    required String email,
    required String password,
    required bool rememberLogin,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/login');
    final response = await client
        .post(
          uri,
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode({'email': email, 'password': password}),
        )
        .timeout(const Duration(seconds: 12));

    final body = _decodeBody(response);
    final token = body['token'] as String?;

    if (response.statusCode < 200 ||
        response.statusCode >= 300 ||
        token == null ||
        token.isEmpty) {
      throw AuthException(
        body['message'] as String? ?? 'Nao foi possivel iniciar sessao.',
      );
    }

    final user = Map<String, dynamic>.from(body['user'] as Map? ?? {});
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_loggedInKey, true);
    await preferences.setString(tokenKey, token);
    await preferences.setString(_emailKey, email);
    await preferences.setInt(_userIdKey, (user['id'] as num?)?.toInt() ?? 0);

    final name = user['nome'] as String?;
    if (name != null && name.isNotEmpty) {
      await preferences.setString(_nameKey, name);
    }

    final role = user['role'] as String?;
    if (role != null && role.isNotEmpty) {
      await preferences.setString(_roleKey, role);
    }

    final mustChangePassword = user['mustChangePassword'] as bool?;
    if (mustChangePassword != null) {
      await preferences.setBool(_mustChangePasswordKey, mustChangePassword);
    }

    await preferences.setBool('softinsa_remember_login', rememberLogin);
  }

  Future<void> createAccount({
    required String name,
    required String email,
    required String password,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/register');
    final response = await client
        .post(
          uri,
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode({
            'nome': name,
            'email': email,
            'password': password,
            'roles': ['Consultor'],
          }),
        )
        .timeout(const Duration(seconds: 12));

    final body = _decodeBody(response);

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AuthException(
        body['message'] as String? ??
            body['error'] as String? ??
            'Nao foi possivel criar a conta.',
      );
    }

    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_nameKey, name);
    await preferences.setString(_emailKey, email);

    await login(email: email, password: password, rememberLogin: true);
  }

  Future<void> confirmAccount() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_loggedInKey, true);
  }

  Future<String?> getSavedEmail() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(_emailKey);
  }

  Future<String?> getSavedName() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(_nameKey);
  }

  Future<String?> getSavedRole() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(_roleKey);
  }

  Future<String?> getToken() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(tokenKey);
  }

  Future<void> logout() async {
    final preferences = await SharedPreferences.getInstance();
    await _clearSession(preferences);
  }

  Map<String, dynamic> _decodeBody(http.Response response) {
    if (response.bodyBytes.isEmpty) {
      return {};
    }

    final decoded = jsonDecode(utf8.decode(response.bodyBytes));
    if (decoded is Map<String, dynamic>) {
      return decoded;
    }

    return {};
  }

  Future<void> _clearSession(SharedPreferences preferences) async {
    await preferences.setBool(_loggedInKey, false);
    await preferences.remove(tokenKey);
    await preferences.remove(_userIdKey);
    await preferences.remove(_roleKey);
    await preferences.remove(_mustChangePasswordKey);
  }

  bool _isExpiredJwt(String token) {
    final parts = token.split('.');
    if (parts.length != 3) {
      return false;
    }

    try {
      final payload = utf8.decode(
        base64Url.decode(base64Url.normalize(parts[1])),
      );
      final decoded = jsonDecode(payload);
      if (decoded is! Map<String, dynamic>) {
        return false;
      }

      final exp = decoded['exp'];
      if (exp is! num) {
        return false;
      }

      final expiresAt = DateTime.fromMillisecondsSinceEpoch(
        exp.toInt() * 1000,
        isUtc: true,
      );
      return DateTime.now().toUtc().isAfter(expiresAt);
    } catch (_) {
      return false;
    }
  }
}

class AuthException implements Exception {
  const AuthException(this.message);

  final String message;
}
