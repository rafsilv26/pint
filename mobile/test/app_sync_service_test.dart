import 'package:flutter_test/flutter_test.dart';
import 'package:softinsa_badges_mobile/repositories/mobile_api_repository.dart';
import 'package:softinsa_badges_mobile/services/app_sync_service.dart';
import 'package:softinsa_badges_mobile/services/badges_api_service.dart';
import 'package:softinsa_badges_mobile/services/dashboard_sync_service.dart';
import 'package:softinsa_badges_mobile/services/sync_preferences_service.dart';

void main() {
  test('nao descarrega dados quando a versao da API nao mudou', () async {
    final api = _Api(changed: false, version: 'v1');
    final dashboard = _DashboardSync();
    final mobile = _MobileRepository();
    final preferences = _Preferences(version: 'v1');
    final service = AppSyncService(
      apiService: api,
      dashboardSyncService: dashboard,
      mobileRepository: mobile,
      preferencesService: preferences,
    );

    expect(await service.synchronizeIfNeeded(), isTrue);
    expect(api.statusCalls, 1);
    expect(dashboard.calls, 0);
    expect(mobile.calls, 0);
  });

  test('descarrega e grava a versao quando existem alteracoes', () async {
    final api = _Api(changed: true, version: 'v2');
    final dashboard = _DashboardSync();
    final mobile = _MobileRepository();
    final preferences = _Preferences(version: 'v1');
    final service = AppSyncService(
      apiService: api,
      dashboardSyncService: dashboard,
      mobileRepository: mobile,
      preferencesService: preferences,
    );

    expect(await service.synchronizeIfNeeded(), isTrue);
    expect(dashboard.calls, 1);
    expect(mobile.calls, 1);
    expect(preferences.version, 'v2');
  });
}

class _Api extends BadgesApiService {
  _Api({required this.changed, required this.version});
  final bool changed;
  final String version;
  int statusCalls = 0;

  @override
  Future<MobileSyncStatus> fetchMobileSyncStatus({String? version}) async {
    statusCalls++;
    return MobileSyncStatus(changed: changed, version: this.version);
  }
}

class _DashboardSync extends DashboardSyncService {
  int calls = 0;
  @override
  Future<bool> syncDashboard() async {
    calls++;
    return true;
  }
}

class _MobileRepository extends MobileApiRepository {
  int calls = 0;
  @override
  Future<bool> syncAvailableMobileData() async {
    calls++;
    return true;
  }
}

class _Preferences extends SyncPreferencesService {
  _Preferences({this.version});
  String? version;

  @override
  Future<String?> getMobileDataVersion() async => version;

  @override
  Future<void> saveMobileDataVersion(String version) async {
    this.version = version;
  }
}
