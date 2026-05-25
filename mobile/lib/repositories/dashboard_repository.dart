import '../models/dashboard_data.dart';
import '../services/badges_api_service.dart';
import '../services/dashboard_cache_service.dart';

class DashboardRepository {
  DashboardRepository({
    BadgesApiService? apiService,
    DashboardCacheService? cacheService,
  }) : apiService = apiService ?? BadgesApiService(),
       cacheService = cacheService ?? DashboardCacheService();

  final BadgesApiService apiService;
  final DashboardCacheService cacheService;

  Future<DashboardData> getDashboard() async {
    try {
      final onlineData = await apiService.fetchDashboard();
      await cacheService.saveDashboard(onlineData);
      return onlineData.copyWith(loadedFromCache: false);
    } catch (_) {
      final cachedData = await cacheService.getDashboard();

      if (cachedData != null) {
        return cachedData.copyWith(loadedFromCache: true);
      }

      final sampleData = DashboardData.sample();
      await cacheService.saveDashboard(sampleData);
      return sampleData.copyWith(loadedFromCache: true);
    }
  }
}
