import 'package:flutter_test/flutter_test.dart';
import 'package:softinsa_badges_mobile/models/mobile_api_data.dart';
import 'package:softinsa_badges_mobile/models/pending_badge_application.dart';
import 'package:softinsa_badges_mobile/repositories/mobile_api_repository.dart';
import 'package:softinsa_badges_mobile/services/app_data_refresh_service.dart';
import 'package:softinsa_badges_mobile/services/app_sync_service.dart';
import 'package:softinsa_badges_mobile/services/auth_service.dart';
import 'package:softinsa_badges_mobile/services/badges_api_service.dart';
import 'package:softinsa_badges_mobile/services/candidatura_outbox_service.dart';
import 'package:softinsa_badges_mobile/services/dashboard_sync_service.dart';
import 'package:softinsa_badges_mobile/services/sync_preferences_service.dart';

void main() {
  const session22 = AuthSessionSnapshot(userId: 22, token: 'token-22');

  test('nao descarrega dados quando a versao da API nao mudou', () async {
    final api = _Api(changed: false, version: 'v1');
    final dashboard = _DashboardSync();
    final mobile = _MobileRepository();
    final preferences = _Preferences(version: 'v1');
    final outbox = _Outbox();
    final service = AppSyncService(
      apiService: api,
      dashboardSyncService: dashboard,
      mobileRepository: mobile,
      preferencesService: preferences,
      candidaturaOutbox: outbox,
      sessionProvider: () async => session22,
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
    final outbox = _Outbox();
    final service = AppSyncService(
      apiService: api,
      dashboardSyncService: dashboard,
      mobileRepository: mobile,
      preferencesService: preferences,
      candidaturaOutbox: outbox,
      sessionProvider: () async => session22,
    );

    expect(await service.synchronizeIfNeeded(), isTrue);
    expect(dashboard.calls, 1);
    expect(mobile.calls, 1);
    expect(preferences.version, 'v2');
    expect(preferences.savedUserIds, [22]);
  });

  test(
    'envia a fila antes do status e força refresh depois do envio',
    () async {
      final calls = <String>[];
      final api = _Api(changed: false, version: 'v2', calls: calls);
      final dashboard = _DashboardSync();
      final mobile = _MobileRepository();
      final preferences = _Preferences(version: 'v1');
      final outbox = _Outbox(sentAny: true, calls: calls);
      final service = AppSyncService(
        apiService: api,
        dashboardSyncService: dashboard,
        mobileRepository: mobile,
        preferencesService: preferences,
        candidaturaOutbox: outbox,
        sessionProvider: () async => session22,
      );

      expect(await service.synchronizeIfNeeded(), isTrue);
      expect(calls.take(2), ['outbox', 'status']);
      expect(api.requestedVersion, isNull);
      expect(dashboard.calls, 1);
      expect(mobile.calls, 1);
      expect(outbox.completeCalls, 1);
    },
  );

  test(
    'mantem o backoff quando o POST ficou pendente mas o status responde',
    () async {
      final service = AppSyncService(
        apiService: _Api(changed: false, version: 'v1'),
        dashboardSyncService: _DashboardSync(),
        mobileRepository: _MobileRepository(),
        preferencesService: _Preferences(version: 'v1'),
        candidaturaOutbox: _Outbox(retryPending: true),
        sessionProvider: () async => session22,
      );

      expect(await service.synchronizeIfNeeded(), isFalse);
    },
  );

  test('notifica a interface quando a outbox muda sem nova versao', () async {
    final refresh = AppDataRefreshService();
    var notifications = 0;
    refresh.addListener(() => notifications++);
    final service = AppSyncService(
      apiService: _Api(changed: false, version: 'v1'),
      dashboardSyncService: _DashboardSync(),
      mobileRepository: _MobileRepository(),
      preferencesService: _Preferences(version: 'v1'),
      candidaturaOutbox: _Outbox(localStateChanged: true),
      dataRefreshService: refresh,
      sessionProvider: () async => session22,
    );

    expect(await service.synchronizeIfNeeded(), isTrue);
    expect(notifications, 1);
  });

  test(
    'transporta a sessao do flush e nao limpa depois de B mudar para A',
    () async {
      const sessionB = AuthSessionSnapshot(userId: 22, token: 'token-b');
      const sessionA = AuthSessionSnapshot(userId: 99, token: 'token-a');
      var activeSession = sessionB;
      final outbox = _Outbox(sentAny: true, flushSession: sessionB);
      final mobile = _MobileRepository(
        onSync: () {
          activeSession = sessionA;
          outbox.activeSession = sessionA;
        },
      );
      final service = AppSyncService(
        apiService: _Api(changed: false, version: 'v2'),
        dashboardSyncService: _DashboardSync(),
        mobileRepository: mobile,
        preferencesService: _Preferences(version: 'v1'),
        candidaturaOutbox: outbox,
        sessionProvider: () async => activeSession,
      );

      expect(await service.synchronizeIfNeeded(), isFalse);
      expect(outbox.receivedCleanupSession, isNull);
      expect(outbox.completeCalls, 0);
    },
  );

  test('cada conta consulta apenas a sua versao mobile', () async {
    const session99 = AuthSessionSnapshot(userId: 99, token: 'token-99');
    final preferences = _Preferences(versions: const {22: 'v22', 99: 'v99'});
    final api22 = _Api(changed: false, version: 'v22');
    final api99 = _Api(changed: false, version: 'v99');

    final service22 = AppSyncService(
      apiService: api22,
      dashboardSyncService: _DashboardSync(),
      mobileRepository: _MobileRepository(),
      preferencesService: preferences,
      candidaturaOutbox: _Outbox(),
      sessionProvider: () async => session22,
    );
    final service99 = AppSyncService(
      apiService: api99,
      dashboardSyncService: _DashboardSync(),
      mobileRepository: _MobileRepository(),
      preferencesService: preferences,
      candidaturaOutbox: _Outbox(flushSession: session99),
      sessionProvider: () async => session99,
    );

    expect(await service22.synchronizeIfNeeded(), isTrue);
    expect(await service99.synchronizeIfNeeded(), isTrue);
    expect(api22.requestedVersion, 'v22');
    expect(api99.requestedVersion, 'v99');
    expect(preferences.readUserIds, [22, 99]);
  });

  test('nao grava a versao se a conta mudar durante o status', () async {
    const session99 = AuthSessionSnapshot(userId: 99, token: 'token-99');
    var activeSession = session22;
    final preferences = _Preferences(version: 'v1');
    final service = AppSyncService(
      apiService: _Api(
        changed: true,
        version: 'v2',
        onStatus: () => activeSession = session99,
      ),
      dashboardSyncService: _DashboardSync(),
      mobileRepository: _MobileRepository(),
      preferencesService: preferences,
      candidaturaOutbox: _Outbox(),
      sessionProvider: () async => activeSession,
    );

    expect(await service.synchronizeIfNeeded(), isFalse);
    expect(preferences.versions[22], 'v1');
    expect(preferences.savedUserIds, isEmpty);
  });
}

class _Api extends BadgesApiService {
  _Api({
    required this.changed,
    required this.version,
    this.calls,
    this.onStatus,
  });
  final bool changed;
  final String version;
  final List<String>? calls;
  final void Function()? onStatus;
  int statusCalls = 0;
  String? requestedVersion;

  @override
  Future<MobileSyncStatus> fetchMobileSyncStatus({String? version}) async {
    statusCalls++;
    calls?.add('status');
    requestedVersion = version;
    onStatus?.call();
    return MobileSyncStatus(changed: changed, version: this.version);
  }
}

class _Outbox implements CandidaturaOutbox {
  _Outbox({
    this.sentAny = false,
    this.retryPending = false,
    this.localStateChanged = false,
    this.flushSession = const AuthSessionSnapshot(
      userId: 22,
      token: 'token-22',
    ),
    this.calls,
  }) : activeSession = flushSession;

  final bool sentAny;
  final bool retryPending;
  final bool localStateChanged;
  final AuthSessionSnapshot flushSession;
  AuthSessionSnapshot activeSession;
  AuthSessionSnapshot? receivedCleanupSession;
  final List<String>? calls;
  int completeCalls = 0;

  @override
  Future<OutboxFlushResult> flushPendingApplications() async {
    calls?.add('outbox');
    return OutboxFlushResult(
      sentMessages: sentAny ? const {'request': 'Enviada'} : const {},
      retryPending: retryPending,
      localStateChanged: localStateChanged,
      session: flushSession,
    );
  }

  @override
  Future<bool> hasPendingWork() async => false;

  @override
  Future<bool> hasSentApplicationsAwaitingRefresh() async => false;

  @override
  Future<void> completeSentApplications(AuthSessionSnapshot session) async {
    receivedCleanupSession = session;
    if (activeSession == session) completeCalls++;
  }

  @override
  Future<BadgeApplicationSubmissionResult> submit({
    required int badgeId,
    required List<EvidenceAttachment> evidenceFiles,
    String? description,
  }) {
    throw UnimplementedError();
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
  _MobileRepository({this.onSync});

  final void Function()? onSync;
  int calls = 0;
  @override
  Future<bool> syncAvailableMobileData() async {
    calls++;
    onSync?.call();
    return true;
  }
}

class _Preferences extends SyncPreferencesService {
  _Preferences({String? version, Map<int, String>? versions})
    : versions = {22: ?version, ...?versions};

  final Map<int, String> versions;
  final List<int> readUserIds = [];
  final List<int> savedUserIds = [];

  String? get version => versions[22];

  @override
  Future<String?> getMobileDataVersion({required int userId}) async {
    readUserIds.add(userId);
    return versions[userId];
  }

  @override
  Future<void> saveMobileDataVersion({
    required int userId,
    required String version,
  }) async {
    savedUserIds.add(userId);
    versions[userId] = version;
  }
}
