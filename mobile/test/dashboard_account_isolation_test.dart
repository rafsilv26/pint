import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:softinsa_badges_mobile/models/dashboard_data.dart';
import 'package:softinsa_badges_mobile/services/auth_service.dart';
import 'package:softinsa_badges_mobile/services/badges_api_service.dart';
import 'package:softinsa_badges_mobile/services/dashboard_sync_service.dart';
import 'package:softinsa_badges_mobile/services/local_badges_database.dart';
import 'package:softinsa_badges_mobile/services/sync_preferences_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  sqfliteFfiInit();

  late LocalBadgesDatabase database;

  setUp(() {
    SharedPreferences.setMockInitialValues({});
    database = LocalBadgesDatabase.forTesting(
      databaseFactory: databaseFactoryFfi,
      databasePath: inMemoryDatabasePath,
    );
  });

  tearDown(() => database.closeForTesting());

  test(
    'A para B para A limpa dashboard mas preserva catalogo e outboxes',
    () async {
      expect(await database.upsertCurrentUser(_user(22)), isTrue);
      await database.upsertApiSnapshot({
        'badges': [
          {
            'id': 7001,
            'nome': 'Badge partilhada',
            'descricao': 'Catalogo',
            'pontos': 100,
            'ativo': true,
          },
        ],
      }, ownerUserId: 22);
      await database.enqueuePendingBadgeApplication(
        clientRequestId: 'outbox-a',
        ownerUserId: 22,
        badgeId: 7001,
        evidenceFiles: const [],
      );
      await database.upsertDashboard(
        DashboardData.sample().copyWith(userName: 'Utilizador A'),
        ownerUserId: 22,
      );

      expect(await database.upsertCurrentUser(_user(22)), isFalse);
      expect((await database.getDashboard())?.userName, 'Utilizador A');

      expect(await database.upsertCurrentUser(_user(99)), isTrue);
      expect(await database.getDashboard(), isNull);
      var sqlite = await database.database;
      expect(await sqlite.query('badge_recommendations'), isEmpty);
      expect(await sqlite.query('badges'), hasLength(1));
      expect(await database.getPendingBadgeApplications(22), hasLength(1));

      expect(await database.upsertCurrentUser(_user(22)), isTrue);
      expect(await database.getDashboard(), isNull);
      sqlite = await database.database;
      expect(await sqlite.query('badges'), hasLength(1));
      expect(await database.getPendingBadgeApplications(22), hasLength(1));
    },
  );

  test('login ativa SQLite e invalida sync antes de expor a sessao', () async {
    await database.upsertCurrentUser(_user(22));
    await database.upsertDashboard(
      DashboardData.sample().copyWith(userName: 'Utilizador antigo'),
      ownerUserId: 22,
    );
    await database.enqueuePendingBadgeApplication(
      clientRequestId: 'outbox-antiga',
      ownerUserId: 22,
      badgeId: 42,
      evidenceFiles: const [],
    );
    final preferencesService = SyncPreferencesService();
    await preferencesService.saveMobileDataVersion(
      userId: 22,
      version: 'versao-antiga-22',
    );
    await preferencesService.saveMobileDataVersion(
      userId: 99,
      version: 'versao-antiga-99',
    );
    await preferencesService.saveLastDashboardUpdate(
      userId: 99,
      dateTime: DateTime.utc(2026, 7, 15),
    );
    final token = _token(99);
    final auth = AuthService(
      database: database,
      syncPreferencesService: preferencesService,
      client: MockClient(
        (_) async => http.Response(
          jsonEncode({'token': token, 'user': _user(99)}),
          200,
          headers: {'content-type': 'application/json'},
        ),
      ),
    );

    await auth.login(
      email: 'user99@example.test',
      password: 'Password123!',
      rememberLogin: false,
    );

    expect((await database.getCurrentUserProfile())?.id, 99);
    expect(await database.getDashboard(), isNull);
    expect(await database.getPendingBadgeApplications(22), hasLength(1));
    expect(await preferencesService.getMobileDataVersion(userId: 99), isNull);
    expect(
      await preferencesService.getMobileDataVersion(userId: 22),
      'versao-antiga-22',
    );
    expect(await preferencesService.getLastDashboardUpdate(userId: 99), isNull);
    expect((await auth.getSessionSnapshot())?.userId, 99);

    await database.upsertDashboard(
      DashboardData.sample().copyWith(userName: 'Dashboard B'),
      ownerUserId: 99,
    );
    final authA = AuthService(
      database: database,
      syncPreferencesService: preferencesService,
      client: MockClient(
        (_) async => http.Response(
          jsonEncode({'token': _token(22), 'user': _user(22)}),
          200,
          headers: {'content-type': 'application/json'},
        ),
      ),
    );
    await authA.login(
      email: 'user22@example.test',
      password: 'Password123!',
      rememberLogin: false,
    );
    expect(await preferencesService.getMobileDataVersion(userId: 22), isNull);
    expect(await database.getDashboard(), isNull);

    await database.upsertDashboard(
      DashboardData.sample().copyWith(userName: 'Dashboard A novo'),
      ownerUserId: 22,
    );
    await preferencesService.saveMobileDataVersion(
      userId: 22,
      version: 'versao-fresca-22',
    );
    await authA.login(
      email: 'user22@example.test',
      password: 'Password123!',
      rememberLogin: false,
    );
    expect((await database.getDashboard())?.userName, 'Dashboard A novo');
    expect(
      await preferencesService.getMobileDataVersion(userId: 22),
      'versao-fresca-22',
    );
  });

  test(
    'DashboardSync usa cursor do owner e rejeita resposta apos troca',
    () async {
      const session22 = AuthSessionSnapshot(userId: 22, token: 'token-22');
      const session99 = AuthSessionSnapshot(userId: 99, token: 'token-99');
      var activeSession = session22;
      await database.upsertCurrentUser(_user(22));
      final preferences = SyncPreferencesService();
      final cursor22 = DateTime.utc(2026, 7, 16, 8);
      await preferences.saveLastDashboardUpdate(userId: 22, dateTime: cursor22);
      final api = _DashboardApi(
        currentUser: _user(22),
        update: DashboardApiUpdate(
          dashboard: DashboardData.sample().copyWith(userName: 'Resposta A'),
          serverUpdatedAt: DateTime.utc(2026, 7, 16, 9),
        ),
      );
      final service = DashboardSyncService(
        apiService: api,
        database: database,
        preferencesService: preferences,
        sessionProvider: () async => activeSession,
      );

      expect(await service.syncDashboard(), isTrue);
      expect(api.requestedLastUpdate, cursor22);
      expect((await database.getDashboard())?.userName, 'Resposta A');

      api.onFetchDashboard = () async {
        activeSession = session99;
        await database.upsertCurrentUser(_user(99));
      };
      expect(await service.syncDashboard(), isFalse);
      expect(await database.getDashboard(), isNull);
    },
  );
}

Map<String, dynamic> _user(int id) => {
  'id': id,
  'nome': 'Utilizador $id',
  'email': 'user$id@example.test',
  'role': 'Consultor',
  'mustChangePassword': false,
};

String _token(int userId) {
  final payload = base64Url.encode(
    utf8.encode(
      jsonEncode({
        'id': userId,
        'exp':
            DateTime.now()
                .add(const Duration(hours: 2))
                .millisecondsSinceEpoch ~/
            1000,
      }),
    ),
  );
  return 'header.$payload.signature';
}

class _DashboardApi extends BadgesApiService {
  _DashboardApi({required this.currentUser, required this.update});

  final Map<String, dynamic> currentUser;
  final DashboardApiUpdate update;
  DateTime? requestedLastUpdate;
  Future<void> Function()? onFetchDashboard;

  @override
  Future<Map<String, dynamic>?> fetchCurrentUser() async => currentUser;

  @override
  Future<DashboardApiUpdate?> fetchDashboardUpdates({
    DateTime? lastUpdate,
  }) async {
    requestedLastUpdate = lastUpdate;
    await onFetchDashboard?.call();
    return update;
  }
}
