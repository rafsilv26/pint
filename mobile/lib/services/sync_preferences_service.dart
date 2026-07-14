import 'package:shared_preferences/shared_preferences.dart';

class SyncPreferencesService {
  static const String _lastDashboardUpdateKey =
      'softinsa_dashboard_ultimaatualizacao';
  static const String _mobileDataVersionKey = 'softinsa_mobile_data_version';

  Future<DateTime?> getLastDashboardUpdate() async {
    final preferences = await SharedPreferences.getInstance();
    final value = preferences.getString(_lastDashboardUpdateKey);

    if (value == null || value.isEmpty) {
      return null;
    }

    return DateTime.tryParse(value);
  }

  Future<void> saveLastDashboardUpdate(DateTime dateTime) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(
      _lastDashboardUpdateKey,
      dateTime.toUtc().toIso8601String(),
    );
  }

  Future<String?> getMobileDataVersion() async {
    final preferences = await SharedPreferences.getInstance();
    final value = preferences.getString(_mobileDataVersionKey);
    return value == null || value.isEmpty ? null : value;
  }

  Future<void> saveMobileDataVersion(String version) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_mobileDataVersionKey, version);
  }
}
