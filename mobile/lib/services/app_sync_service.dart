import '../repositories/mobile_api_repository.dart';
import 'app_data_refresh_service.dart';
import 'auth_service.dart';
import 'badges_api_service.dart';
import 'candidatura_outbox_service.dart';
import 'dashboard_sync_service.dart';
import 'sync_preferences_service.dart';

/// Sincronizacao a pedido: primeiro pergunta pelo numero de versao e so
/// descarrega os recursos quando a API confirma que existem alteracoes.
class AppSyncService {
  AppSyncService({
    BadgesApiService? apiService,
    DashboardSyncService? dashboardSyncService,
    MobileApiRepository? mobileRepository,
    SyncPreferencesService? preferencesService,
    CandidaturaOutbox? candidaturaOutbox,
    AppDataRefreshService? dataRefreshService,
    Future<AuthSessionSnapshot?> Function()? sessionProvider,
  }) : apiService = apiService ?? BadgesApiService(),
       dashboardSyncService = dashboardSyncService ?? DashboardSyncService(),
       mobileRepository = mobileRepository ?? MobileApiRepository(),
       preferencesService = preferencesService ?? SyncPreferencesService(),
       candidaturaOutbox =
           candidaturaOutbox ??
           CandidaturaOutboxService(apiService: apiService),
       dataRefreshService =
           dataRefreshService ?? AppDataRefreshService.instance,
       sessionProvider = sessionProvider ?? AuthService().getSessionSnapshot;

  final BadgesApiService apiService;
  final DashboardSyncService dashboardSyncService;
  final MobileApiRepository mobileRepository;
  final SyncPreferencesService preferencesService;
  final CandidaturaOutbox candidaturaOutbox;
  final AppDataRefreshService dataRefreshService;
  final Future<AuthSessionSnapshot?> Function() sessionProvider;

  Future<bool> synchronizeIfNeeded({bool force = false}) async {
    try {
      final syncSession = await sessionProvider();
      if (syncSession == null) return false;

      final outboxResult = await candidaturaOutbox.flushPendingApplications();
      if (outboxResult.localStateChanged) {
        dataRefreshService.dataChanged();
      }
      if (await sessionProvider() != syncSession) return false;

      final awaitingRefresh = await candidaturaOutbox
          .hasSentApplicationsAwaitingRefresh();
      if (await sessionProvider() != syncSession) return false;

      final mustRefresh = force || outboxResult.sentAny || awaitingRefresh;
      final localVersion = await preferencesService.getMobileDataVersion(
        userId: syncSession.userId,
      );
      final status = await apiService.fetchMobileSyncStatus(
        version: mustRefresh ? null : localVersion,
      );
      if (await sessionProvider() != syncSession) return false;

      await preferencesService.savePublicWebUrl(status.publicWebUrl);
      if (await sessionProvider() != syncSession) return false;
      if (!mustRefresh && !status.changed) {
        return !outboxResult.retryPending;
      }

      final results = await Future.wait([
        dashboardSyncService.syncDashboard(),
        mobileRepository.syncAvailableMobileData(),
      ]);
      if (!results.every((result) => result)) {
        return false;
      }
      if (await sessionProvider() != syncSession) return false;

      await preferencesService.saveMobileDataVersion(
        userId: syncSession.userId,
        version: status.version,
      );
      final cleanupSession = outboxResult.session;
      if (cleanupSession != null) {
        await candidaturaOutbox.completeSentApplications(cleanupSession);
      }
      dataRefreshService.dataChanged();
      return !outboxResult.retryPending;
    } catch (_) {
      // Offline ou API indisponivel: a interface continua a usar SQLite.
      return false;
    }
  }
}
