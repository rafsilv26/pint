import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

import '../models/dashboard_data.dart';

class DashboardCacheService {
  static const String _cacheKey = 'softinsa_dashboard_cache';

  Future<void> saveDashboard(DashboardData data) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_cacheKey, jsonEncode(data.toJson()));
  }

  Future<DashboardData?> getDashboard() async {
    final preferences = await SharedPreferences.getInstance();
    final jsonText = preferences.getString(_cacheKey);

    if (jsonText == null) {
      return null;
    }

    final jsonMap = jsonDecode(jsonText) as Map<String, dynamic>;
    return DashboardData.fromJson(jsonMap);
  }
}
