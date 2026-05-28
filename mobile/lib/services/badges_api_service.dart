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

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiRequestException(response.statusCode);
    }

    final decoded = jsonDecode(response.body);
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

  Map<String, dynamic>? _extractDashboardJson(Map<String, dynamic> json) {
    final dynamic data = json['data'] ?? json['dashboard'] ?? json;
    if (data is Map<String, dynamic>) {
      return data;
    }

    return null;
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
  });

  final DashboardData dashboard;
  final DateTime? serverUpdatedAt;
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
