import 'dart:async';
import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../models/dashboard_data.dart';
import 'api_config.dart';
import 'auth_service.dart';

class BadgesApiService {
  BadgesApiService({
    http.Client? client,
    String? baseUrl,
    Future<String?> Function()? tokenProvider,
  }) : client = client ?? http.Client(),
       baseUrl = baseUrl ?? ApiConfig.baseUrl,
       tokenProvider = tokenProvider ?? _readStoredToken;

  final http.Client client;
  final String baseUrl;
  final Future<String?> Function() tokenProvider;

  Future<Map<String, dynamic>?> fetchCurrentUser() async {
    if (baseUrl.trim().isEmpty) {
      throw const ApiNotConfiguredException();
    }

    final normalizedBaseUrl = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final response = await client
        .get(Uri.parse('$normalizedBaseUrl/auth/me'), headers: await _headers())
        .timeout(const Duration(seconds: 8));

    if (response.statusCode == 204 || response.body.trim().isEmpty) {
      return null;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiRequestException(response.statusCode);
    }

    final decoded = _decodeResponse(response);
    if (decoded is! Map<String, dynamic>) {
      throw const ApiInvalidResponseException();
    }

    final user = decoded['user'] ?? decoded['data'] ?? decoded;
    if (user is Map) {
      return Map<String, dynamic>.from(user);
    }

    return null;
  }

  Future<DashboardApiUpdate?> fetchDashboardUpdates({
    DateTime? lastUpdate,
  }) async {
    if (baseUrl.trim().isEmpty) {
      throw const ApiNotConfiguredException();
    }

    final uri = _dashboardUri(lastUpdate);
    final response = await client
        .get(uri, headers: await _headers())
        .timeout(const Duration(seconds: 8));

    if (response.statusCode == 204 || response.body.trim().isEmpty) {
      return null;
    }

    if (response.statusCode == 404) {
      return _fetchDashboardFromCandidaturas(lastUpdate: lastUpdate);
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiRequestException(response.statusCode);
    }

    final decoded = _decodeResponse(response);
    if (decoded is! Map<String, dynamic>) {
      throw const ApiInvalidResponseException();
    }

    final dashboardJson = _extractDashboardJson(decoded);
    if (dashboardJson == null) {
      return null;
    }

    return DashboardApiUpdate(
      dashboard: DashboardData.fromJson(dashboardJson),
      serverUpdatedAt: _extractUpdatedAt(decoded),
      rawPayload: decoded,
    );
  }

  Uri _dashboardUri(DateTime? lastUpdate) {
    final normalizedBaseUrl = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    final uri = Uri.parse('$normalizedBaseUrl/dashboard');
    final queryParameters = <String, String>{};

    if (lastUpdate != null) {
      queryParameters['data_hora'] = lastUpdate.toUtc().toIso8601String();
    }

    if (queryParameters.isEmpty) {
      return uri;
    }

    return uri.replace(queryParameters: queryParameters);
  }

  Uri _candidaturasUri() {
    final normalizedBaseUrl = baseUrl.endsWith('/')
        ? baseUrl.substring(0, baseUrl.length - 1)
        : baseUrl;
    return Uri.parse('$normalizedBaseUrl/candidaturas/minhas');
  }

  Future<DashboardApiUpdate?> _fetchDashboardFromCandidaturas({
    DateTime? lastUpdate,
  }) async {
    final response = await client
        .get(_candidaturasUri(), headers: await _headers())
        .timeout(const Duration(seconds: 8));

    if (response.statusCode == 204 || response.body.trim().isEmpty) {
      return null;
    }

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiRequestException(response.statusCode);
    }

    final decoded = _decodeResponse(response);
    final candidaturas = _extractList(decoded, const [
      'candidaturas',
      'data',
      'items',
    ]);

    if (candidaturas.isEmpty) {
      return null;
    }

    final serverUpdatedAt = _newestUpdate(candidaturas);
    if (lastUpdate != null &&
        serverUpdatedAt != null &&
        !serverUpdatedAt.isAfter(lastUpdate)) {
      return null;
    }

