import '../models/dashboard_data.dart';
import '../services/auth_service.dart';
import '../services/badges_api_service.dart';
import '../services/dashboard_sync_service.dart';
import '../services/local_badges_database.dart';

class DashboardRepository {
  DashboardRepository({
    BadgesApiService? apiService,
    AuthService? authService,
    LocalBadgesDatabase? database,
    DashboardSyncService? syncService,
  }) : apiService = apiService ?? BadgesApiService(),
       authService = authService ?? AuthService(),
       database = database ?? LocalBadgesDatabase.instance,
       syncService =
           syncService ??
           DashboardSyncService(
             apiService: apiService ?? BadgesApiService(),
             database: database ?? LocalBadgesDatabase.instance,
           );

  final BadgesApiService apiService;
  final AuthService authService;
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
      return (await _withSessionUser(
        localData,
      )).copyWith(loadedFromCache: !_lastSyncSucceeded);
    }

    return (await _withSessionUser(
      DashboardData.sample(),
    )).copyWith(loadedFromCache: true);
  }

  Future<void> refreshFromApi() async {
    _lastSyncSucceeded = await syncService.syncDashboard();
  }

  Future<void> handleFirebaseAtualizaNotification() async {
    await syncService.syncFromFirebaseAtualizaNotification();
  }

  Future<DashboardData> _withSessionUser(DashboardData data) async {
    final localUser = await database.getCurrentUserProfile();
    if (localUser != null) {
      return data.copyWith(
        userName: localUser.name.isNotEmpty ? localUser.name : data.userName,
        userRole: localUser.role.isNotEmpty ? localUser.role : data.userRole,
      );
    }

    final savedName = await authService.getSavedName();
    final savedRole = await authService.getSavedRole();

    return data.copyWith(
      userName: savedName != null && savedName.isNotEmpty
          ? savedName
          : data.userName,
      userRole: savedRole != null && savedRole.isNotEmpty
          ? savedRole
          : data.userRole,
    );
  }
}
