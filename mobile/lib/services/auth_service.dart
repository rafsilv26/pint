import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'api_config.dart';
import 'local_badges_database.dart';
import 'sync_preferences_service.dart';

class AuthService {
  AuthService({
    http.Client? client,
    LocalBadgesDatabase? database,
    SyncPreferencesService? syncPreferencesService,
  }) : client = client ?? http.Client(),
       database = database ?? LocalBadgesDatabase.instance,
       syncPreferencesService =
           syncPreferencesService ?? SyncPreferencesService();

  static const String _loggedInKey = 'softinsa_user_logged_in';
  static const String _nameKey = 'softinsa_user_name';
  static const String _emailKey = 'softinsa_user_email';
  static const String tokenKey = 'softinsa_auth_token';
  static const String _userIdKey = 'softinsa_user_id';
  static const String _roleKey = 'softinsa_user_role';
  static const String _mustChangePasswordKey =
      'softinsa_user_must_change_password';
  static const String _pendingPoliciesKey = 'softinsa_pending_rgpd_policies';
  static const String _greetingKey = 'softinsa_login_greeting';

  final http.Client client;
  final LocalBadgesDatabase database;
  final SyncPreferencesService syncPreferencesService;

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
    final activatedUserId = (user['id'] as num?)?.toInt() ?? 0;
    if (activatedUserId <= 0) {
      throw const AuthException('A API devolveu um utilizador inválido.');
    }
    final userChanged = await database.upsertCurrentUser(user);
    if (userChanged) {
      await syncPreferencesService.invalidatePersonalSyncState(activatedUserId);
    }

    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_loggedInKey, false);
    await preferences.setString(tokenKey, token);
    if (rememberLogin) {
      await preferences.setString(_emailKey, email);
    } else {
      await preferences.remove(_emailKey);
    }
    await preferences.setInt(_userIdKey, activatedUserId);

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

    await _savePendingPolicies(preferences, user['pendingPolicies']);
    final greeting = user['greeting']?.toString();
    if (greeting != null && greeting.isNotEmpty) {
      await preferences.setString(_greetingKey, greeting);
    }

    await preferences.setBool('softinsa_remember_login', rememberLogin);
    await preferences.setBool(_loggedInKey, true);
  }

  Future<void> createAccount({
    required String name,
    required String email,
    required String password,
    required int areaId,
  }) async {
    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/signup');
    final response = await client
        .post(
          uri,
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode({
            'nome': name,
            'email': email,
            'password': password,
            'areaId': areaId,
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
  }

  Future<List<SignupArea>> getSignupAreas() async {
    final response = await client
        .get(Uri.parse('${ApiConfig.baseUrl}/auth/areas'))
        .timeout(const Duration(seconds: 12));
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw const AuthException('Não foi possível carregar as áreas.');
    }
    final decoded = jsonDecode(utf8.decode(response.bodyBytes));
    if (decoded is! List) return const [];
    return decoded
        .whereType<Map>()
        .map((row) {
          final map = Map<String, dynamic>.from(row);
          return SignupArea(
            id: (map['id'] as num?)?.toInt() ?? 0,
            name: map['nome']?.toString() ?? '',
          );
        })
        .where((area) => area.id > 0 && area.name.isNotEmpty)
        .toList();
  }

  Future<void> resendConfirmation(String email) async {
    await _postPublic('/auth/resend-confirmation', {'email': email});
  }

  Future<String> forgotPassword(String email) async {
    final body = await _postPublic('/auth/forgot-password', {'email': email});
    return _apiMessage(body) ?? 'Consulta o teu email para continuar.';
  }

  Future<String> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    final body = await _postPublic('/auth/reset-password', {
      'token': token,
      'novaPassword': newPassword,
    });
    return _apiMessage(body) ?? 'A sua password foi redefinida com sucesso.';
  }

  Future<List<PendingPolicy>> getPendingPolicies() async {
    final preferences = await SharedPreferences.getInstance();
    final raw = preferences.getString(_pendingPoliciesKey);
    if (raw == null || raw.isEmpty) return const [];
    final decoded = jsonDecode(raw);
    if (decoded is! List) return const [];
    return decoded
        .whereType<Map>()
        .map((row) => PendingPolicy.fromJson(Map<String, dynamic>.from(row)))
        .where((policy) => policy.id > 0)
        .toList();
  }

  Future<void> acceptPolicy(int policyId) async {
    final preferences = await SharedPreferences.getInstance();
    final token = preferences.getString(tokenKey);
    if (token == null || token.isEmpty) {
      throw const AuthException('Sessão expirada.');
    }
    final response = await client
        .post(
          Uri.parse('${ApiConfig.baseUrl}/auth/accept-policy'),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({'policyId': policyId}),
        )
        .timeout(const Duration(seconds: 12));
    final body = _decodeBody(response);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AuthException(
        _apiMessage(body) ?? 'Não foi possível aceitar a política.',
      );
    }
    await _savePendingPolicies(preferences, body['pendingPolicies']);
  }

  Future<void> confirmAccount() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_loggedInKey, true);
  }

  Future<PasswordChangeResult> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final preferences = await SharedPreferences.getInstance();
    final token = preferences.getString(tokenKey);
    if (token == null || token.isEmpty || _isExpiredJwt(token)) {
      await _clearSession(preferences);
      throw const AuthException('Sessao expirada. Inicie sessao novamente.');
    }

    final uri = Uri.parse('${ApiConfig.baseUrl}/auth/change-password');
    final response = await client
        .put(
          uri,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer $token',
          },
          body: jsonEncode({
            'currentPassword': currentPassword,
            'newPassword': newPassword,
          }),
        )
        .timeout(const Duration(seconds: 12));

    final body = _decodeBody(response);
    final apiMessage = _apiMessage(body);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AuthException(
        apiMessage ?? 'Nao foi possivel alterar a palavra-passe.',
      );
    }

    await preferences.setBool(_mustChangePasswordKey, false);
    await _syncCurrentUserAfterPasswordChange(token);

    return PasswordChangeResult(message: apiMessage ?? '');
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

  Future<String?> getSavedGreeting() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(_greetingKey);
  }

  Future<bool> mustChangePassword() async {
    final preferences = await SharedPreferences.getInstance();
    final localUser = await database.getCurrentUserProfile();
    return localUser?.mustChangePassword ??
        preferences.getBool(_mustChangePasswordKey) ??
        false;
  }

  Future<String?> getToken() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(tokenKey);
  }

  /// Snapshot atomico da identidade autenticada. O identificador vem do mesmo
  /// JWT que sera usado no pedido, nunca de uma preferencia separada.
  Future<AuthSessionSnapshot?> getSessionSnapshot() async {
    final preferences = await SharedPreferences.getInstance();
    if (preferences.getBool(_loggedInKey) != true) return null;
    final token = preferences.getString(tokenKey);
    if (token == null || token.isEmpty || _isExpiredJwt(token)) return null;
    final payload = _decodeJwtPayload(token);
    final rawId = payload?['id'];
    final userId = rawId is num
        ? rawId.toInt()
        : int.tryParse(rawId?.toString() ?? '');
    if (userId == null || userId <= 0) return null;
    return AuthSessionSnapshot(userId: userId, token: token);
  }

  Future<int?> getCurrentUserId() async {
    return (await getSessionSnapshot())?.userId;
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

  String? _apiMessage(Map<String, dynamic> body) {
    final message = body['message'] ?? body['error'] ?? body['details'];
    if (message is String && message.trim().isNotEmpty) {
      return message;
    }

    return null;
  }

  Future<void> _syncCurrentUserAfterPasswordChange(String token) async {
    try {
      final response = await client
          .get(
            Uri.parse('${ApiConfig.baseUrl}/auth/me'),
            headers: {'Authorization': 'Bearer $token'},
          )
          .timeout(const Duration(seconds: 8));

      if (response.statusCode < 200 || response.statusCode >= 300) {
        await database.markCurrentUserPasswordChanged();
        return;
      }

      final body = _decodeBody(response);
      final user = body['user'] ?? body['data'] ?? body;
      if (user is Map) {
        final userMap = Map<String, dynamic>.from(user);
        userMap['mustChangePassword'] = false;
        await database.upsertCurrentUser(userMap);
        return;
      }

      await database.markCurrentUserPasswordChanged();
    } catch (_) {
      await database.markCurrentUserPasswordChanged();
    }
  }

  Future<void> _clearSession(SharedPreferences preferences) async {
    await preferences.setBool(_loggedInKey, false);
    await preferences.remove(tokenKey);
    await preferences.remove(_userIdKey);
    await preferences.remove(_roleKey);
    await preferences.remove(_mustChangePasswordKey);
    await preferences.remove(_pendingPoliciesKey);
    await preferences.remove(_greetingKey);
  }

  Future<Map<String, dynamic>> _postPublic(
    String path,
    Map<String, dynamic> payload,
  ) async {
    final response = await client
        .post(
          Uri.parse('${ApiConfig.baseUrl}$path'),
          headers: const {'Content-Type': 'application/json'},
          body: jsonEncode(payload),
        )
        .timeout(const Duration(seconds: 12));
    final body = _decodeBody(response);
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw AuthException(
        _apiMessage(body) ?? 'Não foi possível concluir o pedido.',
      );
    }
    return body;
  }

  Future<void> _savePendingPolicies(
    SharedPreferences preferences,
    Object? value,
  ) async {
    final list = value is List ? value : const [];
    await preferences.setString(_pendingPoliciesKey, jsonEncode(list));
  }

  bool _isExpiredJwt(String token) {
    try {
      final exp = _decodeJwtPayload(token)?['exp'];
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

  Map<String, dynamic>? _decodeJwtPayload(String token) {
    final parts = token.split('.');
    if (parts.length != 3) return null;
    try {
      final payload = utf8.decode(
        base64Url.decode(base64Url.normalize(parts[1])),
      );
      final decoded = jsonDecode(payload);
      return decoded is Map<String, dynamic> ? decoded : null;
    } catch (_) {
      return null;
    }
  }
}

class AuthSessionSnapshot {
  const AuthSessionSnapshot({required this.userId, required this.token});

  final int userId;
  final String token;

  @override
  bool operator ==(Object other) {
    return other is AuthSessionSnapshot &&
        other.userId == userId &&
        other.token == token;
  }

  @override
  int get hashCode => Object.hash(userId, token);
}

class PasswordChangeResult {
  const PasswordChangeResult({required this.message});

  final String message;
}

class AuthException implements Exception {
  const AuthException(this.message);

  final String message;
}

class SignupArea {
  const SignupArea({required this.id, required this.name});
  final int id;
  final String name;
}

class PendingPolicy {
  const PendingPolicy({
    required this.id,
    required this.title,
    required this.description,
    required this.version,
  });
  final int id;
  final String title;
  final String description;
  final String version;

  factory PendingPolicy.fromJson(Map<String, dynamic> json) => PendingPolicy(
    id: (json['policyId'] as num?)?.toInt() ?? 0,
    title: json['title']?.toString() ?? 'Política RGPD',
    description: json['description']?.toString() ?? '',
    version: json['version']?.toString() ?? '',
  );
}
