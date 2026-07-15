import '../repositories/mobile_api_repository.dart';
import 'badges_api_service.dart';
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
  }) : apiService = apiService ?? BadgesApiService(),
       dashboardSyncService = dashboardSyncService ?? DashboardSyncService(),
       mobileRepository = mobileRepository ?? MobileApiRepository(),
       preferencesService = preferencesService ?? SyncPreferencesService();

  final BadgesApiService apiService;
  final DashboardSyncService dashboardSyncService;
  final MobileApiRepository mobileRepository;
  final SyncPreferencesService preferencesService;

  Future<bool> synchronizeIfNeeded({bool force = false}) async {
    try {
      final localVersion = await preferencesService.getMobileDataVersion();
      final status = await apiService.fetchMobileSyncStatus(
        version: force ? null : localVersion,
      );
      await preferencesService.savePublicWebUrl(status.publicWebUrl);
      if (!force && !status.changed) {
        return true;
      }

      final results = await Future.wait([
        dashboardSyncService.syncDashboard(),
        mobileRepository.syncAvailableMobileData(),
      ]);
      if (!results.every((result) => result)) {
        return false;
      }

      await preferencesService.saveMobileDataVersion(status.version);
      return true;
    } catch (_) {
      // Offline ou API indisponivel: a interface continua a usar SQLite.
      return false;
    }
  }
}