    return DashboardApiUpdate(
      dashboard: await _buildDashboardFromCandidaturas(candidaturas),
      serverUpdatedAt: serverUpdatedAt,
      rawPayload: {'candidaturas': candidaturas},
    );
  }

  Map<String, dynamic>? _extractDashboardJson(Map<String, dynamic> json) {
    final dynamic data = json['data'] ?? json['dashboard'] ?? json;
    if (data is Map<String, dynamic>) {
      return data;
    }

    return null;
  }

  Object? _decodeResponse(http.Response response) {
    return jsonDecode(utf8.decode(response.bodyBytes));
  }

  List<Map<String, dynamic>> _extractList(Object? decoded, List<String> keys) {
    Object? value = decoded;

    if (decoded is Map<String, dynamic>) {
      for (final key in keys) {
        final candidate = decoded[key];
        if (candidate is List) {
          value = candidate;
          break;
        }
      }
    }

    if (value is! List) {
      return const [];
    }

    return value
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList();
  }

  DateTime? _newestUpdate(List<Map<String, dynamic>> rows) {
    DateTime? newest;

    for (final row in rows) {
      final updatedAt = _dateValue(row, const ['updatedAt', 'createdAt']);
      if (updatedAt != null && (newest == null || updatedAt.isAfter(newest))) {
        newest = updatedAt;
      }
    }

    return newest;
  }

  Future<DashboardData> _buildDashboardFromCandidaturas(
    List<Map<String, dynamic>> candidaturas,
  ) async {
    final preferences = await SharedPreferences.getInstance();
    final userName = preferences.getString('softinsa_user_name') ?? '';
    final userRole = preferences.getString('softinsa_user_role') ?? '';

    final approved = candidaturas.where((row) {
      return _textValue(row, const ['estado']) == 'FECHADO_APROVADO';
    }).toList();
    final inProgress = candidaturas.where((row) {
      final estado = _textValue(row, const ['estado']);
      return estado == 'OPEN' ||
          estado == 'SUBMITTED' ||
          estado == 'EM_VALIDACAO';
    }).toList();

    final totalPoints = approved.fold<int>(0, (total, candidatura) {
      return total + _badgePoints(candidatura);
    });

    final recommendations = candidaturas
        .where((row) => !approved.contains(row))
        .map(_recommendationFromCandidatura)
        .where((recommendation) => recommendation.title.isNotEmpty)
        .toList();

    return DashboardData(
      userName: userName,
      userRole: userRole,
      greeting: 'Boa noite,',
      totalPoints: totalPoints,
      learningPathTitle: 'Learning Path',
      learningPathProgress: _progressFromCandidaturas(candidaturas),
      noticeTitle: 'Informacoes',
      noticeMessage: candidaturas.isEmpty
          ? ''
          : 'Dados sincronizados a partir da API.',
      specialAchievementTitle: 'Conquistas especiais',
      specialAchievementMessage:
          '${approved.length} badges aprovados no seu perfil.',
      recommendations: recommendations,
      badgesWon: approved.length,
      inProgress: inProgress.length,
      ranking: 0,
    );
  }

  BadgeRecommendation _recommendationFromCandidatura(
    Map<String, dynamic> candidatura,
  ) {
    final badge = _mapValue(candidatura, const ['Badge', 'badge']);
    final durationMonths = _intValue(badge, const [
      'duracaoMeses',
      'DURACAO_MESES',
    ]);

    return BadgeRecommendation(
      title: _textValue(badge, const ['nome', 'NOME', 'title']) ?? '',
      description:
          _textValue(badge, const ['descricao', 'DESCRICAO']) ??
          _textValue(candidatura, const ['estado']) ??
          '',
      level: '',
      tag: _textValue(candidatura, const ['estado']) ?? '',
      points: _intValue(badge, const ['pontos', 'PONTO', 'points']) ?? 0,
      duration: durationMonths == null || durationMonths <= 0
          ? ''
          : '$durationMonths meses',
      prerequisites: const [],
      iconName:
          _textValue(badge, const ['imagem', 'IMAGEM', 'iconName']) ?? 'badge',
    );
  }

  double _progressFromCandidaturas(List<Map<String, dynamic>> candidaturas) {
    if (candidaturas.isEmpty) {
      return 0;
    }

    final approved = candidaturas.where((row) {
      return _textValue(row, const ['estado']) == 'FECHADO_APROVADO';
    }).length;

    return (approved / candidaturas.length).clamp(0, 1).toDouble();
  }

  int _badgePoints(Map<String, dynamic> candidatura) {
    final badge = _mapValue(candidatura, const ['Badge', 'badge']);
    return _intValue(badge, const ['pontos', 'PONTO', 'points']) ?? 0;
  }

  Map<String, dynamic> _mapValue(Map<String, dynamic> row, List<String> keys) {
    final value = _field(row, keys);
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return const {};
  }

  Object? _field(Map<String, dynamic> row, List<String> keys) {
    for (final key in keys) {
      if (row.containsKey(key)) {
        return row[key];
      }
    }

    final lowerCaseKeys = {
      for (final entry in row.entries) entry.key.toLowerCase(): entry.value,
    };
    for (final key in keys) {
      final value = lowerCaseKeys[key.toLowerCase()];
      if (value != null) {
        return value;
      }
    }

    return null;
  }

  String? _textValue(Map<String, dynamic> row, List<String> keys) {
    final value = _field(row, keys);
    return value?.toString();
  }

  int? _intValue(Map<String, dynamic> row, List<String> keys) {
    final value = _field(row, keys);
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }
    if (value is String) {
      return int.tryParse(value);
    }

    return null;
  }

  DateTime? _dateValue(Map<String, dynamic> row, List<String> keys) {
    final value = _field(row, keys);
    if (value == null) {
      return null;
    }

    return DateTime.tryParse(value.toString());
  }

  DateTime? _extractUpdatedAt(Map<String, dynamic> json) {
    final dynamic value =
        json['ultimaatualizacao'] ??
        json['ultimaAtualizacao'] ??
        json['updatedAt'];

    if (value == null) {
      return null;
    }

    return DateTime.tryParse(value.toString());
  }

  Future<Map<String, String>> _headers() async {
    final token = await tokenProvider();

    return {
      'Content-Type': 'application/json',
      if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
    };
  }

  static Future<String?> _readStoredToken() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(AuthService.tokenKey);
  }
}

class DashboardApiUpdate {
  const DashboardApiUpdate({
    required this.dashboard,
    this.serverUpdatedAt,
    this.rawPayload,
  });

  final DashboardData dashboard;
  final DateTime? serverUpdatedAt;
  final Object? rawPayload;
}

class ApiNotConfiguredException implements Exception {
  const ApiNotConfiguredException();
}

class ApiInvalidResponseException implements Exception {
  const ApiInvalidResponseException();
}

class ApiRequestException implements Exception {
  const ApiRequestException(this.statusCode);

  final int statusCode;
}
