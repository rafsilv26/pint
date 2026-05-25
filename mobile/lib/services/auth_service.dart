import 'package:shared_preferences/shared_preferences.dart';

class AuthService {
  static const String _loggedInKey = 'softinsa_user_logged_in';
  static const String _nameKey = 'softinsa_user_name';
  static const String _emailKey = 'softinsa_user_email';

  Future<bool> isLoggedIn() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getBool(_loggedInKey) ?? false;
  }

  Future<void> login({
    required String email,
    required String password,
    required bool rememberLogin,
  }) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_loggedInKey, true);

    if (rememberLogin) {
      await preferences.setString(_emailKey, email);
    }
  }

  Future<void> createAccount({
    required String name,
    required String email,
  }) async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setString(_nameKey, name);
    await preferences.setString(_emailKey, email);
  }

  Future<void> confirmAccount() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_loggedInKey, true);
  }

  Future<String?> getSavedEmail() async {
    final preferences = await SharedPreferences.getInstance();
    return preferences.getString(_emailKey);
  }

  Future<void> logout() async {
    final preferences = await SharedPreferences.getInstance();
    await preferences.setBool(_loggedInKey, false);
  }
}
