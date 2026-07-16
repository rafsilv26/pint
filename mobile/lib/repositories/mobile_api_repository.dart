import '../models/consultant_profile.dart';
import '../models/mobile_api_data.dart';
import '../models/pending_badge_application.dart';
import '../services/auth_service.dart';
import '../services/app_data_refresh_service.dart';
import '../services/badges_api_service.dart';
import '../services/candidatura_outbox_service.dart';
import '../services/local_badges_database.dart';

class MobileApiRepository {
  MobileApiRepository({
    BadgesApiService? apiService,
    LocalBadgesDatabase? database,
    CandidaturaOutbox? candidaturaOutbox,
    Future<int?> Function()? currentUserIdProvider,
  }) {
    this.apiService = apiService ?? BadgesApiService();
    this.database = database ?? LocalBadgesDatabase.instance;
    this.currentUserIdProvider =
        currentUserIdProvider ?? AuthService().getCurrentUserId;
    this.candidaturaOutbox =
        candidaturaOutbox ??
        CandidaturaOutboxService(
          apiService: this.apiService,
          database: this.database,
        );
  }

  late final BadgesApiService apiService;
  late final LocalBadgesDatabase database;
  late final CandidaturaOutbox candidaturaOutbox;
  late final Future<int?> Function() currentUserIdProvider;

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
      final ownerUserId = await currentUserIdProvider();
      if (ownerUserId == null) return false;
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

      if (await currentUserIdProvider() != ownerUserId) return false;
      await database.upsertApiSnapshot(snapshot, ownerUserId: ownerUserId);
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
    final ownerUserId = await currentUserIdProvider();
    final badges = await database.getCatalogBadges(ownerUserId: ownerUserId);
    if (ownerUserId == null) return badges;
    final pending = await database.getPendingBadgeApplications(
      ownerUserId,
      states: const ['queued', 'sent'],
    );
    final pendingBadgeIds = pending.map((item) => item.badgeId).toSet();
    return badges.map((badge) {
      if (badge.hasApplication || !pendingBadgeIds.contains(badge.id)) {
        return badge;
      }
      return badge.copyWith(applicationStatus: 'Pendente de envio');
    }).toList();
  }

  Future<List<MyBadgeApplication>> getMyBadgeApplications() async {
    final ownerUserId = await currentUserIdProvider();
    if (ownerUserId == null) return const [];
    final applications = await database.getMyBadgeApplications(
      ownerUserId: ownerUserId,
    );
    final pending = await database.getPendingBadgeApplications(ownerUserId);
    if (pending.isEmpty) return applications;

    final catalogById = {
      for (final badge in await database.getCatalogBadges(
        ownerUserId: ownerUserId,
      ))
        badge.id: badge,
    };
    final existingBadgeIds = applications.map((item) => item.badgeId).toSet();
    for (final item in pending) {
      if (existingBadgeIds.contains(item.badgeId)) continue;
      final badge = catalogById[item.badgeId];
      applications.add(
        MyBadgeApplication(
          id: -1000000 - item.localId,
          badgeId: item.badgeId,
          title: badge?.title ?? 'Badge #${item.badgeId}',
          description: item.hasFailed
              ? item.lastError ?? 'Não foi possível enviar a candidatura.'
              : 'Guardada no telemóvel e a aguardar ligação à Internet.',
          status: item.hasFailed ? 'SYNC_FAILED' : 'PENDING_SYNC',
          statusLabel: item.hasFailed ? 'Falha no envio' : 'Pendente de envio',
          points: badge?.points ?? 0,
          imagePath: badge?.imagePath ?? '',
          evidences: item.evidences.map((evidence) {
            return ApplicationEvidence(
              id: -evidence.id,
              requirementId: evidence.requirementId,
              fileName: evidence.originalName,
              url: '',
              type: 'LOCAL',
            );
          }).toList(),
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        ),
      );
    }
    applications.sort((a, b) {
      final first = a.updatedAt ?? a.createdAt;
      final second = b.updatedAt ?? b.createdAt;
      if (first == null && second == null) return 0;
      if (first == null) return 1;
      if (second == null) return -1;
      return second.compareTo(first);
    });
    return applications;
  }

  Future<BadgeApplicationSubmissionResult> submitCandidatura({
    required int badgeId,
    List<EvidenceAttachment> evidenceFiles = const [],
    String? descricao,
  }) async {
    final result = await candidaturaOutbox.submit(
      badgeId: badgeId,
      evidenceFiles: evidenceFiles,
      description: descricao,
    );
    AppDataRefreshService.instance.dataChanged();
    return result;
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
