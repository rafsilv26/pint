import '../models/mobile_api_data.dart';
import '../services/badges_api_service.dart';
import '../services/local_badges_database.dart';

class MobileApiRepository {
  MobileApiRepository({
    BadgesApiService? apiService,
    LocalBadgesDatabase? database,
  }) : apiService = apiService ?? BadgesApiService(),
       database = database ?? LocalBadgesDatabase.instance;

  final BadgesApiService apiService;
  final LocalBadgesDatabase database;

  Future<void> syncAvailableMobileData() async {
    await Future.wait([
      syncConsultantsDirectory(),
      syncNotifications(),
      syncGamification(),
      syncEmailSignature(),
      syncCatalogData(),
    ]);
  }

  Future<bool> syncCatalogData() async {
    try {
      final results = await Future.wait([
        apiService.fetchCatalogResource('learning-paths'),
        apiService.fetchCatalogResource('service-lines'),
        apiService.fetchCatalogResource('areas'),
        apiService.fetchCatalogResource('levels'),
        apiService.fetchCatalogResource('requirements'),
        apiService.fetchCatalogResource('badges'),
        apiService.fetchMyCandidaturas(),
      ]);

      await database.upsertApiSnapshot({
        'learningPaths': results[0],
        'serviceLines': results[1],
        'areas': results[2],
        'levels': results[3],
        'requirements': results[4],
        'badges': results[5],
        'candidaturas': results[6],
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<List<CatalogBadge>> getCatalogBadges() async {
    await syncCatalogData();
    return database.getCatalogBadges();
  }

  Future<List<MyBadgeApplication>> getMyBadgeApplications() async {
    await syncCatalogData();
    return database.getMyBadgeApplications();
  }

  Future<void> submitCandidatura(int badgeId) async {
    await apiService.submitCandidatura(badgeId: badgeId);
    await syncCatalogData();
    await syncNotifications();
    await syncGamification();
  }

  Future<bool> syncConsultantsDirectory() async {
    try {
      final payload = await apiService.fetchConsultantsDirectory();
      if (payload != null) {
        await database.upsertConsultantsDirectory(payload);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<ConsultantsDirectoryData> getConsultantsDirectory() async {
    final synced = await syncConsultantsDirectory();
    final local = await database.getConsultantsDirectory();
    return ConsultantsDirectoryData(
      consultants: local.consultants,
      stats: local.stats,
      loadedFromCache: !synced,
    );
  }

  Future<bool> syncNotifications() async {
    try {
      final payload = await apiService.fetchNotifications();
      if (payload != null) {
        await database.upsertNotifications(payload);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<List<AppNotification>> getNotifications() async {
    await syncNotifications();
    return database.getNotifications();
  }

  Future<void> markNotificationAsRead(String id) async {
    await apiService.markNotificationAsRead(id);
    await database.markNotificationReadLocally(id);
  }

  Future<void> markAllNotificationsAsRead() async {
    await apiService.markAllNotificationsAsRead();
    await database.markAllNotificationsReadLocally();
  }

  Future<bool> syncGamification() async {
    try {
      final payload = await apiService.fetchGamification();
      if (payload != null) {
        await database.upsertGamification(payload);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<GamificationData> getGamification() async {
    final synced = await syncGamification();
    final local = await database.getGamification();
    return GamificationData(
      summary: local.summary,
      achievements: local.achievements,
      ranking: local.ranking,
      timeline: local.timeline,
      loadedFromCache: !synced,
    );
  }

  Future<bool> syncEmailSignature() async {
    try {
      final payload = await apiService.fetchEmailSignature();
      if (payload != null) {
        await database.upsertEmailSignature(payload);
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<EmailSignatureData> getEmailSignature() async {
    final synced = await syncEmailSignature();
    final local = await database.getEmailSignature();
    return EmailSignatureData(
      profile: local.profile,
      badges: local.badges,
      templateHtml: local.templateHtml,
      loadedFromCache: !synced,
    );
  }

  Future<EmailSignatureData> saveEmailSignature({
    required List<int> badgeIds,
    required String templateHtml,
  }) async {
    await apiService.saveEmailSignature(
      badgeIds: badgeIds,
      templateHtml: templateHtml,
    );
    await syncEmailSignature();
    return database.getEmailSignature();
  }
}
