import 'package:url_launcher/url_launcher.dart';

import 'api_config.dart';
import 'sync_preferences_service.dart';

class PublicLinksService {
  PublicLinksService({SyncPreferencesService? preferences})
    : preferences = preferences ?? SyncPreferencesService();

  final SyncPreferencesService preferences;

  Future<Uri> badgePage(String token) async {
    final web = await preferences.getPublicWebUrl();
    if (web != null && web.isNotEmpty) return Uri.parse('$web/badge/$token');
    return verification(token);
  }

  Uri verification(String token) =>
      Uri.parse('${ApiConfig.baseUrl}/relatorios/verificar/$token');

  Uri certificate(String token) =>
      Uri.parse('${ApiConfig.baseUrl}/relatorios/certificado/$token');

  Future<Uri> linkedinShare(String token) async {
    final publicUrl = await badgePage(token);
    return Uri.https('www.linkedin.com', '/sharing/share-offsite/', {
      'url': publicUrl.toString(),
    });
  }

  Future<bool> open(Uri uri) =>
      launchUrl(uri, mode: LaunchMode.externalApplication);
}
