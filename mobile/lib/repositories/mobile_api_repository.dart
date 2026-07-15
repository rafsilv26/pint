import '../models/consultant_profile.dart';
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

  Future<bool> syncAvailableMobileData() async {
    final results = await Future.wait([
      syncConsultantsDirectory(),
      syncNotifications(),
      syncGamification(),
      syncEmailSignature(),
      syncCatalogData(),
    ]);
    return results.every((result) => result);
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
      final consultantBadges = await _fetchOptionalCatalogResource(
        'consultor-badges',
      );
      final badgePremium = await _fetchOptionalCatalogResource('badge-premium');
      final consultantBadgePremium = await _fetchOptionalCatalogResource(
        'consultor-badge-premium',
      );

      final snapshot = <String, Object?>{
        'learningPaths': results[0],
        'serviceLines': results[1],
        'areas': results[2],
        'levels': results[3],
        'requirements': results[4],
        'badges': results[5],
        'candidaturas': results[6],
      };
      if (consultantBadges != null) {
        snapshot['consultorBadges'] = consultantBadges;
      }
      if (badgePremium != null) {
        snapshot['badgePremium'] = badgePremium;
      }
      if (consultantBadgePremium != null) {
        snapshot['consultorBadgePremium'] = consultantBadgePremium;
      }

      await database.upsertApiSnapshot(snapshot);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<List<Map<String, dynamic>>?> _fetchOptionalCatalogResource(
    String resource,
  ) async {
    try {
      return await apiService.fetchCatalogResource(resource);
    } catch (_) {
      return null;
    }
  }

  Future<List<CatalogBadge>> getCatalogBadges() async {
    return database.getCatalogBadges();
  }

  Future<List<MyBadgeApplication>> getMyBadgeApplications() async {
    return database.getMyBadgeApplications();
  }

  Future<String> submitCandidatura({
    required int badgeId,
    List<EvidenceAttachment> evidenceFiles = const [],
    String? descricao,
  }) async {
    final response = await apiService.submitCandidatura(
      badgeId: badgeId,
      evidenceFiles: evidenceFiles,
      descricao: descricao,
    );
    await syncCatalogData();
    await syncNotifications();
    await syncGamification();
    return _apiMessage(response) ?? 'Candidatura submetida com sucesso.';
  }

  String? _apiMessage(Map<String, dynamic>? response) {
    final message =
        response?['mensagem'] ?? response?['message'] ?? response?['erro'];
    if (message is String && message.trim().isNotEmpty) {
      return message;
    }

    return null;
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
    final local = await database.getConsultantsDirectory();
    return ConsultantsDirectoryData(
      consultants: local.consultants,
      stats: local.stats,
      loadedFromCache: true,
    );
  }

  Future<ConsultantDetailData> getConsultantDetail(
    ConsultantProfile consultant,
  ) async {
    final local = await database.getConsultantDetail(consultant);
    return ConsultantDetailData(
      consultant: local.consultant,
      badges: local.badges,
      achievements: local.achievements,
      stats: local.stats,
      loadedFromCache: true,
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
    final local = await database.getGamification();
    return GamificationData(
      summary: local.summary,
      achievements: local.achievements,
      ranking: local.ranking,
      timeline: local.timeline,
      loadedFromCache: true,
    );
  }

  Future<void> createTimelineObjective({
    required String title,
    required String description,
    required DateTime expectedDate,
    int priority = 3,
  }) async {
    await apiService.createTimelineObjective(
      title: title,
      description: description,
      expectedDate: expectedDate,
      priority: priority,
    );
    await syncGamification();
  }

  Future<void> setTimelineObjectiveCompleted(String id, bool completed) async {
    await apiService.setTimelineObjectiveCompleted(id, completed);
    await syncGamification();
  }

  Future<void> deleteTimelineObjective(String id) async {
    await apiService.deleteTimelineObjective(id);
    await syncGamification();
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
    final local = await database.getEmailSignature();
    return EmailSignatureData(
      profile: local.profile,
      badges: local.badges,
      templateHtml: local.templateHtml,
      loadedFromCache: true,
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
