import 'badges_api_service.dart';
import 'local_badges_database.dart';
import 'sync_preferences_service.dart';

class DashboardSyncService {
  DashboardSyncService({
    BadgesApiService? apiService,
    LocalBadgesDatabase? database,
    SyncPreferencesService? preferencesService,
  }) : apiService = apiService ?? BadgesApiService(),
       database = database ?? LocalBadgesDatabase.instance,
       preferencesService = preferencesService ?? SyncPreferencesService();

  final BadgesApiService apiService;
  final LocalBadgesDatabase database;
  final SyncPreferencesService preferencesService;

  Future<bool> syncDashboard() async {
    await database.ensureSeedData();

    try {
      final currentUser = await apiService.fetchCurrentUser();
      if (currentUser != null) {
        await database.upsertCurrentUser(currentUser);
      }

      final lastUpdate = await preferencesService.getLastDashboardUpdate();
      final apiUpdate = await apiService.fetchDashboardUpdates(
        lastUpdate: lastUpdate,
      );

      if (apiUpdate == null) {
        return true;
      }

      final updateDate = apiUpdate.serverUpdatedAt ?? DateTime.now();
      await database.upsertDashboard(
        apiUpdate.dashboard,
        updatedAt: updateDate,
      );
      await database.upsertApiSnapshot(
        apiUpdate.rawPayload,
        updatedAt: updateDate,
      );
      await preferencesService.saveLastDashboardUpdate(updateDate);

      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> syncFromFirebaseAtualizaNotification() async {
    await syncDashboard();
  }
}
