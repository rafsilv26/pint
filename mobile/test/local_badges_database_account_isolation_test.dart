import 'package:flutter_test/flutter_test.dart';
import 'package:sqflite_common_ffi/sqflite_ffi.dart';
import 'package:softinsa_badges_mobile/services/local_badges_database.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  sqfliteFfiInit();

  late LocalBadgesDatabase database;

  setUp(() {
    database = LocalBadgesDatabase.forTesting(
      databaseFactory: databaseFactoryFfi,
      databasePath: inMemoryDatabasePath,
    );
  });

  tearDown(() => database.closeForTesting());

  test(
    'candidaturas, evidencias e historico ficam isolados por owner',
    () async {
      await database.upsertApiSnapshot(
        _snapshot(
          ownerUserId: 22,
          candidaturaId: 2201,
          badgeId: 42,
          badgeName: 'Badge do utilizador 22',
          evidenceId: 221,
          historyId: 222,
        ),
        ownerUserId: 22,
      );
      await database.upsertApiSnapshot(
        _snapshot(
          ownerUserId: 99,
          candidaturaId: 9901,
          badgeId: 43,
          badgeName: 'Badge do utilizador 99',
          evidenceId: 991,
          historyId: 992,
        ),
        ownerUserId: 99,
      );

      final sqlite = await database.database;
      await _insertConsultantBadge(sqlite, ownerUserId: 22, badgeId: 42);
      await _insertConsultantBadge(sqlite, ownerUserId: 99, badgeId: 43);

      final catalog22 = await database.getCatalogBadges(ownerUserId: 22);
      final catalog99 = await database.getCatalogBadges(ownerUserId: 99);
      expect(
        catalog22
            .where((badge) => badge.hasApplication)
            .map((badge) => badge.id),
        [42],
      );
      expect(
        catalog99
            .where((badge) => badge.hasApplication)
            .map((badge) => badge.id),
        [43],
      );

      final applications22 = await database.getMyBadgeApplications(
        ownerUserId: 22,
      );
      final applications99 = await database.getMyBadgeApplications(
        ownerUserId: 99,
      );
      expect(applications22.map((item) => item.id), [2201]);
      expect(applications22.single.evidences.map((item) => item.id), [221]);
      expect(applications22.single.history.map((item) => item.id), [222]);
      expect(applications99.map((item) => item.id), [9901]);
      expect(applications99.single.evidences.map((item) => item.id), [991]);
      expect(applications99.single.history.map((item) => item.id), [992]);
    },
  );

  test(
    'novo snapshot remove apenas cache do owner e preserva todas as outboxes',
    () async {
      await database.upsertApiSnapshot(
        _snapshot(
          ownerUserId: 22,
          candidaturaId: 2201,
          badgeId: 42,
          badgeName: 'Badge do utilizador 22',
          evidenceId: 221,
          historyId: 222,
        ),
        ownerUserId: 22,
      );
      await database.upsertApiSnapshot(
        _snapshot(
          ownerUserId: 99,
          candidaturaId: 9901,
          badgeId: 43,
          badgeName: 'Badge do utilizador 99',
          evidenceId: 991,
          historyId: 992,
        ),
        ownerUserId: 99,
      );
      await database.enqueuePendingBadgeApplication(
        clientRequestId: 'outbox-22',
        ownerUserId: 22,
        badgeId: 52,
        evidenceFiles: const [],
      );
      await database.enqueuePendingBadgeApplication(
        clientRequestId: 'outbox-99',
        ownerUserId: 99,
        badgeId: 59,
        evidenceFiles: const [],
      );

      await database.upsertApiSnapshot(const <String, Object?>{
        'candidaturas': <Object?>[],
      }, ownerUserId: 22);

      final sqlite = await database.database;
      expect(
        await sqlite.query(
          'candidaturas',
          columns: ['id'],
          where: 'consultor_id = ?',
          whereArgs: [22],
        ),
        isEmpty,
      );
      expect(
        await sqlite.query(
          'evidencias',
          columns: ['id'],
          where: 'candidatura_id = ?',
          whereArgs: [2201],
        ),
        isEmpty,
      );
      expect(
        await sqlite.query(
          'historico_candidaturas',
          columns: ['id'],
          where: 'candidatura_id = ?',
          whereArgs: [2201],
        ),
        isEmpty,
      );

      final owner99 = await database.getMyBadgeApplications(ownerUserId: 99);
      expect(owner99.map((item) => item.id), [9901]);
      expect(owner99.single.evidences.map((item) => item.id), [991]);
      expect(owner99.single.history.map((item) => item.id), [992]);
      expect(await database.getPendingBadgeApplications(22), hasLength(1));
      expect(await database.getPendingBadgeApplications(99), hasLength(1));
    },
  );
}

Map<String, Object?> _snapshot({
  required int ownerUserId,
  required int candidaturaId,
  required int badgeId,
  required String badgeName,
  required int evidenceId,
  required int historyId,
}) {
  return {
    'badges': [
      {
        'id': badgeId,
        'nome': badgeName,
        'descricao': 'Descricao',
        'pontos': 100,
        'ativo': true,
      },
    ],
    'candidaturas': [
      {
        'id': candidaturaId,
        'consultorId': ownerUserId,
        'badgeId': badgeId,
        'status': const {'code': 'SUBMITTED', 'name': 'Submetida'},
        'createdAt': '2026-07-16T10:00:00.000Z',
        'updatedAt': '2026-07-16T10:05:00.000Z',
        'evidencias': [
          {
            'id': evidenceId,
            'candidaturaId': candidaturaId,
            'requisitoId': 7,
            'nomeFicheiro': 'evidencia-$ownerUserId.pdf',
            'url': 'https://example.test/$evidenceId.pdf',
            'tipo': 'PDF',
          },
        ],
        'history': [
          {
            'id': historyId,
            'candidaturaId': candidaturaId,
            'estadoAnterior': 'OPEN',
            'estadoNovo': 'SUBMITTED',
            'motivo': 'Submetida',
            'createdAt': '2026-07-16T10:05:00.000Z',
          },
        ],
      },
    ],
  };
}

Future<void> _insertConsultantBadge(
  Database database, {
  required int ownerUserId,
  required int badgeId,
}) async {
  await database.insert('consultant_badges', {
    'consultor_id': ownerUserId,
    'badge_id': badgeId,
    'obtained_date': '2026-07-16T10:10:00.000Z',
    'valid': 1,
    'points_obtained': 100,
    'raw_json': '{}',
    'last_synced_at': '2026-07-16T10:10:00.000Z',
  });
}
