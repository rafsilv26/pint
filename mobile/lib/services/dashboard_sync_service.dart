import 'auth_service.dart';
import 'badges_api_service.dart';
import 'local_badges_database.dart';
import 'sync_preferences_service.dart';

class DashboardSyncService {
  DashboardSyncService({
    BadgesApiService? apiService,
    LocalBadgesDatabase? database,
    SyncPreferencesService? preferencesService,
    Future<AuthSessionSnapshot?> Function()? sessionProvider,
  }) : apiService = apiService ?? BadgesApiService(),
       database = database ?? LocalBadgesDatabase.instance,
       preferencesService = preferencesService ?? SyncPreferencesService(),
       sessionProvider = sessionProvider ?? AuthService().getSessionSnapshot;

  final BadgesApiService apiService;
  final LocalBadgesDatabase database;
  final SyncPreferencesService preferencesService;
  final Future<AuthSessionSnapshot?> Function() sessionProvider;

  Future<bool> syncDashboard() async {
    try {
      final session = await sessionProvider();
      if (session == null) return false;

      final currentUser = await apiService.fetchCurrentUser();
      if (await sessionProvider() != session) return false;
      if (currentUser != null) {
        final responseUserId = _userId(currentUser);
        if (responseUserId != session.userId) return false;
        final changed = await database.upsertCurrentUser(currentUser);
        if (changed) {
          await preferencesService.invalidatePersonalSyncState(session.userId);
        }
      }
      if (await sessionProvider() != session) return false;

      final lastUpdate = await preferencesService.getLastDashboardUpdate(
        userId: session.userId,
      );
      final apiUpdate = await apiService.fetchDashboardUpdates(
        lastUpdate: lastUpdate,
      );
      if (await sessionProvider() != session) return false;

      if (apiUpdate == null) {
        return true;
      }

      final updateDate = apiUpdate.serverUpdatedAt ?? DateTime.now();
      final stored = await database.upsertDashboard(
        apiUpdate.dashboard,
        updatedAt: updateDate,
        ownerUserId: session.userId,
      );
      if (!stored || await sessionProvider() != session) return false;
      await database.upsertApiSnapshot(
        apiUpdate.rawPayload,
        updatedAt: updateDate,
        ownerUserId: session.userId,
      );
      if (await sessionProvider() != session) return false;
      await preferencesService.saveLastDashboardUpdate(
        userId: session.userId,
        dateTime: updateDate,
      );

      return true;
    } catch (_) {
      return false;
    }
  }

  Future<void> syncFromFirebaseAtualizaNotification() async {
    await syncDashboard();
  }

  int? _userId(Map<String, dynamic> user) {
    final value = user['id'] ?? user['USERID'];
    if (value is num) return value.toInt();
    return int.tryParse(value?.toString() ?? '');
  }
}
