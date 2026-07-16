import 'package:shared_preferences/shared_preferences.dart';

class SyncPreferencesService {
  static const String _legacyLastDashboardUpdateKey =
      'softinsa_dashboard_ultimaatualizacao';
  static const String _lastDashboardUpdateKeyPrefix =
      'softinsa_dashboard_ultimaatualizacao_user_';
  static const String _legacyMobileDataVersionKey =
      'softinsa_mobile_data_version';
  static const String _mobileDataVersionKeyPrefix =
      'softinsa_mobile_data_version_user_';
  static const String _publicWebUrlKey = 'softinsa_public_web_url';

  Future<DateTime?> getLastDashboardUpdate({required int userId}) async {
    if (userId <= 0) return null;
    final preferences = await SharedPreferences.getInstance();
    final value = preferences.getString(_lastDashboardUpdateKey(userId));
    await preferences.remove(_legacyLastDashboardUpdateKey);

    if (value == null || value.isEmpty) {
      return null;
    }

    return DateTime.tryParse(value);
  }

  Future<void> saveLastDashboardUpdate({
    required int userId,
    required DateTime dateTime,
  }) async {
    if (userId <= 0) return;
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(
      _lastDashboardUpdateKey(userId),
      dateTime.toUtc().toIso8601String(),
    );
    await preferences.remove(_legacyLastDashboardUpdateKey);
  }

  Future<String?> getMobileDataVersion({required int userId}) async {
    if (userId <= 0) return null;
    final preferences = await SharedPreferences.getInstance();
    final value = preferences.getString(_mobileDataVersionKey(userId));
    if (value == null || value.isEmpty) {
      // A chave antiga nao identificava o owner e pode pertencer a qualquer
      // conta usada anteriormente neste dispositivo. Nunca e seguro adota-la;
      // removemo-la e forcamos um snapshot completo apenas nesta primeira vez.
      await preferences.remove(_legacyMobileDataVersionKey);
      return null;
    }
    return value;
  }

  Future<void> saveMobileDataVersion({
    required int userId,
    required String version,
  }) async {
    if (userId <= 0 || version.trim().isEmpty) return;
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_mobileDataVersionKey(userId), version);
    await preferences.remove(_legacyMobileDataVersionKey);
  }

  String _mobileDataVersionKey(int userId) {
    return '$_mobileDataVersionKeyPrefix$userId';
  }

  String _lastDashboardUpdateKey(int userId) {
    return '$_lastDashboardUpdateKeyPrefix$userId';
  }

  Future<void> invalidatePersonalSyncState(int userId) async {
    if (userId <= 0) return;
    final preferences = await SharedPreferences.getInstance();
    await preferences.remove(_mobileDataVersionKey(userId));
    await preferences.remove(_lastDashboardUpdateKey(userId));
    await preferences.remove(_legacyMobileDataVersionKey);
    await preferences.remove(_legacyLastDashboardUpdateKey);
  }

  Future<void> savePublicWebUrl(String url) async {
    if (url.trim().isEmpty) return;
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(
      _publicWebUrlKey,
      url.replaceAll(RegExp(r'/$'), ''),
    );
  }

  Future<String?> getPublicWebUrl() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(_publicWebUrlKey);
  }
}
