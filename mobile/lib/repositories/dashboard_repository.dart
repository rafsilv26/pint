import '../models/dashboard_data.dart';
import '../services/badges_api_service.dart';
import '../services/dashboard_sync_service.dart';
import '../services/local_badges_database.dart';

class DashboardRepository {
  DashboardRepository({
    BadgesApiService? apiService,
    LocalBadgesDatabase? database,
    DashboardSyncService? syncService,
  }) : apiService = apiService ?? BadgesApiService(),
       database = database ?? LocalBadgesDatabase.instance,
       syncService =
           syncService ??
           DashboardSyncService(
             apiService: apiService ?? BadgesApiService(),
             database: database ?? LocalBadgesDatabase.instance,
           );

  final BadgesApiService apiService;
  final LocalBadgesDatabase database;
  final DashboardSyncService syncService;
  bool _lastSyncSucceeded = false;

  Future<void> prepareLocalData() async {
    _lastSyncSucceeded = await syncService.syncDashboard();
  }

  Future<DashboardData> getDashboard() async {
    await database.ensureSeedData();
    final localData = await database.getDashboard();

    if (localData != null) {
      return localData.copyWith(loadedFromCache: !_lastSyncSucceeded);
    }

    return DashboardData.sample().copyWith(loadedFromCache: true);
  }

  Future<void> refreshFromApi() async {
    _lastSyncSucceeded = await syncService.syncDashboard();
  }

  Future<void> handleFirebaseAtualizaNotification() async {
    await syncService.syncFromFirebaseAtualizaNotification();
  }
}
