import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:path/path.dart' as path;
import 'package:sqflite/sqflite.dart';

import '../models/consultant_profile.dart';
import '../models/dashboard_data.dart';
import '../models/mobile_api_data.dart';
import '../models/pending_badge_application.dart';

class LocalBadgesDatabase {
  LocalBadgesDatabase._({
    DatabaseFactory? databaseFactoryOverride,
    String? databasePathOverride,
  }) : _databaseFactoryOverride = databaseFactoryOverride,
       _databasePathOverride = databasePathOverride;

  @visibleForTesting
  LocalBadgesDatabase.forTesting({
    required DatabaseFactory databaseFactory,
    required String databasePath,
  }) : this._(
         databaseFactoryOverride: databaseFactory,
         databasePathOverride: databasePath,
       );

  static final LocalBadgesDatabase instance = LocalBadgesDatabase._();

  final DatabaseFactory? _databaseFactoryOverride;
  final String? _databasePathOverride;
  Database? _database;
  DashboardData? _memoryDashboard;
  int? _memoryCurrentUserId;
  LocalUserProfile? _memoryCurrentUserProfile;
  final Map<String, PendingBadgeApplication> _memoryPendingApplications = {};
  final Map<String, Future<void>> _pendingEnqueueTails = {};
  int _nextMemoryPendingApplicationId = 1;

  static const int _databaseVersion = 7;

  Future<Database> get database async {
    final currentDatabase = _database;
    if (currentDatabase != null) {
      return currentDatabase;
    }

    final factory = _databaseFactory();
    final databasePath = await _databasePath(factory);

    final openedDatabase = await factory.openDatabase(
      databasePath,
      options: OpenDatabaseOptions(
        version: _databaseVersion,
        onCreate: _createDatabase,
        onUpgrade: _upgradeDatabase,
      ),
    );

    _database = openedDatabase;
    return openedDatabase;
  }

  DatabaseFactory _databaseFactory() {
    final override = _databaseFactoryOverride;
    if (override != null) return override;
    if (kIsWeb) {
      throw UnsupportedError('A base de dados local nao suporta Web.');
    }

    if (Platform.isAndroid || Platform.isIOS) {
      return databaseFactory;
    }

    throw UnsupportedError('A base de dados SQLite e usada apenas em mobile.');
  }

  Future<String> _databasePath(DatabaseFactory factory) async {
    final override = _databasePathOverride;
    if (override != null) return override;
    final databasesPath = await factory.getDatabasesPath();
    return path.join(databasesPath, 'softinsa_badges.db');
  }

  @visibleForTesting
  Future<void> closeForTesting() async {
    await _database?.close();
    _database = null;
  }

  Future<void> _createDatabase(Database db, int version) async {
    await _createDashboardTables(db);
    await _createApiTables(db);
  }

  Future<void> _upgradeDatabase(
    Database db,
    int oldVersion,
    int newVersion,
  ) async {
    if (oldVersion < 2) {
      await _createApiTables(db);
    }
    if (oldVersion < 3) {
      await _addDashboardUserRoleColumn(db);
    }
    if (oldVersion < 4) {
      await _createMobileFeatureTables(db);
    }
    if (oldVersion < 5) {
      await _createConsultantDetailTables(db);
    }
    if (oldVersion < 6) {
      await _addEvidenciaRequirementColumn(db);
    }
    if (oldVersion < 7) {
      await _createPendingApplicationTables(db);
    }
  }

  Future<void> _addEvidenciaRequirementColumn(Database db) async {
    await _addColumnIfMissing(db, 'evidencias', 'requisito_id', 'INTEGER');
  }

  Future<void> _addColumnIfMissing(
    Database db,
    String table,
    String column,
    String definition,
  ) async {
    final columns = await db.rawQuery('PRAGMA table_info($table)');
    final exists = columns.any((row) => row['name'] == column);
    if (!exists) {
      await db.execute('ALTER TABLE $table ADD COLUMN $column $definition');
    }
  }

  Future<void> _createDashboardTables(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS dashboard (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL DEFAULT '',
        greeting TEXT NOT NULL,
        total_points INTEGER NOT NULL,
        learning_path_title TEXT NOT NULL,
        learning_path_progress REAL NOT NULL,
        notice_title TEXT NOT NULL,
        notice_message TEXT NOT NULL,
        special_achievement_title TEXT NOT NULL,
        special_achievement_message TEXT NOT NULL,
        badges_won INTEGER NOT NULL,
        in_progress INTEGER NOT NULL,
        ranking INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS badge_recommendations (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        level TEXT NOT NULL,
        tag TEXT NOT NULL,
        points INTEGER NOT NULL,
        duration TEXT NOT NULL,
        prerequisites_json TEXT NOT NULL,
        icon_name TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');
  }

  Future<void> _createApiTables(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS sync_metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS api_payloads (
        key TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS api_users (
        id INTEGER PRIMARY KEY,
        nome TEXT,
        email TEXT,
        role TEXT,
        must_change_password INTEGER,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS learning_paths (
        id INTEGER PRIMARY KEY,
        nome TEXT,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS service_lines (
        id INTEGER PRIMARY KEY,
        learning_path_id INTEGER,
        nome TEXT,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS areas (
        id INTEGER PRIMARY KEY,
        service_line_id INTEGER,
        nome TEXT,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS levels (
        id INTEGER PRIMARY KEY,
        area_id INTEGER,
        nome TEXT,
        ordem TEXT,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS badges (
        id INTEGER PRIMARY KEY,
        level_id INTEGER,
        nome TEXT,
        descricao TEXT,
        imagem TEXT,
        pontos INTEGER,
        uuid TEXT,
        tem_expiracao INTEGER,
        duracao_meses INTEGER,
        ativo INTEGER,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS requirements (
        id INTEGER PRIMARY KEY,
        level_id INTEGER,
        nome TEXT,
        descricao TEXT,
        tipo TEXT,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS candidaturas (
        id INTEGER PRIMARY KEY,
        consultor_id INTEGER,
        badge_id INTEGER,
        estado TEXT,
        talent_manager_id INTEGER,
        data_validacao_talent TEXT,
        service_line_leader_id INTEGER,
        data_validacao_service_line TEXT,
        comentario TEXT,
        data_expiracao TEXT,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS evidencias (
        id INTEGER PRIMARY KEY,
        candidatura_id INTEGER,
        requisito_id INTEGER,
        url TEXT,
        nome_ficheiro TEXT,
        tipo TEXT,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS historico_candidaturas (
        id INTEGER PRIMARY KEY,
        candidatura_id INTEGER,
        user_id INTEGER,
        estado_anterior TEXT,
        estado_novo TEXT,
        comentario TEXT,
        acao TEXT,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_candidaturas_consultor '
      'ON candidaturas (consultor_id)',
    );
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_candidaturas_badge '
      'ON candidaturas (badge_id)',
    );
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_evidencias_candidatura '
      'ON evidencias (candidatura_id)',
    );
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_historico_candidatura '
      'ON historico_candidaturas (candidatura_id)',
    );

    await _createConsultantDetailTables(db);
    await _createMobileFeatureTables(db);
    await _createPendingApplicationTables(db);
  }

  Future<void> _createPendingApplicationTables(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS pending_badge_applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_request_id TEXT NOT NULL UNIQUE,
        owner_user_id INTEGER NOT NULL,
        badge_id INTEGER NOT NULL,
        description TEXT,
        state TEXT NOT NULL DEFAULT 'queued',
        attempt_count INTEGER NOT NULL DEFAULT 0,
        last_error TEXT,
        last_http_status INTEGER,
        server_application_id INTEGER,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(owner_user_id, badge_id)
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS pending_badge_evidences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        pending_application_id INTEGER NOT NULL,
        requirement_id INTEGER NOT NULL,
        stored_path TEXT NOT NULL,
        original_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (pending_application_id)
          REFERENCES pending_badge_applications(id) ON DELETE CASCADE
      )
    ''');

    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_pending_badge_owner_state '
      'ON pending_badge_applications (owner_user_id, state, created_at)',
    );
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_pending_badge_evidence_application '
      'ON pending_badge_evidences (pending_application_id)',
    );
  }

  Future<void> _createConsultantDetailTables(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS consultant_badges (
        consultor_id INTEGER NOT NULL,
        badge_id INTEGER NOT NULL,
        obtained_date TEXT,
        expiration_date TEXT,
        duration_months INTEGER,
        valid INTEGER NOT NULL,
        points_obtained INTEGER,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL,
        PRIMARY KEY (consultor_id, badge_id)
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS badge_premium (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        criteria_description TEXT NOT NULL,
        active INTEGER NOT NULL,
        created_at TEXT,
        updated_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS consultant_premium_badges (
        badge_premium_id INTEGER NOT NULL,
        consultor_id INTEGER NOT NULL,
        achievement_date TEXT,
        created_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL,
        PRIMARY KEY (badge_premium_id, consultor_id)
      )
    ''');

    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_consultant_badges_consultor '
      'ON consultant_badges (consultor_id)',
    );
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_consultant_premium_badges_consultor '
      'ON consultant_premium_badges (consultor_id)',
    );
  }

  Future<void> _createMobileFeatureTables(Database db) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS consultants (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        area TEXT NOT NULL,
        service_line TEXT NOT NULL,
        location TEXT NOT NULL,
        email TEXT NOT NULL,
        start_date TEXT NOT NULL,
        points INTEGER NOT NULL,
        badges INTEGER NOT NULL,
        specials INTEGER NOT NULL,
        rank INTEGER NOT NULL,
        image_path TEXT NOT NULL,
        biography TEXT NOT NULL,
        linkedin_url TEXT NOT NULL,
        is_current_user INTEGER NOT NULL,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS consultant_directory_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        consultants INTEGER NOT NULL,
        badges_total INTEGER NOT NULL,
        specials_total INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        read INTEGER NOT NULL,
        created_at TEXT,
        read_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS gamification_summary (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        rank INTEGER NOT NULL,
        points INTEGER NOT NULL,
        badges INTEGER NOT NULL,
        raw_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS gamification_achievements (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        awarded_at TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS gamification_ranking (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        points INTEGER NOT NULL,
        badges INTEGER NOT NULL,
        rank INTEGER NOT NULL,
        current_user INTEGER NOT NULL,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS gamification_timeline (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        event_date TEXT,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS email_signature_profile (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        website TEXT NOT NULL,
        template_html TEXT NOT NULL,
        raw_json TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS email_signature_badges (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        image_path TEXT NOT NULL,
        public_token TEXT NOT NULL,
        selected INTEGER NOT NULL,
        raw_json TEXT NOT NULL,
        last_synced_at TEXT NOT NULL
      )
    ''');

    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_consultants_rank ON consultants (rank)',
    );
    await db.execute(
      'CREATE INDEX IF NOT EXISTS idx_notifications_created '
      'ON notifications (created_at)',
    );
  }

  Future<void> _addDashboardUserRoleColumn(Database db) async {
    final columns = await db.rawQuery('PRAGMA table_info(dashboard)');
    final hasUserRole = columns.any((column) => column['name'] == 'user_role');
    if (!hasUserRole) {
      await db.execute(
        "ALTER TABLE dashboard ADD COLUMN user_role TEXT NOT NULL DEFAULT ''",
      );
    }
  }

  Future<void> ensureSeedData() async {
    final dashboard = await getDashboard();
    if (dashboard != null) {
      return;
    }

    await upsertDashboard(DashboardData.sample());
  }

  Future<bool> upsertDashboard(
    DashboardData data, {
    DateTime? updatedAt,
    int? ownerUserId,
  }) async {
    if (_useMemoryStore) {
      if (ownerUserId != null && _memoryCurrentUserId != ownerUserId) {
        return false;
      }
      _memoryDashboard = _mergeMemoryDashboard(data);
      return true;
    }

    final db = await database;
    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();

    return db.transaction((transaction) async {
      if (ownerUserId != null) {
        final currentRows = await transaction.query(
          'sync_metadata',
          columns: ['value'],
          where: 'key = ?',
          whereArgs: ['current_user_id'],
          limit: 1,
        );
        final currentUserId = currentRows.isEmpty
            ? null
            : int.tryParse(currentRows.first['value'].toString());
        if (currentUserId != ownerUserId) return false;
      }

      await transaction.insert('dashboard', {
        'id': 1,
        'user_name': data.userName,
        'user_role': data.userRole,
        'greeting': data.greeting,
        'total_points': data.totalPoints,
        'learning_path_title': data.learningPathTitle,
        'learning_path_progress': data.learningPathProgress,
        'notice_title': data.noticeTitle,
        'notice_message': data.noticeMessage,
        'special_achievement_title': data.specialAchievementTitle,
        'special_achievement_message': data.specialAchievementMessage,
        'badges_won': data.badgesWon,
        'in_progress': data.inProgress,
        'ranking': data.ranking,
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);

      await transaction.delete('badge_recommendations');

      for (final recommendation in data.recommendations) {
        await transaction.insert('badge_recommendations', {
          'id': _recommendationId(recommendation),
          'title': recommendation.title,
          'description': recommendation.description,
          'level': recommendation.level,
          'tag': recommendation.tag,
          'points': recommendation.points,
          'duration': recommendation.duration,
          'prerequisites_json': jsonEncode(recommendation.prerequisites),
          'icon_name': recommendation.iconName,
          'updated_at': timestamp,
        }, conflictAlgorithm: ConflictAlgorithm.replace);
      }
      return true;
    });
  }

  Future<void> upsertApiSnapshot(
    Object? payload, {
    DateTime? updatedAt,
    int? ownerUserId,
  }) async {
    if (payload == null || _useMemoryStore) {
      return;
    }

    final db = await database;
    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();
    const candidaturaKeys = <String>[
      'candidaturas',
      'candidatura',
      'Candidatura',
    ];
    final hasCandidaturaSnapshot = _payloadHasCollection(
      payload,
      candidaturaKeys,
    );
    final candidaturaRows = _collectMaps(payload, candidaturaKeys.toSet())
        .where((row) {
          if (ownerUserId == null) return true;
          final rowOwner = _intValue(row, const ['consultorId', 'CONSULTORID']);
          return rowOwner == null || rowOwner == ownerUserId;
        })
        .map((row) {
          if (ownerUserId == null) return row;
          return <String, dynamic>{...row, 'consultorId': ownerUserId};
        })
        .toList();
    final scopedCandidaturaIds = candidaturaRows
        .map(
          (row) =>
              _intValue(row, const ['id', 'candidaturaId', 'CANDIDATURAID']),
        )
        .whereType<int>()
        .toSet();
    final evidenceRows =
        _collectMaps(payload, const {
          'evidencias',
          'evidencia',
          'Evidencia',
        }).where((row) {
          if (ownerUserId == null || !hasCandidaturaSnapshot) return true;
          final candidaturaId = _intValue(row, const [
            'candidaturaId',
            'CANDIDATURAID',
          ]);
          return candidaturaId != null &&
              scopedCandidaturaIds.contains(candidaturaId);
        }).toList();
    final historyRows =
        _collectMaps(payload, const {
          'historico',
          'historicos',
          'history',
          'HistoricoCandidatura',
          'HistoricoCandidaturas',
        }).where((row) {
          if (ownerUserId == null || !hasCandidaturaSnapshot) return true;
          final candidaturaId = _intValue(row, const [
            'candidaturaId',
            'CANDIDATURAID',
          ]);
          return candidaturaId != null &&
              scopedCandidaturaIds.contains(candidaturaId);
        }).toList();

    await db.transaction((transaction) async {
      await transaction.insert('api_payloads', {
        'key': 'dashboard_sync',
        'payload_json': jsonEncode(payload),
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);

      await transaction.insert('sync_metadata', {
        'key': 'last_api_snapshot_at',
        'value': timestamp,
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);

      await _upsertMaps(
        transaction,
        table: 'api_users',
        maps: _collectMaps(payload, const {'users', 'user', 'consultor'}),
        idKeys: const ['id', 'USERID', 'consultorId', 'CONSULTORID'],
        values: (row) => {
          'nome': _textValue(row, const ['nome', 'NOME', 'name']),
          'email': _textValue(row, const ['email', 'EMAIL']),
          'role': _textValue(row, const ['role']),
          'must_change_password': _boolIntValue(row, const [
            'mustChangePassword',
          ]),
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        },
        syncedAt: timestamp,
      );

      await _upsertMaps(
        transaction,
        table: 'learning_paths',
        maps: _collectMaps(payload, const {
          'learningPaths',
          'learningPath',
          'LearningPath',
        }),
        idKeys: const ['id', 'learningPathId', 'LEARNINGPATHID'],
        values: (row) => {
          'nome': _textValue(row, const ['nome', 'NOME']),
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        },
        syncedAt: timestamp,
      );

      await _upsertMaps(
        transaction,
        table: 'service_lines',
        maps: _collectMaps(payload, const {
          'serviceLines',
          'serviceLine',
          'ServiceLine',
        }),
        idKeys: const ['id', 'serviceLineId', 'SERVICELINEID'],
        values: (row) => {
          'learning_path_id': _intValue(row, const [
            'learningPathId',
            'LEARNINGPATHID',
          ]),
          'nome': _textValue(row, const ['nome', 'NOME']),
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        },
        syncedAt: timestamp,
      );

      await _upsertMaps(
        transaction,
        table: 'areas',
        maps: _collectMaps(payload, const {'areas', 'area', 'Area'}),
        idKeys: const ['id', 'areaId', 'AREAID'],
        values: (row) => {
          'service_line_id': _intValue(row, const [
            'serviceLineId',
            'SERVICELINEID',
          ]),
          'nome': _textValue(row, const ['nome', 'NOME']),
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        },
        syncedAt: timestamp,
      );

      await _upsertMaps(
        transaction,
        table: 'levels',
        maps: _collectMaps(payload, const {'levels', 'level', 'Level'}),
        idKeys: const ['id', 'levelId', 'NIVELID'],
        values: (row) => {
          'area_id': _intValue(row, const ['areaId', 'AREAID']),
          'nome': _textValue(row, const ['nome', 'NOME']),
          'ordem': _textValue(row, const ['ordem', 'ORDEM', 'CODIGO']),
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        },
        syncedAt: timestamp,
      );

      await _upsertMaps(
        transaction,
        table: 'badges',
        maps: _collectMaps(payload, const {
          'badges',
          'badge',
          'Badge',
          'recommendations',
        }),
        idKeys: const ['id', 'badgeId', 'BADGEID'],
        values: (row) => {
          'level_id': _intValue(row, const ['levelId', 'nivelId', 'NIVELID']),
          'nome': _textValue(row, const ['nome', 'NOME', 'title']),
          'descricao': _textValue(row, const ['descricao', 'DESCRICAO']),
          'imagem': _textValue(row, const ['imagem', 'IMAGEM', 'iconName']),
          'pontos': _intValue(row, const [
            'pontos',
            'ponto',
            'PONTO',
            'points',
          ]),
          'uuid': _textValue(row, const [
            'uuid',
            'publicToken',
            'PUBLIC_TOKEN',
            'slug',
            'SLUG',
          ]),
          'tem_expiracao': _boolIntValue(row, const ['temExpiracao', 'ATIVO']),
          'duracao_meses': _intValue(row, const [
            'duracaoMeses',
            'DURACAO_MESES',
          ]),
          'ativo': _boolIntValue(row, const ['ativo', 'ATIVO']),
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        },
        syncedAt: timestamp,
      );

      final badgePremiumRows = _mapsFromPayload(payload, const [
        'badgePremium',
        'badge-premium',
        'badge_premium',
      ]);
      if (_payloadHasCollection(payload, const [
        'badgePremium',
        'badge-premium',
        'badge_premium',
      ])) {
        await transaction.delete('badge_premium');
        await _upsertMaps(
          transaction,
          table: 'badge_premium',
          maps: badgePremiumRows,
          idKeys: const ['id', 'badgePremiumId', 'BADGEPREMIUMID'],
          values: (row) => {
            'name': _textValue(row, const ['name', 'nome']) ?? '',
            'description':
                _textValue(row, const ['description', 'descricao']) ?? '',
            'icon': _textValue(row, const ['icon', 'icone']) ?? 'star',
            'criteria_description':
                _textValue(row, const ['criteriaDescription']) ?? '',
            'active': _boolIntValue(row, const ['active', 'ativo']) ?? 1,
            'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
            'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
          },
          syncedAt: timestamp,
        );
      }

      final consultantBadgeRows = _mapsFromPayload(payload, const [
        'consultorBadges',
        'consultor-badges',
        'consultor_badges',
      ]);
      if (_payloadHasCollection(payload, const [
        'consultorBadges',
        'consultor-badges',
        'consultor_badges',
      ])) {
        await transaction.delete('consultant_badges');
        await _upsertConsultantBadges(
          transaction,
          consultantBadgeRows,
          timestamp,
        );
      }

      final consultantPremiumRows = _mapsFromPayload(payload, const [
        'consultorBadgePremium',
        'consultor-badge-premium',
        'consultor_badge_premium',
      ]);
      if (_payloadHasCollection(payload, const [
        'consultorBadgePremium',
        'consultor-badge-premium',
        'consultor_badge_premium',
      ])) {
        await transaction.delete('consultant_premium_badges');
        await _upsertConsultantPremiumBadges(
          transaction,
          consultantPremiumRows,
          timestamp,
        );
      }

      await _upsertMaps(
        transaction,
        table: 'requirements',
        maps: _collectMaps(payload, const {
          'requirements',
          'requirement',
          'Requirement',
          'requisitos',
        }),
        idKeys: const ['id', 'requirementId', 'REQUISITOID'],
        values: (row) => {
          'level_id': _intValue(row, const ['levelId', 'nivelId', 'NIVELID']),
          'nome': _textValue(row, const ['nome', 'titulo', 'NOME', 'TITULO']),
          'descricao': _textValue(row, const ['descricao', 'DESCRICAO']),
          'tipo': _textValue(row, const ['tipo', 'icone', 'TIPO']),
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        },
        syncedAt: timestamp,
      );

      if (ownerUserId != null && hasCandidaturaSnapshot) {
        // A resposta de /candidaturas/minhas e um snapshot completo do owner.
        // Remove apenas a cache normal desse utilizador e respetivos filhos;
        // as outboxes usam tabelas separadas e nunca sao tocadas aqui.
        await transaction.rawDelete(
          '''
          DELETE FROM evidencias
          WHERE candidatura_id IN (
            SELECT id FROM candidaturas WHERE consultor_id = ?
          )
          ''',
          [ownerUserId],
        );
        await transaction.rawDelete(
          '''
          DELETE FROM historico_candidaturas
          WHERE candidatura_id IN (
            SELECT id FROM candidaturas WHERE consultor_id = ?
          )
          ''',
          [ownerUserId],
        );
        await transaction.delete(
          'candidaturas',
          where: 'consultor_id = ?',
          whereArgs: [ownerUserId],
        );
      }

      await _upsertMaps(
        transaction,
        table: 'candidaturas',
        maps: candidaturaRows,
        idKeys: const ['id', 'candidaturaId', 'CANDIDATURAID'],
        values: (row) => {
          'consultor_id': _intValue(row, const ['consultorId', 'CONSULTORID']),
          'badge_id': _intValue(row, const ['badgeId', 'BADGEID']),
          'estado':
              _statusCodeFromRow(row) ??
              _textValue(row, const ['estado', 'estadoId', 'ESTADOID']),
          'talent_manager_id': _intValue(row, const [
            'talentManagerId',
            'TMID',
          ]),
          'data_validacao_talent': _textValue(row, const [
            'dataValidacaoTalent',
            'DATA_VALIDACAO',
          ]),
          'service_line_leader_id': _intValue(row, const [
            'serviceLineLeaderId',
            'SSL_ID',
          ]),
          'data_validacao_service_line': _textValue(row, const [
            'dataValidacaoServiceLine',
            'DATA_APROVACAO',
          ]),
          'comentario': _textValue(row, const ['comentario']),
          'data_expiracao': _textValue(row, const ['dataExpiracao']),
          'created_at': _textValue(row, const [
            'createdAt',
            'dataSubmicao',
            'CREATED_AT',
          ]),
          'updated_at': _textValue(row, const [
            'updatedAt',
            'dataAprovacao',
            'dataValidacao',
            'CREATED_AT',
            'UPDATED_AT',
          ]),
        },
        syncedAt: timestamp,
      );

      await _upsertMaps(
        transaction,
        table: 'evidencias',
        maps: evidenceRows,
        idKeys: const ['id', 'evidenciaId', 'EVIDENCIAID'],
        values: (row) => {
          'candidatura_id': _intValue(row, const [
            'candidaturaId',
            'CANDIDATURAID',
          ]),
          'requisito_id': _intValue(row, const ['requisitoId', 'REQUISITOID']),
          'url': _textValue(row, const ['url', 'FILEPATH']),
          'nome_ficheiro': _textValue(row, const ['nomeFicheiro', 'FILEPATH']),
          'tipo': _textValue(row, const ['tipo', 'TIPO_ARQUIVO']),
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        },
        syncedAt: timestamp,
      );

      await _upsertMaps(
        transaction,
        table: 'historico_candidaturas',
        maps: historyRows,
        idKeys: const ['id', 'historicoId', 'LOGWF_ID'],
        values: (row) => {
          'candidatura_id': _intValue(row, const [
            'candidaturaId',
            'CANDIDATURAID',
          ]),
          'user_id': _intValue(row, const ['userId', 'USERID']),
          'estado_anterior':
              _textValue(_mapValue(row, const ['oldStatus']), const [
                'name',
                'code',
              ]) ??
              _textValue(row, const ['estadoAnterior', 'ANTIGO_ESTADOID']),
          'estado_novo':
              _textValue(_mapValue(row, const ['newStatus']), const [
                'name',
                'code',
              ]) ??
              _textValue(row, const ['estadoNovo', 'NOVO_ESTADOID']),
          'comentario': _textValue(row, const [
            'comentario',
            'motivo',
            'MOTIVO',
          ]),
          'acao': _textValue(row, const ['acao']),
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        },
        syncedAt: timestamp,
      );
    });
  }

  Future<bool> upsertCurrentUser(
    Map<String, dynamic> user, {
    DateTime? updatedAt,
  }) async {
    final id = _intValue(user, const ['id', 'USERID']);
    if (id == null) return false;

    final role =
        _textValue(user, const ['role']) ??
        _firstListTextValue(user, const ['roles']);
    if (_useMemoryStore) {
      final changed = _memoryCurrentUserId != id;
      if (changed) _memoryDashboard = null;
      _memoryCurrentUserId = id;
      _memoryCurrentUserProfile = LocalUserProfile(
        id: id,
        name: _textValue(user, const ['nome', 'NOME', 'name']) ?? '',
        email: _textValue(user, const ['email', 'EMAIL']) ?? '',
        role: role ?? '',
        mustChangePassword:
            _boolIntValue(user, const ['mustChangePassword']) == 1,
      );
      return changed;
    }

    final db = await database;
    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();

    return db.transaction((transaction) async {
      final currentRows = await transaction.query(
        'sync_metadata',
        columns: ['value'],
        where: 'key = ?',
        whereArgs: ['current_user_id'],
        limit: 1,
      );
      final currentUserId = currentRows.isEmpty
          ? null
          : int.tryParse(currentRows.first['value'].toString());
      final changed = currentUserId != id;

      if (changed) {
        for (final table in const [
          'dashboard',
          'badge_recommendations',
          'notifications',
          'gamification_summary',
          'gamification_achievements',
          'gamification_ranking',
          'gamification_timeline',
          'email_signature_profile',
          'email_signature_badges',
        ]) {
          await transaction.delete(table);
        }
        await transaction.update('consultants', {'is_current_user': 0});
        await transaction.delete(
          'api_payloads',
          where: 'key IN (?, ?, ?, ?, ?)',
          whereArgs: const [
            'dashboard_sync',
            'current_user',
            'notifications',
            'gamification',
            'email_signature',
          ],
        );
        await transaction.delete(
          'sync_metadata',
          where: 'key = ?',
          whereArgs: ['last_api_snapshot_at'],
        );
      }

      await transaction.insert('api_users', {
        'id': id,
        'nome': _textValue(user, const ['nome', 'NOME', 'name']),
        'email': _textValue(user, const ['email', 'EMAIL']),
        'role': role,
        'must_change_password': _boolIntValue(user, const [
          'mustChangePassword',
        ]),
        'created_at': _textValue(user, const ['createdAt', 'CREATED_AT']),
        'updated_at': _textValue(user, const ['updatedAt', 'UPDATED_AT']),
        'raw_json': jsonEncode(user),
        'last_synced_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);

      await transaction.insert('sync_metadata', {
        'key': 'current_user_id',
        'value': id.toString(),
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);

      await transaction.insert('api_payloads', {
        'key': 'current_user',
        'payload_json': jsonEncode(user),
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
      return changed;
    });
  }

  Future<void> upsertConsultantsDirectory(
    Map<String, dynamic> payload, {
    DateTime? updatedAt,
  }) async {
    if (_useMemoryStore) {
      return;
    }

    final rows = _mapsFromPayload(payload, const [
      'data',
      'consultants',
      'items',
    ]);
    final stats = _mapFromPayload(payload, const ['stats']) ?? const {};
    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();
    final db = await database;

    await db.transaction((transaction) async {
      await transaction.delete('consultants');

      for (final row in rows) {
        final profile = ConsultantProfile.fromJson(row);
        final id = profile.id ?? _intValue(row, const ['id', 'consultorId']);
        if (id == null) {
          continue;
        }

        await transaction.insert('consultants', {
          'id': id,
          'name': profile.name,
          'role': profile.role,
          'area': profile.area,
          'service_line': profile.serviceLine,
          'location': profile.location,
          'email': profile.email,
          'start_date': profile.startDate,
          'points': profile.points,
          'badges': profile.badges,
          'specials': profile.specials,
          'rank': profile.rank,
          'image_path': profile.imagePath,
          'biography': profile.biography,
          'linkedin_url': profile.linkedinUrl,
          'is_current_user': profile.isCurrentUser ? 1 : 0,
          'raw_json': jsonEncode(row),
          'last_synced_at': timestamp,
        }, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      await transaction.insert('consultant_directory_stats', {
        'id': 1,
        'consultants': _intValue(stats, const ['consultants']) ?? rows.length,
        'badges_total':
            _intValue(stats, const ['badgesTotal']) ??
            rows.fold<int>(
              0,
              (total, row) => total + (_intValue(row, const ['badges']) ?? 0),
            ),
        'specials_total':
            _intValue(stats, const ['specialsTotal']) ??
            rows.fold<int>(
              0,
              (total, row) => total + (_intValue(row, const ['specials']) ?? 0),
            ),
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);

      await transaction.insert('api_payloads', {
        'key': 'consultants_directory',
        'payload_json': jsonEncode(payload),
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    });
  }

  Future<ConsultantsDirectoryData> getConsultantsDirectory() async {
    if (_useMemoryStore) {
      final consultants = _sampleConsultants();
      return ConsultantsDirectoryData(
        consultants: consultants,
        stats: ConsultantsDirectoryStats(
          consultants: consultants.length,
          badgesTotal: consultants.fold(0, (sum, item) => sum + item.badges),
          specialsTotal: consultants.fold(
            0,
            (sum, item) => sum + item.specials,
          ),
        ),
        loadedFromCache: true,
      );
    }

    final db = await database;
    final rows = await db.query('consultants', orderBy: 'rank ASC, name ASC');
    final statsRows = await db.query(
      'consultant_directory_stats',
      where: 'id = ?',
      whereArgs: [1],
      limit: 1,
    );

    final consultants = rows.map(_consultantFromRow).toList();
    final stats = statsRows.isEmpty
        ? ConsultantsDirectoryStats(
            consultants: consultants.length,
            badgesTotal: consultants.fold(0, (sum, item) => sum + item.badges),
            specialsTotal: consultants.fold(
              0,
              (sum, item) => sum + item.specials,
            ),
          )
        : ConsultantsDirectoryStats(
            consultants: statsRows.first['consultants'] as int,
            badgesTotal: statsRows.first['badges_total'] as int,
            specialsTotal: statsRows.first['specials_total'] as int,
          );

    return ConsultantsDirectoryData(consultants: consultants, stats: stats);
  }

  Future<ConsultantProfile?> getCurrentConsultantProfile() async {
    if (_useMemoryStore) {
      return _sampleConsultants().first;
    }

    final db = await database;
    final rows = await db.query(
      'consultants',
      where: 'is_current_user = ?',
      whereArgs: [1],
      limit: 1,
    );

    if (rows.isEmpty) {
      return null;
    }

    return _consultantFromRow(rows.first);
  }

  Future<void> upsertNotifications(
    Map<String, dynamic> payload, {
    DateTime? updatedAt,
  }) async {
    if (_useMemoryStore) {
      return;
    }

    final rows = _mapsFromPayload(payload, const ['data', 'notifications']);
    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();
    final db = await database;

    await db.transaction((transaction) async {
      await transaction.delete('notifications');

      for (final row in rows) {
        final notification = AppNotification.fromJson(row);
        if (notification.id.isEmpty) {
          continue;
        }

        await transaction.insert('notifications', {
          'id': notification.id,
          'title': notification.title,
          'message': notification.message,
          'type': notification.type,
          'read': notification.read ? 1 : 0,
          'created_at': notification.createdAt?.toUtc().toIso8601String(),
          'read_at': notification.readAt?.toUtc().toIso8601String(),
          'raw_json': jsonEncode(row),
          'last_synced_at': timestamp,
        }, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      await transaction.insert('api_payloads', {
        'key': 'notifications',
        'payload_json': jsonEncode(payload),
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    });
  }

  Future<List<AppNotification>> getNotifications() async {
    if (_useMemoryStore) {
      return [
        AppNotification(
          id: '1',
          title: 'O seu badge Nível Júnior - OutSystems foi aprovado!',
          message: '',
          type: 'success',
          read: false,
          createdAt: DateTime(2025, 12, 4),
        ),
        AppNotification(
          id: '2',
          title: 'O badge AWS Cloud Practitioner expira em 30 dias',
          message: '',
          type: 'warning',
          read: false,
          createdAt: DateTime(2025, 12, 3),
        ),
        AppNotification(
          id: '3',
          title: 'Feedback necessário para o badge Azure Fundamentals',
          message: '',
          type: 'alert',
          read: true,
          createdAt: DateTime(2025, 12, 2),
        ),
      ];
    }

    final db = await database;
    final rows = await db.query(
      'notifications',
      orderBy: 'created_at DESC, last_synced_at DESC',
    );
    return rows.map(_notificationFromRow).toList();
  }

  Future<void> markNotificationReadLocally(String id) async {
    if (_useMemoryStore) {
      return;
    }

    final db = await database;
    final now = DateTime.now().toUtc().toIso8601String();
    await db.update(
      'notifications',
      {'read': 1, 'read_at': now, 'last_synced_at': now},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> markAllNotificationsReadLocally() async {
    if (_useMemoryStore) {
      return;
    }

    final db = await database;
    final now = DateTime.now().toUtc().toIso8601String();
    await db.update(
      'notifications',
      {'read': 1, 'read_at': now, 'last_synced_at': now},
      where: 'read = ?',
      whereArgs: [0],
    );
  }

  Future<void> upsertGamification(
    Map<String, dynamic> payload, {
    DateTime? updatedAt,
  }) async {
    if (_useMemoryStore) {
      return;
    }

    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();
    final summaryJson = _mapFromPayload(payload, const ['summary']) ?? const {};
    final summary = GamificationSummary.fromJson(summaryJson);
    final achievements = _mapsFromPayload(payload, const ['achievements']);
    final ranking = _mapsFromPayload(payload, const ['ranking']);
    final timeline = _mapsFromPayload(payload, const ['timeline']);
    final db = await database;

    await db.transaction((transaction) async {
      await transaction.insert('gamification_summary', {
        'id': 1,
        'rank': summary.rank,
        'points': summary.points,
        'badges': summary.badges,
        'raw_json': jsonEncode(summaryJson),
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);

      await transaction.delete('gamification_achievements');
      for (final row in achievements) {
        final achievement = GamificationAchievement.fromJson(row);
        final id = achievement.id.isEmpty
            ? _fallbackTextId(achievement.title, achievement.awardedAt)
            : achievement.id;
        await transaction.insert(
          'gamification_achievements',
          {
            'id': id,
            'title': achievement.title,
            'description': achievement.description,
            'icon': achievement.icon,
            'awarded_at': achievement.awardedAt?.toUtc().toIso8601String(),
            'raw_json': jsonEncode(row),
            'last_synced_at': timestamp,
          },
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }

      await transaction.delete('gamification_ranking');
      for (final row in ranking) {
        final user = LeaderboardUser.fromJson(row);
        if (user.id == 0) {
          continue;
        }
        await transaction.insert('gamification_ranking', {
          'id': user.id,
          'name': user.name,
          'points': user.points,
          'badges': user.badges,
          'rank': user.rank,
          'current_user': user.currentUser ? 1 : 0,
          'raw_json': jsonEncode(row),
          'last_synced_at': timestamp,
        }, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      await transaction.delete('gamification_timeline');
      for (final row in timeline) {
        final event = TimelineEventData.fromJson(row);
        final id = event.id.isEmpty
            ? _fallbackTextId(event.title, event.date)
            : event.id;
        await transaction.insert('gamification_timeline', {
          'id': id,
          'title': event.title,
          'description': event.description,
          'icon': event.icon,
          'event_date': event.date?.toUtc().toIso8601String(),
          'raw_json': jsonEncode(row),
          'last_synced_at': timestamp,
        }, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      await transaction.insert('api_payloads', {
        'key': 'gamification',
        'payload_json': jsonEncode(payload),
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    });
  }

  Future<GamificationData> getGamification() async {
    if (_useMemoryStore) {
      return GamificationData(
        summary: const GamificationSummary(rank: 12, points: 1250, badges: 8),
        achievements: [
          GamificationAchievement(
            id: 'early-adopter',
            title: 'Early Adopter',
            description: 'Primeiros 100 utilizadores da plataforma',
            icon: 'star',
            awardedAt: DateTime(2025, 12, 1),
          ),
          GamificationAchievement(
            id: 'collector',
            title: 'Badge Collector',
            description: '10+ badges conquistados',
            icon: 'badge',
            awardedAt: DateTime(2025, 11, 15),
          ),
        ],
        ranking: const [
          LeaderboardUser(
            id: 1,
            name: 'Ana Costa',
            points: 2850,
            badges: 15,
            rank: 1,
          ),
          LeaderboardUser(
            id: 2,
            name: 'Carlos Mendes',
            points: 2650,
            badges: 14,
            rank: 2,
          ),
          LeaderboardUser(
            id: 3,
            name: 'João Silva',
            points: 1250,
            badges: 8,
            rank: 12,
            currentUser: true,
          ),
        ],
        timeline: [
          TimelineEventData(
            id: 'azure-approved',
            title: 'Badge Azure Fundamentals aprovado',
            description: '',
            icon: 'badge',
            date: DateTime(2025, 12, 1),
          ),
        ],
        loadedFromCache: true,
      );
    }

    final db = await database;
    final summaryRows = await db.query(
      'gamification_summary',
      where: 'id = ?',
      whereArgs: [1],
      limit: 1,
    );
    final achievements = await db.query(
      'gamification_achievements',
      orderBy: 'awarded_at DESC, title ASC',
    );
    final ranking = await db.query(
      'gamification_ranking',
      orderBy: 'rank ASC, points DESC',
    );
    final timeline = await db.query(
      'gamification_timeline',
      orderBy: 'event_date DESC, title ASC',
    );

    if (summaryRows.isEmpty &&
        achievements.isEmpty &&
        ranking.isEmpty &&
        timeline.isEmpty) {
      return GamificationData.empty(loadedFromCache: true);
    }

    return GamificationData(
      summary: summaryRows.isEmpty
          ? const GamificationSummary(rank: 0, points: 0, badges: 0)
          : GamificationSummary(
              rank: summaryRows.first['rank'] as int,
              points: summaryRows.first['points'] as int,
              badges: summaryRows.first['badges'] as int,
            ),
      achievements: achievements.map(_achievementFromRow).toList(),
      ranking: ranking.map(_leaderboardUserFromRow).toList(),
      timeline: timeline.map(_timelineEventFromRow).toList(),
    );
  }

  Future<void> upsertEmailSignature(
    Map<String, dynamic> payload, {
    DateTime? updatedAt,
  }) async {
    if (_useMemoryStore) {
      return;
    }

    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();
    final profileJson = _mapFromPayload(payload, const ['profile']) ?? const {};
    final profile = EmailSignatureProfile.fromJson(profileJson);
    final badges = _mapsFromPayload(payload, const ['badges']);
    final templateHtml =
        _textValue(payload, const ['templateHtml', 'template_html']) ?? '';
    final db = await database;

    await db.transaction((transaction) async {
      await transaction.insert('email_signature_profile', {
        'id': 1,
        'name': profile.name,
        'email': profile.email,
        'role': profile.role,
        'website': profile.website,
        'template_html': templateHtml,
        'raw_json': jsonEncode(profileJson),
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);

      await transaction.delete('email_signature_badges');
      for (final row in badges) {
        final badge = EmailSignatureBadge.fromJson(row);
        if (badge.id == 0) {
          continue;
        }

        await transaction.insert('email_signature_badges', {
          'id': badge.id,
          'title': badge.title,
          'image_path': badge.imagePath,
          'public_token': badge.publicToken,
          'selected': badge.selected ? 1 : 0,
          'raw_json': jsonEncode(row),
          'last_synced_at': timestamp,
        }, conflictAlgorithm: ConflictAlgorithm.replace);
      }

      await transaction.insert('api_payloads', {
        'key': 'email_signature',
        'payload_json': jsonEncode(payload),
        'updated_at': timestamp,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    });
  }

  Future<EmailSignatureData> getEmailSignature() async {
    if (_useMemoryStore) {
      return const EmailSignatureData(
        profile: EmailSignatureProfile(
          name: 'João Silva',
          email: 'rafsilv26@gmail.com',
          role: 'Consultor',
          website: 'www.softinsa.pt',
        ),
        badges: [
          EmailSignatureBadge(
            id: 1,
            title: 'Azure Fundamentals',
            imagePath: 'assets/images/badge_azure_fundamentals.png',
            publicToken: '',
          ),
          EmailSignatureBadge(
            id: 2,
            title: 'AWS Cloud Practitioner',
            imagePath: 'assets/images/badge_aws_cloud_practitioner.png',
            publicToken: '',
            selected: true,
          ),
        ],
        templateHtml: '',
        loadedFromCache: true,
      );
    }

    final db = await database;
    final profileRows = await db.query(
      'email_signature_profile',
      where: 'id = ?',
      whereArgs: [1],
      limit: 1,
    );
    final badgeRows = await db.query(
      'email_signature_badges',
      orderBy: 'selected DESC, title ASC',
    );

    if (profileRows.isEmpty && badgeRows.isEmpty) {
      return EmailSignatureData.empty(loadedFromCache: true);
    }

    final profileRow = profileRows.isEmpty ? null : profileRows.first;
    return EmailSignatureData(
      profile: profileRow == null
          ? const EmailSignatureProfile(
              name: '',
              email: '',
              role: 'Consultor',
              website: 'www.softinsa.pt',
            )
          : EmailSignatureProfile(
              name: profileRow['name'] as String,
              email: profileRow['email'] as String,
              role: profileRow['role'] as String,
              website: profileRow['website'] as String,
            ),
      badges: badgeRows.map(_emailSignatureBadgeFromRow).toList(),
      templateHtml: profileRow?['template_html'] as String? ?? '',
    );
  }

  Future<PendingBadgeApplication> enqueuePendingBadgeApplication({
    required String clientRequestId,
    required int ownerUserId,
    required int badgeId,
    required List<EvidenceAttachment> evidenceFiles,
    String? description,
  }) {
    final key = '$ownerUserId:$badgeId';
    final previous = _pendingEnqueueTails[key] ?? Future<void>.value();
    final completed = Completer<void>();
    final current = completed.future;
    _pendingEnqueueTails[key] = current;

    return () async {
      try {
        await previous;
        return await _enqueuePendingBadgeApplicationUnlocked(
          clientRequestId: clientRequestId,
          ownerUserId: ownerUserId,
          badgeId: badgeId,
          evidenceFiles: evidenceFiles,
          description: description,
        );
      } finally {
        completed.complete();
        if (identical(_pendingEnqueueTails[key], current)) {
          _pendingEnqueueTails.remove(key);
        }
      }
    }();
  }

  Future<PendingBadgeApplication> _enqueuePendingBadgeApplicationUnlocked({
    required String clientRequestId,
    required int ownerUserId,
    required int badgeId,
    required List<EvidenceAttachment> evidenceFiles,
    String? description,
  }) async {
    if (evidenceFiles.length > 10) {
      throw const FileSystemException(
        'Uma candidatura não pode ter mais de 10 evidências.',
      );
    }

    final existing = await getPendingBadgeApplications(
      ownerUserId,
      badgeId: badgeId,
    );
    if (existing.isNotEmpty && !existing.first.hasFailed) {
      return existing.first;
    }
    if (existing.isNotEmpty) {
      await deletePendingBadgeApplication(existing.first.localId);
    }

    final now = DateTime.now().toUtc();
    if (_useMemoryStore) {
      final localId = _nextMemoryPendingApplicationId++;
      final pending = PendingBadgeApplication(
        localId: localId,
        clientRequestId: clientRequestId,
        ownerUserId: ownerUserId,
        badgeId: badgeId,
        description: description,
        state: 'queued',
        attemptCount: 0,
        createdAt: now,
        updatedAt: now,
        evidences: evidenceFiles.asMap().entries.map((entry) {
          return PendingBadgeEvidence(
            id: entry.key + 1,
            requirementId: entry.value.requirementId,
            storedPath: entry.value.path,
            originalName: entry.value.fileName,
          );
        }).toList(),
      );
      _memoryPendingApplications[clientRequestId] = pending;
      return pending;
    }

    final copiedEvidence = await _copyPendingEvidenceFiles(
      clientRequestId,
      evidenceFiles,
    );
    final db = await database;
    try {
      final localId = await db.transaction((transaction) async {
        final id = await transaction.insert('pending_badge_applications', {
          'client_request_id': clientRequestId,
          'owner_user_id': ownerUserId,
          'badge_id': badgeId,
          'description': description,
          'state': 'queued',
          'attempt_count': 0,
          'created_at': now.toIso8601String(),
          'updated_at': now.toIso8601String(),
        });
        for (final evidence in copiedEvidence) {
          await transaction.insert('pending_badge_evidences', {
            'pending_application_id': id,
            'requirement_id': evidence.requirementId,
            'stored_path': evidence.storedPath,
            'original_name': evidence.originalName,
            'created_at': now.toIso8601String(),
          });
        }
        return id;
      });

      final rows = await db.query(
        'pending_badge_applications',
        where: 'id = ?',
        whereArgs: [localId],
        limit: 1,
      );
      return _pendingBadgeApplicationFromRow(db, rows.single);
    } catch (_) {
      await _deleteStoredEvidenceFiles(copiedEvidence);
      rethrow;
    }
  }

  Future<List<PendingBadgeApplication>> getPendingBadgeApplications(
    int ownerUserId, {
    int? badgeId,
    String? clientRequestId,
    List<String>? states,
  }) async {
    if (_useMemoryStore) {
      final result = _memoryPendingApplications.values.where((item) {
        return item.ownerUserId == ownerUserId &&
            (badgeId == null || item.badgeId == badgeId) &&
            (clientRequestId == null ||
                item.clientRequestId == clientRequestId) &&
            (states == null || states.contains(item.state));
      }).toList()..sort((a, b) => a.createdAt.compareTo(b.createdAt));
      return result;
    }

    final clauses = <String>['owner_user_id = ?'];
    final arguments = <Object?>[ownerUserId];
    if (badgeId != null) {
      clauses.add('badge_id = ?');
      arguments.add(badgeId);
    }
    if (clientRequestId != null) {
      clauses.add('client_request_id = ?');
      arguments.add(clientRequestId);
    }
    if (states != null && states.isNotEmpty) {
      clauses.add('state IN (${List.filled(states.length, '?').join(', ')})');
      arguments.addAll(states);
    }

    final db = await database;
    final rows = await db.query(
      'pending_badge_applications',
      where: clauses.join(' AND '),
      whereArgs: arguments,
      orderBy: 'created_at ASC',
    );
    return Future.wait(
      rows.map((row) => _pendingBadgeApplicationFromRow(db, row)),
    );
  }

  Future<void> markPendingBadgeApplicationRetry(
    int localId, {
    required String error,
    int? httpStatus,
  }) async {
    await _updatePendingBadgeApplication(
      localId,
      state: 'queued',
      error: error,
      httpStatus: httpStatus,
      incrementAttempt: true,
    );
  }

  Future<void> markPendingBadgeApplicationSent(
    int localId, {
    int? serverApplicationId,
  }) async {
    await _updatePendingBadgeApplication(
      localId,
      state: 'sent',
      serverApplicationId: serverApplicationId,
      clearError: true,
      incrementAttempt: true,
    );
  }

  Future<void> markPendingBadgeApplicationFailed(
    int localId, {
    required String error,
    int? httpStatus,
  }) async {
    await _updatePendingBadgeApplication(
      localId,
      state: 'failed',
      error: error,
      httpStatus: httpStatus,
      incrementAttempt: true,
    );
  }

  Future<void> deletePendingBadgeApplication(int localId) async {
    if (_useMemoryStore) {
      _memoryPendingApplications.removeWhere(
        (_, item) => item.localId == localId,
      );
      return;
    }

    final db = await database;
    final evidenceRows = await db.query(
      'pending_badge_evidences',
      where: 'pending_application_id = ?',
      whereArgs: [localId],
    );
    final evidences = evidenceRows.map(_pendingBadgeEvidenceFromRow).toList();
    await db.transaction((transaction) async {
      await transaction.delete(
        'pending_badge_evidences',
        where: 'pending_application_id = ?',
        whereArgs: [localId],
      );
      await transaction.delete(
        'pending_badge_applications',
        where: 'id = ?',
        whereArgs: [localId],
      );
    });
    await _deleteStoredEvidenceFiles(evidences);
  }

  Future<void> deleteSentPendingBadgeApplications(int ownerUserId) async {
    final sent = await getPendingBadgeApplications(
      ownerUserId,
      states: const ['sent'],
    );
    for (final pending in sent) {
      await deletePendingBadgeApplication(pending.localId);
    }
  }

  Future<void> _updatePendingBadgeApplication(
    int localId, {
    required String state,
    String? error,
    int? httpStatus,
    int? serverApplicationId,
    bool clearError = false,
    bool incrementAttempt = false,
  }) async {
    final now = DateTime.now().toUtc();
    if (_useMemoryStore) {
      final entry = _memoryPendingApplications.entries
          .where((entry) => entry.value.localId == localId)
          .firstOrNull;
      if (entry == null) return;
      final current = entry.value;
      _memoryPendingApplications[entry.key] = current.copyWith(
        state: state,
        attemptCount: current.attemptCount + (incrementAttempt ? 1 : 0),
        lastError: error,
        clearLastError: clearError,
        lastHttpStatus: httpStatus,
        clearLastHttpStatus: clearError,
        serverApplicationId: serverApplicationId,
        updatedAt: now,
      );
      return;
    }

    final db = await database;
    final values = <String, Object?>{
      'state': state,
      'last_error': clearError ? null : error,
      'last_http_status': clearError ? null : httpStatus,
      'updated_at': now.toIso8601String(),
      'server_application_id': ?serverApplicationId,
    };
    if (incrementAttempt) {
      await db.rawUpdate(
        '''
        UPDATE pending_badge_applications
        SET state = ?, attempt_count = attempt_count + 1,
            last_error = ?, last_http_status = ?,
            server_application_id = COALESCE(?, server_application_id),
            updated_at = ?
        WHERE id = ?
        ''',
        [
          state,
          values['last_error'],
          values['last_http_status'],
          serverApplicationId,
          values['updated_at'],
          localId,
        ],
      );
      return;
    }
    await db.update(
      'pending_badge_applications',
      values,
      where: 'id = ?',
      whereArgs: [localId],
    );
  }

  Future<List<PendingBadgeEvidence>> _copyPendingEvidenceFiles(
    String clientRequestId,
    List<EvidenceAttachment> evidenceFiles,
  ) async {
    if (evidenceFiles.isEmpty) return const [];
    final factory = _databaseFactory();
    final databasesPath = await factory.getDatabasesPath();
    final directory = Directory(
      path.join(databasesPath, 'pending_badge_evidence', clientRequestId),
    );
    await directory.create(recursive: true);
    final copied = <PendingBadgeEvidence>[];
    try {
      for (final entry in evidenceFiles.asMap().entries) {
        final evidence = entry.value;
        final source = File(evidence.path);
        if (!await source.exists()) {
          throw FileSystemException(
            'O ficheiro selecionado deixou de estar disponível.',
            evidence.path,
          );
        }
        final length = await source.length();
        if (length > 10 * 1024 * 1024) {
          throw FileSystemException(
            'Cada evidência pode ter no máximo 10 MB.',
            evidence.path,
          );
        }
        final extension = path.extension(evidence.fileName).toLowerCase();
        if (!const {'.pdf', '.jpg', '.jpeg', '.png'}.contains(extension)) {
          throw FileSystemException(
            'Apenas são aceites ficheiros PDF, JPG e PNG.',
            evidence.path,
          );
        }
        final safeName = evidence.fileName.replaceAll(
          RegExp(r'[^A-Za-z0-9._-]'),
          '_',
        );
        final destination = path.join(directory.path, '${entry.key}_$safeName');
        await source.copy(destination);
        copied.add(
          PendingBadgeEvidence(
            id: 0,
            requirementId: evidence.requirementId,
            storedPath: destination,
            originalName: evidence.fileName,
          ),
        );
      }
      return copied;
    } catch (_) {
      if (await directory.exists()) {
        await directory.delete(recursive: true);
      }
      rethrow;
    }
  }

  Future<void> _deleteStoredEvidenceFiles(
    List<PendingBadgeEvidence> evidences,
  ) async {
    final directories = <String>{};
    for (final evidence in evidences) {
      final file = File(evidence.storedPath);
      directories.add(path.dirname(file.path));
      try {
        if (await file.exists()) await file.delete();
      } catch (_) {
        // A linha já foi removida; a limpeza de um ficheiro órfão é best effort.
      }
    }
    for (final directoryPath in directories) {
      try {
        final directory = Directory(directoryPath);
        if (await directory.exists()) await directory.delete(recursive: true);
      } catch (_) {
        // Não bloquear a sincronização por uma falha de limpeza local.
      }
    }
  }

  Future<PendingBadgeApplication> _pendingBadgeApplicationFromRow(
    DatabaseExecutor db,
    Map<String, Object?> row,
  ) async {
    final localId = row['id'] as int? ?? 0;
    final evidenceRows = await db.query(
      'pending_badge_evidences',
      where: 'pending_application_id = ?',
      whereArgs: [localId],
      orderBy: 'id ASC',
    );
    return PendingBadgeApplication(
      localId: localId,
      clientRequestId: row['client_request_id'] as String? ?? '',
      ownerUserId: row['owner_user_id'] as int? ?? 0,
      badgeId: row['badge_id'] as int? ?? 0,
      description: row['description'] as String?,
      state: row['state'] as String? ?? 'queued',
      attemptCount: row['attempt_count'] as int? ?? 0,
      lastError: row['last_error'] as String?,
      lastHttpStatus: row['last_http_status'] as int?,
      serverApplicationId: row['server_application_id'] as int?,
      createdAt:
          DateTime.tryParse(row['created_at'] as String? ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
      updatedAt:
          DateTime.tryParse(row['updated_at'] as String? ?? '') ??
          DateTime.fromMillisecondsSinceEpoch(0, isUtc: true),
      evidences: evidenceRows.map(_pendingBadgeEvidenceFromRow).toList(),
    );
  }

  PendingBadgeEvidence _pendingBadgeEvidenceFromRow(Map<String, Object?> row) {
    return PendingBadgeEvidence(
      id: row['id'] as int? ?? 0,
      requirementId: row['requirement_id'] as int? ?? 0,
      storedPath: row['stored_path'] as String? ?? '',
      originalName: row['original_name'] as String? ?? '',
    );
  }

  Future<List<CatalogBadge>> getCatalogBadges({int? ownerUserId}) async {
    if (_useMemoryStore) {
      return DashboardData.sample().recommendations.asMap().entries.map((
        entry,
      ) {
        final badge = entry.value;
        return CatalogBadge(
          id: entry.key + 1,
          title: badge.title,
          description: badge.description,
          level: badge.level,
          area: 'Hybrid Cloud',
          points: badge.points,
          duration: badge.duration,
          type: badge.tag,
          provider: '',
          imagePath: badge.iconName,
          requirements: badge.prerequisites.asMap().entries.map((item) {
            return CatalogRequirement(id: item.key + 1, title: item.value);
          }).toList(),
        );
      }).toList();
    }

    final db = await database;
    final rows = await db.rawQuery('''
      SELECT
        b.id,
        b.level_id,
        b.nome,
        b.descricao,
        b.imagem,
        b.pontos,
        b.duracao_meses,
        b.raw_json,
        l.nome AS level_nome,
        l.ordem AS level_ordem,
        a.nome AS area_nome
      FROM badges b
      LEFT JOIN levels l ON l.id = b.level_id
      LEFT JOIN areas a ON a.id = l.area_id
      WHERE b.ativo IS NULL OR b.ativo = 1
      ORDER BY b.pontos DESC, b.nome ASC
    ''');
    final applicationRows = ownerUserId == null
        ? const <Map<String, Object?>>[]
        : await db.query(
            'candidaturas',
            where: 'consultor_id = ?',
            whereArgs: [ownerUserId],
            orderBy: 'updated_at DESC, created_at DESC',
          );
    final applicationByBadgeId = <int, CatalogApplication>{};
    for (final row in applicationRows) {
      final badgeId = row['badge_id'] as int?;
      if (badgeId == null || applicationByBadgeId.containsKey(badgeId)) {
        continue;
      }
      final candidaturaId = row['id'] as int? ?? 0;
      final raw = _jsonMap(row['raw_json'] as String?);
      final status = _statusCodeFromRow(raw) ?? row['estado'] as String? ?? '';
      final statusMap = _mapValue(raw, const ['status']);
      final statusLabel =
          _textValue(statusMap, const ['name', 'description']) ??
          _statusLabel(status);
      applicationByBadgeId[badgeId] = CatalogApplication(
        id: candidaturaId,
        status: status,
        statusLabel: statusLabel,
        evidences: await _applicationEvidences(db, candidaturaId),
      );
    }

    final result = <CatalogBadge>[];
    for (final row in rows) {
      final levelId = row['level_id'] as int?;
      final requirementRows = levelId == null
          ? const <Map<String, Object?>>[]
          : await db.query(
              'requirements',
              where: 'level_id = ?',
              whereArgs: [levelId],
              orderBy: 'nome ASC',
            );
      result.add(
        _catalogBadgeFromRow(
          row,
          requirementRows.map(_catalogRequirementFromRow).toList(),
          applicationByBadgeId[row['id'] as int? ?? 0],
        ),
      );
    }

    return result;
  }

  Future<List<MyBadgeApplication>> getMyBadgeApplications({
    required int ownerUserId,
  }) async {
    if (_useMemoryStore) {
      return [
        MyBadgeApplication(
          id: 1,
          badgeId: 1,
          title: 'Azure Fundamentals',
          description: 'Candidatura em validação',
          status: 'SUBMITTED',
          statusLabel: 'Submetida',
          points: 100,
          imagePath: 'cloud',
          createdAt: DateTime(2025, 12, 1),
        ),
        MyBadgeApplication(
          id: 2,
          badgeId: 2,
          title: 'AWS Cloud Practitioner',
          description: 'Badge aprovada',
          status: 'APPROVED',
          statusLabel: 'Aprovada',
          points: 150,
          imagePath: 'cloud',
          createdAt: DateTime(2025, 11, 20),
        ),
      ];
    }

    final db = await database;
    final awardRows = await db.rawQuery(
      '''
      SELECT cb.*, b.nome AS badge_nome, b.descricao AS badge_descricao,
             b.imagem AS badge_imagem, b.pontos AS badge_pontos,
             b.uuid AS badge_public_token
      FROM consultant_badges cb
      LEFT JOIN badges b ON b.id = cb.badge_id
      WHERE cb.consultor_id = ?
      ORDER BY cb.obtained_date DESC
    ''',
      [ownerUserId],
    );
    final awardsByBadge = {
      for (final award in awardRows)
        if (award['badge_id'] is int) award['badge_id'] as int: award,
    };
    final rows = await db.rawQuery(
      '''
      SELECT
        c.id AS candidatura_id,
        c.badge_id,
        c.estado,
        c.created_at AS candidatura_created_at,
        c.updated_at AS candidatura_updated_at,
        c.raw_json AS candidatura_raw_json,
        b.nome AS badge_nome,
        b.descricao AS badge_descricao,
        b.imagem AS badge_imagem,
        b.pontos AS badge_pontos,
        b.raw_json AS badge_raw_json
      FROM candidaturas c
      LEFT JOIN badges b ON b.id = c.badge_id
      WHERE c.consultor_id = ?
      ORDER BY c.updated_at DESC, c.created_at DESC
    ''',
      [ownerUserId],
    );

    final applications = <MyBadgeApplication>[];
    for (final row in rows) {
      final candidaturaId = row['candidatura_id'] as int? ?? 0;
      final badgeId = row['badge_id'] as int? ?? 0;
      applications.add(
        _myBadgeApplicationFromRow(
          row,
          await _applicationEvidences(db, candidaturaId),
          await _applicationHistory(db, candidaturaId),
          award: awardsByBadge[badgeId],
        ),
      );
    }

    final existingBadgeIds = applications.map((item) => item.badgeId).toSet();
    for (final award in awardRows) {
      final badgeId = award['badge_id'] as int? ?? 0;
      if (badgeId <= 0 || existingBadgeIds.contains(badgeId)) continue;
      applications.add(
        MyBadgeApplication(
          id: -badgeId,
          badgeId: badgeId,
          title: award['badge_nome'] as String? ?? '',
          description: award['badge_descricao'] as String? ?? '',
          status: 'APPROVED',
          statusLabel: 'Conquistado',
          points:
              award['points_obtained'] as int? ??
              award['badge_pontos'] as int? ??
              0,
          imagePath: award['badge_imagem'] as String? ?? '',
          obtainedAt: _dateFromText(award['obtained_date'] as String?),
          expirationDate: _dateFromText(award['expiration_date'] as String?),
          valid: (award['valid'] as int? ?? 1) == 1,
          publicToken: _awardPublicToken(award) ?? '',
        ),
      );
    }

    applications.sort((a, b) {
      final ad = a.updatedAt ?? a.obtainedAt ?? a.createdAt ?? DateTime(1970);
      final bd = b.updatedAt ?? b.obtainedAt ?? b.createdAt ?? DateTime(1970);
      return bd.compareTo(ad);
    });

    return applications;
  }

  Future<ConsultantDetailData> getConsultantDetail(
    ConsultantProfile consultant,
  ) async {
    if (_useMemoryStore) {
      return _sampleConsultantDetail(consultant);
    }

    final consultantId = consultant.id;
    if (consultantId == null) {
      return ConsultantDetailData.empty(
        consultant: consultant,
        loadedFromCache: true,
      );
    }

    final db = await database;
    final consultantRows = await db.query(
      'consultants',
      where: 'id = ?',
      whereArgs: [consultantId],
      limit: 1,
    );
    final localConsultant = consultantRows.isEmpty
        ? consultant
        : _consultantFromRow(consultantRows.first);

    final badgeRows = await db.rawQuery(
      '''
      SELECT
        cb.consultor_id,
        cb.badge_id,
        cb.obtained_date,
        cb.valid,
        cb.points_obtained,
        b.nome AS badge_nome,
        b.imagem AS badge_imagem,
        b.pontos AS badge_pontos,
        l.nome AS level_nome,
        l.ordem AS level_ordem
      FROM consultant_badges cb
      LEFT JOIN badges b ON b.id = cb.badge_id
      LEFT JOIN levels l ON l.id = b.level_id
      WHERE cb.consultor_id = ?
      ORDER BY cb.obtained_date DESC, b.nome ASC
    ''',
      [consultantId],
    );

    final achievementRows = await db.rawQuery(
      '''
      SELECT
        cpb.badge_premium_id,
        cpb.achievement_date,
        cpb.created_at AS award_created_at,
        bp.name,
        bp.description,
        bp.icon,
        bp.criteria_description
      FROM consultant_premium_badges cpb
      LEFT JOIN badge_premium bp ON bp.id = cpb.badge_premium_id
      WHERE cpb.consultor_id = ?
      ORDER BY cpb.achievement_date DESC, bp.name ASC
    ''',
      [consultantId],
    );

    final totalBadgeRows = await db.rawQuery(
      'SELECT COUNT(*) AS total FROM badges WHERE ativo IS NULL OR ativo = 1',
    );
    final totalAvailableBadges = Sqflite.firstIntValue(totalBadgeRows) ?? 0;

    final badges = badgeRows.map(_consultantAwardedBadgeFromRow).toList();
    final achievements = achievementRows
        .map(_consultantSpecialAchievementFromRow)
        .toList();
    final points = badges.fold<int>(0, (sum, badge) => sum + badge.points);
    final recentPoints = badges
        .where(_wasAwardedInLastThirtyDays)
        .fold<int>(0, (sum, badge) => sum + badge.points);
    final activityDays = _distinctActivityDays(badges, achievements);

    final enrichedConsultant = localConsultant.copyWith(
      points: points > 0 ? points : localConsultant.points,
      badges: badges.isNotEmpty ? badges.length : localConsultant.badges,
      specials: achievements.isNotEmpty
          ? achievements.length
          : localConsultant.specials,
    );

    return ConsultantDetailData(
      consultant: enrichedConsultant,
      badges: badges,
      achievements: achievements,
      stats: ConsultantActivityStats.fromTotals(
        points: enrichedConsultant.points,
        badges: enrichedConsultant.badges,
        achievements: enrichedConsultant.specials,
        totalAvailableBadges: totalAvailableBadges,
        recentPoints: recentPoints,
        activityDays: activityDays,
      ),
      loadedFromCache: true,
    );
  }

  Future<DashboardData?> getDashboard() async {
    if (_useMemoryStore) {
      return _memoryDashboard;
    }

    final db = await database;
    final dashboardRows = await db.query(
      'dashboard',
      where: 'id = ?',
      whereArgs: [1],
      limit: 1,
    );

    if (dashboardRows.isEmpty) {
      return null;
    }

    final recommendationRows = await db.query(
      'badge_recommendations',
      orderBy: 'updated_at DESC, title ASC',
    );
    final recommendations = recommendationRows.isNotEmpty
        ? recommendationRows.map(_recommendationFromRow).toList()
        : await _recommendationsFromCachedBadges(db);

    final dashboard = dashboardRows.first;
    return DashboardData(
      userName: dashboard['user_name'] as String,
      userRole: dashboard['user_role'] as String? ?? '',
      greeting: dashboard['greeting'] as String,
      totalPoints: dashboard['total_points'] as int,
      learningPathTitle: dashboard['learning_path_title'] as String,
      learningPathProgress: dashboard['learning_path_progress'] as double,
      noticeTitle: dashboard['notice_title'] as String,
      noticeMessage: dashboard['notice_message'] as String,
      specialAchievementTitle: dashboard['special_achievement_title'] as String,
      specialAchievementMessage:
          dashboard['special_achievement_message'] as String,
      badgesWon: dashboard['badges_won'] as int,
      inProgress: dashboard['in_progress'] as int,
      ranking: dashboard['ranking'] as int,
      recommendations: recommendations,
    );
  }

  Future<LocalUserProfile?> getCurrentUserProfile() async {
    if (_useMemoryStore) {
      return _memoryCurrentUserProfile;
    }

    final db = await database;
    final metadataRows = await db.query(
      'sync_metadata',
      columns: ['value'],
      where: 'key = ?',
      whereArgs: ['current_user_id'],
      limit: 1,
    );

    if (metadataRows.isEmpty) {
      return null;
    }

    final id = int.tryParse(metadataRows.first['value'].toString());
    if (id == null) {
      return null;
    }

    final userRows = await db.query(
      'api_users',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );

    if (userRows.isEmpty) {
      return null;
    }

    final row = userRows.first;
    return LocalUserProfile(
      id: row['id'] as int,
      name: row['nome'] as String? ?? '',
      email: row['email'] as String? ?? '',
      role: row['role'] as String? ?? '',
      mustChangePassword: (row['must_change_password'] as int? ?? 0) == 1,
    );
  }

  Future<void> markCurrentUserPasswordChanged({DateTime? updatedAt}) async {
    if (_useMemoryStore) {
      return;
    }

    final db = await database;
    final metadataRows = await db.query(
      'sync_metadata',
      columns: ['value'],
      where: 'key = ?',
      whereArgs: ['current_user_id'],
      limit: 1,
    );

    if (metadataRows.isEmpty) {
      return;
    }

    final id = int.tryParse(metadataRows.first['value'].toString());
    if (id == null) {
      return;
    }

    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();
    await db.update(
      'api_users',
      {'must_change_password': 0, 'updated_at': timestamp},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  bool get _useMemoryStore {
    if (_databaseFactoryOverride != null) return false;
    return WidgetsBinding.instance.runtimeType.toString().contains(
          'TestWidgetsFlutterBinding',
        ) ||
        (!Platform.isAndroid && !Platform.isIOS);
  }

  DashboardData _mergeMemoryDashboard(DashboardData data) {
    final current = _memoryDashboard;
    if (current == null) {
      return data;
    }

    final recommendationsById = {
      for (final recommendation in current.recommendations)
        _recommendationId(recommendation): recommendation,
    };

    for (final recommendation in data.recommendations) {
      recommendationsById[_recommendationId(recommendation)] = recommendation;
    }

    return DashboardData(
      userName: data.userName,
      userRole: data.userRole,
      greeting: data.greeting,
      totalPoints: data.totalPoints,
      learningPathTitle: data.learningPathTitle,
      learningPathProgress: data.learningPathProgress,
      noticeTitle: data.noticeTitle,
      noticeMessage: data.noticeMessage,
      specialAchievementTitle: data.specialAchievementTitle,
      specialAchievementMessage: data.specialAchievementMessage,
      badgesWon: data.badgesWon,
      inProgress: data.inProgress,
      ranking: data.ranking,
      recommendations: recommendationsById.values.toList(),
    );
  }

  BadgeRecommendation _recommendationFromRow(Map<String, Object?> row) {
    final prerequisitesJson = row['prerequisites_json'] as String;
    final prerequisites = jsonDecode(prerequisitesJson) as List<dynamic>;

    return BadgeRecommendation(
      title: row['title'] as String,
      description: row['description'] as String,
      level: row['level'] as String,
      tag: row['tag'] as String,
      points: row['points'] as int,
      duration: row['duration'] as String,
      prerequisites: prerequisites.map((item) => item.toString()).toList(),
      iconName: row['icon_name'] as String,
    );
  }

  String _recommendationId(BadgeRecommendation recommendation) {
    return recommendation.title.trim().toLowerCase().replaceAll(' ', '_');
  }

  ConsultantDetailData _sampleConsultantDetail(ConsultantProfile consultant) {
    return ConsultantDetailData.empty(
      consultant: consultant,
      loadedFromCache: true,
    );
  }

  List<ConsultantProfile> _sampleConsultants() {
    return const [
      ConsultantProfile(
        id: 1,
        name: 'João Silva',
        role: 'Consultor',
        area: 'Hybrid Cloud',
        location: 'Lisboa',
        email: 'joao.silva@softinsa.pt',
        startDate: '',
        points: 2450,
        badges: 12,
        specials: 3,
        rank: 1,
        imagePath: 'assets/images/consultant_joao_silva.png',
        isCurrentUser: true,
      ),
      ConsultantProfile(
        id: 2,
        name: 'Maria Santos',
        role: 'Consultora Sénior',
        area: 'Data & AI',
        location: 'Porto',
        email: 'maria.santos@softinsa.pt',
        startDate: '',
        points: 2380,
        badges: 15,
        specials: 2,
        rank: 2,
        imagePath: 'assets/images/consultant_maria_santos.png',
      ),
      ConsultantProfile(
        id: 3,
        name: 'Pedro Costa',
        role: 'Consultor',
        area: 'Cybersecurity',
        location: 'Lisboa',
        email: 'pedro.costa@softinsa.pt',
        startDate: '',
        points: 2120,
        badges: 10,
        specials: 2,
        rank: 3,
        imagePath: 'assets/images/consultant_pedro_costa.png',
      ),
      ConsultantProfile(
        id: 4,
        name: 'Ana Rodrigues',
        role: 'Consultora',
        area: 'Custom Development',
        location: 'Braga',
        email: 'ana.rodrigues@softinsa.pt',
        startDate: '',
        points: 1890,
        badges: 9,
        specials: 1,
        rank: 4,
        imagePath: 'assets/images/consultant_ana_rodrigues.png',
      ),
      ConsultantProfile(
        id: 5,
        name: 'Ricardo Oliveira',
        role: 'Consultor',
        area: 'Application Operations',
        location: 'Lisboa',
        email: 'ricardo.oliveira@softinsa.pt',
        startDate: '',
        points: 1650,
        badges: 8,
        specials: 1,
        rank: 5,
        imagePath: 'assets/images/consultant_ricardo_oliveira.png',
      ),
      ConsultantProfile(
        id: 6,
        name: 'Sofia Fernandes',
        role: 'Consultora',
        area: 'Digital Experience',
        location: 'Porto',
        email: 'sofia.fernandes@softinsa.pt',
        startDate: '',
        points: 1520,
        badges: 7,
        specials: 1,
        rank: 6,
        imagePath: 'assets/images/consultant_sofia_fernandes.png',
      ),
      ConsultantProfile(
        id: 7,
        name: 'Miguel Pereira',
        role: 'Consultor Júnior',
        area: 'Hybrid Cloud',
        location: 'Coimbra',
        email: 'miguel.pereira@softinsa.pt',
        startDate: '',
        points: 1280,
        badges: 6,
        specials: 1,
        rank: 7,
        imagePath: 'assets/images/consultant_miguel_pereira.png',
      ),
      ConsultantProfile(
        id: 8,
        name: 'Beatriz Alves',
        role: 'Consultora Júnior',
        area: 'Data & AI',
        location: 'Lisboa',
        email: 'beatriz.alves@softinsa.pt',
        startDate: '',
        points: 980,
        badges: 5,
        specials: 1,
        rank: 8,
        imagePath: 'assets/images/consultant_beatriz_alves.png',
      ),
      ConsultantProfile(
        id: 9,
        name: 'Tiago Martins',
        role: 'Consultor Júnior',
        area: 'Cybersecurity',
        location: 'Porto',
        email: 'tiago.martins@softinsa.pt',
        startDate: '',
        points: 850,
        badges: 4,
        specials: 1,
        rank: 9,
        imagePath: 'assets/images/consultant_tiago_martins.png',
      ),
      ConsultantProfile(
        id: 10,
        name: 'Carla Sousa',
        role: 'Consultora Júnior',
        area: 'Custom Development',
        location: 'Faro',
        email: 'carla.sousa@softinsa.pt',
        startDate: '',
        points: 720,
        badges: 3,
        specials: 0,
        rank: 10,
        imagePath: 'assets/images/consultant_carla_sousa.png',
      ),
    ];
  }

  Future<List<BadgeRecommendation>> _recommendationsFromCachedBadges(
    Database db,
  ) async {
    final rows = await db.query(
      'badges',
      where: 'ativo IS NULL OR ativo = ?',
      whereArgs: [1],
      orderBy: 'updated_at DESC, nome ASC',
      limit: 8,
    );

    return rows.map((row) {
      final durationMonths = row['duracao_meses'] as int?;
      final duration = durationMonths == null || durationMonths <= 0
          ? ''
          : '$durationMonths meses';

      return BadgeRecommendation(
        title: row['nome'] as String? ?? '',
        description: row['descricao'] as String? ?? '',
        level: '',
        tag: '',
        points: row['pontos'] as int? ?? 0,
        duration: duration,
        prerequisites: const [],
        iconName: row['imagem'] as String? ?? 'badge',
      );
    }).toList();
  }

  ConsultantAwardedBadge _consultantAwardedBadgeFromRow(
    Map<String, Object?> row,
  ) {
    final badgeId = row['badge_id'] as int? ?? 0;
    final pointsObtained = row['points_obtained'] as int?;
    final badgePoints = row['badge_pontos'] as int?;
    final levelName = row['level_nome'] as String?;
    final levelOrder = row['level_ordem'] as String?;

    return ConsultantAwardedBadge(
      badgeId: badgeId,
      title: row['badge_nome'] as String? ?? 'Badge #$badgeId',
      level: levelName?.isNotEmpty == true
          ? levelName!
          : levelOrder?.isNotEmpty == true
          ? 'Nível: $levelOrder'
          : 'Nível não definido',
      points: pointsObtained ?? badgePoints ?? 0,
      imagePath: row['badge_imagem'] as String? ?? '',
      obtainedAt: _dateFromText(row['obtained_date'] as String?),
      valid: (row['valid'] as int? ?? 1) == 1,
    );
  }

  ConsultantSpecialAchievement _consultantSpecialAchievementFromRow(
    Map<String, Object?> row,
  ) {
    final id = row['badge_premium_id'] as int? ?? 0;
    return ConsultantSpecialAchievement(
      id: id,
      title: row['name'] as String? ?? 'Conquista #$id',
      description:
          row['description'] as String? ??
          row['criteria_description'] as String? ??
          '',
      icon: row['icon'] as String? ?? 'star',
      awardedAt:
          _dateFromText(row['achievement_date'] as String?) ??
          _dateFromText(row['award_created_at'] as String?),
    );
  }

  bool _wasAwardedInLastThirtyDays(ConsultantAwardedBadge badge) {
    final obtainedAt = badge.obtainedAt;
    if (obtainedAt == null) {
      return false;
    }

    return obtainedAt.isAfter(
      DateTime.now().subtract(const Duration(days: 30)),
    );
  }

  int _distinctActivityDays(
    List<ConsultantAwardedBadge> badges,
    List<ConsultantSpecialAchievement> achievements,
  ) {
    final days = <String>{};
    for (final badge in badges) {
      final date = badge.obtainedAt;
      if (date != null) {
        days.add('${date.year}-${date.month}-${date.day}');
      }
    }
    for (final achievement in achievements) {
      final date = achievement.awardedAt;
      if (date != null) {
        days.add('${date.year}-${date.month}-${date.day}');
      }
    }
    return days.length;
  }

  ConsultantProfile _consultantFromRow(Map<String, Object?> row) {
    return ConsultantProfile(
      id: row['id'] as int?,
      name: row['name'] as String? ?? '',
      role: row['role'] as String? ?? '',
      area: row['area'] as String? ?? '',
      serviceLine: row['service_line'] as String? ?? '',
      location: row['location'] as String? ?? '',
      email: row['email'] as String? ?? '',
      startDate: row['start_date'] as String? ?? '',
      points: row['points'] as int? ?? 0,
      badges: row['badges'] as int? ?? 0,
      specials: row['specials'] as int? ?? 0,
      rank: row['rank'] as int? ?? 0,
      imagePath: row['image_path'] as String? ?? '',
      biography: row['biography'] as String? ?? '',
      linkedinUrl: row['linkedin_url'] as String? ?? '',
      isCurrentUser: (row['is_current_user'] as int? ?? 0) == 1,
    );
  }

  AppNotification _notificationFromRow(Map<String, Object?> row) {
    return AppNotification(
      id: row['id'] as String? ?? '',
      title: row['title'] as String? ?? '',
      message: row['message'] as String? ?? '',
      type: row['type'] as String? ?? 'info',
      read: (row['read'] as int? ?? 0) == 1,
      createdAt: _dateFromText(row['created_at'] as String?),
      readAt: _dateFromText(row['read_at'] as String?),
    );
  }

  GamificationAchievement _achievementFromRow(Map<String, Object?> row) {
    return GamificationAchievement(
      id: row['id'] as String? ?? '',
      title: row['title'] as String? ?? '',
      description: row['description'] as String? ?? '',
      icon: row['icon'] as String? ?? 'star',
      awardedAt: _dateFromText(row['awarded_at'] as String?),
    );
  }

  LeaderboardUser _leaderboardUserFromRow(Map<String, Object?> row) {
    return LeaderboardUser(
      id: row['id'] as int? ?? 0,
      name: row['name'] as String? ?? '',
      points: row['points'] as int? ?? 0,
      badges: row['badges'] as int? ?? 0,
      rank: row['rank'] as int? ?? 0,
      currentUser: (row['current_user'] as int? ?? 0) == 1,
    );
  }

  TimelineEventData _timelineEventFromRow(Map<String, Object?> row) {
    final raw = _jsonMap(row['raw_json'] as String?);
    if (raw.isNotEmpty) return TimelineEventData.fromJson(raw);
    return TimelineEventData(
      id: row['id'] as String? ?? '',
      title: row['title'] as String? ?? '',
      description: row['description'] as String? ?? '',
      icon: row['icon'] as String? ?? 'timeline',
      date: _dateFromText(row['event_date'] as String?),
    );
  }

  EmailSignatureBadge _emailSignatureBadgeFromRow(Map<String, Object?> row) {
    return EmailSignatureBadge(
      id: row['id'] as int? ?? 0,
      title: row['title'] as String? ?? '',
      imagePath: row['image_path'] as String? ?? '',
      publicToken: row['public_token'] as String? ?? '',
      selected: (row['selected'] as int? ?? 0) == 1,
    );
  }

  CatalogBadge _catalogBadgeFromRow(
    Map<String, Object?> row,
    List<CatalogRequirement> requirements,
    CatalogApplication? application,
  ) {
    final raw = _jsonMap(row['raw_json'] as String?);
    final durationMonths = row['duracao_meses'] as int?;
    final levelName = row['level_nome'] as String?;
    final levelOrder = row['level_ordem'] as String?;

    return CatalogBadge(
      id: row['id'] as int? ?? 0,
      title: row['nome'] as String? ?? '',
      description: row['descricao'] as String? ?? '',
      level: levelName?.isNotEmpty == true
          ? levelName!
          : levelOrder?.isNotEmpty == true
          ? 'Nível $levelOrder'
          : '',
      area: row['area_nome'] as String? ?? '',
      points: row['pontos'] as int? ?? 0,
      duration: durationMonths == null || durationMonths <= 0
          ? ''
          : '$durationMonths meses',
      type: _textValue(raw, const ['tipo']) ?? '',
      provider: _textValue(raw, const ['fornecedor']) ?? '',
      imagePath: row['imagem'] as String? ?? '',
      requirements: requirements,
      applicationStatus: application?.statusLabel ?? '',
      application: application,
    );
  }

  CatalogRequirement _catalogRequirementFromRow(Map<String, Object?> row) {
    return CatalogRequirement(
      id: row['id'] as int? ?? 0,
      title: row['nome'] as String? ?? '',
      description: row['descricao'] as String? ?? '',
    );
  }

  MyBadgeApplication _myBadgeApplicationFromRow(
    Map<String, Object?> row,
    List<ApplicationEvidence> evidences,
    List<ApplicationHistoryItem> history, {
    Map<String, Object?>? award,
  }) {
    final candidaturaRaw = _jsonMap(row['candidatura_raw_json'] as String?);
    final badgeRaw = _jsonMap(row['badge_raw_json'] as String?);
    final nestedBadge = _mapValue(candidaturaRaw, const ['Badge', 'badge']);
    final statusMap = _mapValue(candidaturaRaw, const ['status']);
    final status =
        _textValue(statusMap, const ['code']) ??
        row['estado'] as String? ??
        _textValue(candidaturaRaw, const ['estado', 'estadoId']) ??
        '';
    final statusLabel =
        _textValue(statusMap, const ['name', 'description']) ??
        _statusLabel(status);

    return MyBadgeApplication(
      id: row['candidatura_id'] as int? ?? 0,
      badgeId: row['badge_id'] as int? ?? 0,
      title:
          row['badge_nome'] as String? ??
          _textValue(nestedBadge, const ['nome']) ??
          '',
      description:
          row['badge_descricao'] as String? ??
          _textValue(nestedBadge, const ['descricao']) ??
          '',
      status: status,
      statusLabel: statusLabel,
      points:
          row['badge_pontos'] as int? ??
          _intValue(nestedBadge, const ['ponto', 'pontos']) ??
          _intValue(badgeRaw, const ['ponto', 'pontos']) ??
          0,
      imagePath:
          row['badge_imagem'] as String? ??
          _textValue(nestedBadge, const ['imagem']) ??
          '',
      evidences: evidences,
      createdAt: _dateFromText(row['candidatura_created_at'] as String?),
      updatedAt: _dateFromText(row['candidatura_updated_at'] as String?),
      obtainedAt: _dateFromText(award?['obtained_date'] as String?),
      expirationDate: _dateFromText(award?['expiration_date'] as String?),
      valid: (award?['valid'] as int? ?? 1) == 1,
      publicToken:
          _awardPublicToken(award) ??
          row['badge_public_token'] as String? ??
          _textValue(badgeRaw, const ['publicToken', 'uuid']) ??
          '',
      history: history,
    );
  }

  Future<List<ApplicationHistoryItem>> _applicationHistory(
    Database db,
    int candidaturaId,
  ) async {
    if (candidaturaId <= 0) return const [];
    final rows = await db.query(
      'historico_candidaturas',
      where: 'candidatura_id = ?',
      whereArgs: [candidaturaId],
      orderBy: 'created_at ASC, id ASC',
    );
    return rows.map((row) {
      final raw = _jsonMap(row['raw_json'] as String?);
      final responsible = _mapValue(raw, const ['responsavel']);
      final newStatus = _mapValue(raw, const ['newStatus']);
      final label =
          _textValue(newStatus, const ['name', 'code']) ??
          row['estado_novo'] as String? ??
          row['acao'] as String? ??
          'Atualização';
      return ApplicationHistoryItem(
        id: row['id'] as int? ?? 0,
        label: label,
        comment: row['comentario'] as String? ?? '',
        responsible: _textValue(responsible, const ['nome', 'name']) ?? '',
        date: _dateFromText(row['created_at'] as String?),
      );
    }).toList();
  }

  String? _awardPublicToken(Map<String, Object?>? award) {
    if (award == null) return null;
    final raw = _jsonMap(award['raw_json'] as String?);
    return _textValue(raw, const ['publicToken']) ??
        award['badge_public_token'] as String?;
  }

  Future<List<ApplicationEvidence>> _applicationEvidences(
    Database db,
    int candidaturaId,
  ) async {
    if (candidaturaId <= 0) {
      return const [];
    }

    final rows = await db.rawQuery(
      '''
      SELECT
        e.id,
        e.candidatura_id,
        e.requisito_id,
        e.url,
        e.nome_ficheiro,
        e.tipo,
        e.raw_json,
        r.nome AS requisito_nome
      FROM evidencias e
      LEFT JOIN requirements r ON r.id = e.requisito_id
      WHERE e.candidatura_id = ?
      ORDER BY e.created_at ASC, e.id ASC
      ''',
      [candidaturaId],
    );

    return rows.map(_applicationEvidenceFromRow).toList();
  }

  ApplicationEvidence _applicationEvidenceFromRow(Map<String, Object?> row) {
    final raw = _jsonMap(row['raw_json'] as String?);
    final requirement = _mapValue(raw, const ['Requirement', 'requirement']);
    final fileName =
        row['nome_ficheiro'] as String? ??
        _textValue(raw, const ['nomeFicheiro']) ??
        _textValue(raw, const ['fileName']) ??
        '';

    return ApplicationEvidence(
      id: row['id'] as int? ?? 0,
      requirementId: row['requisito_id'] as int?,
      requirementTitle:
          row['requisito_nome'] as String? ??
          _textValue(requirement, const ['titulo', 'nome']) ??
          '',
      fileName: fileName.isNotEmpty ? fileName : 'Evidência',
      url: row['url'] as String? ?? _textValue(raw, const ['url']) ?? '',
      type: row['tipo'] as String? ?? _textValue(raw, const ['tipo']) ?? '',
      validated: _boolValue(raw, const ['validado']),
    );
  }

  Map<String, dynamic> _jsonMap(String? value) {
    if (value == null || value.isEmpty) {
      return const {};
    }

    try {
      final decoded = jsonDecode(value);
      if (decoded is Map) {
        return Map<String, dynamic>.from(decoded);
      }
    } catch (_) {
      return const {};
    }

    return const {};
  }

  String? _statusCodeFromRow(Map<String, dynamic> row) {
    final status = _mapValue(row, const ['status']);
    return _textValue(status, const ['code', 'name']);
  }

  String _statusLabel(String status) {
    return switch (status.toUpperCase()) {
      'OPEN' => 'Aberta',
      'SUBMITTED' => 'Submetida',
      'IN_VALIDATION' => 'Em validação',
      'VALIDATED' => 'Validada',
      'IN_APPROVAL' => 'Em aprovação',
      'APPROVED' => 'Aprovada',
      'FECHADO_APROVADO' => 'Aprovada',
      'REJECTED' => 'Rejeitada',
      'FECHADO_REJEITADO' => 'Rejeitada',
      _ => status.isEmpty ? 'Sem estado' : status,
    };
  }

  DateTime? _dateFromText(String? value) {
    if (value == null || value.isEmpty) {
      return null;
    }

    return DateTime.tryParse(value);
  }

  List<Map<String, dynamic>> _mapsFromPayload(
    Object? payload,
    List<String> keys,
  ) {
    if (payload is List) {
      return payload
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList();
    }

    if (payload is! Map<String, dynamic>) {
      return const [];
    }

    for (final key in keys) {
      final value = _field(payload, [key]);
      if (value is List) {
        return value
            .whereType<Map>()
            .map((item) => Map<String, dynamic>.from(item))
            .toList();
      }
    }

    return const [];
  }

  Map<String, dynamic>? _mapFromPayload(Object? payload, List<String> keys) {
    if (payload is! Map<String, dynamic>) {
      return null;
    }

    for (final key in keys) {
      final value = _field(payload, [key]);
      if (value is Map) {
        return Map<String, dynamic>.from(value);
      }
    }

    return null;
  }

  String _fallbackTextId(String text, DateTime? date) {
    final normalized = text.trim().toLowerCase().replaceAll(' ', '_');
    return '${normalized}_${date?.millisecondsSinceEpoch ?? 0}';
  }

  Future<void> _upsertMaps(
    Transaction transaction, {
    required String table,
    required List<Map<String, dynamic>> maps,
    required List<String> idKeys,
    required Map<String, Object?> Function(Map<String, dynamic> row) values,
    required String syncedAt,
  }) async {
    for (final row in maps) {
      final id = _intValue(row, idKeys);
      if (id == null) {
        continue;
      }

      await transaction.insert(table, {
        'id': id,
        ...values(row),
        'raw_json': jsonEncode(row),
        'last_synced_at': syncedAt,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  Future<void> _upsertConsultantBadges(
    Transaction transaction,
    List<Map<String, dynamic>> rows,
    String syncedAt,
  ) async {
    for (final row in rows) {
      final consultorId = _intValue(row, const ['consultorId', 'CONSULTORID']);
      final badgeId = _intValue(row, const ['badgeId', 'BADGEID']);
      if (consultorId == null || badgeId == null) {
        continue;
      }

      await transaction.insert('consultant_badges', {
        'consultor_id': consultorId,
        'badge_id': badgeId,
        'obtained_date': _textValue(row, const ['obtainedDate']),
        'expiration_date': _textValue(row, const ['expirationDate']),
        'duration_months': _intValue(row, const ['durationMonths']),
        'valid': _boolIntValue(row, const ['valid']) ?? 1,
        'points_obtained': _intValue(row, const ['pointsObtained']),
        'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
        'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        'raw_json': jsonEncode(row),
        'last_synced_at': syncedAt,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  Future<void> _upsertConsultantPremiumBadges(
    Transaction transaction,
    List<Map<String, dynamic>> rows,
    String syncedAt,
  ) async {
    for (final row in rows) {
      final badgePremiumId = _intValue(row, const [
        'badgePremiumId',
        'BADGEPREMIUMID',
        'id',
      ]);
      final consultorId = _intValue(row, const ['consultorId', 'CONSULTORID']);
      if (badgePremiumId == null || consultorId == null) {
        continue;
      }

      await transaction.insert('consultant_premium_badges', {
        'badge_premium_id': badgePremiumId,
        'consultor_id': consultorId,
        'achievement_date': _textValue(row, const ['achievementDate']),
        'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
        'raw_json': jsonEncode(row),
        'last_synced_at': syncedAt,
      }, conflictAlgorithm: ConflictAlgorithm.replace);
    }
  }

  List<Map<String, dynamic>> _collectMaps(
    Object? payload,
    Set<String> collectionKeys,
  ) {
    final collected = <Map<String, dynamic>>[];
    final seen = <Map<Object?, Object?>>{};

    void collect(Object? value, String? parentKey) {
      if (value is Map) {
        final normalized = Map<String, dynamic>.from(value);
        if (parentKey != null &&
            collectionKeys.contains(parentKey) &&
            seen.add(value)) {
          collected.add(normalized);
        }

        for (final entry in value.entries) {
          collect(entry.value, entry.key.toString());
        }
      } else if (value is List) {
        for (final item in value) {
          collect(item, parentKey);
        }
      }
    }

    collect(payload, null);
    return collected;
  }

  bool _payloadHasCollection(Object? payload, List<String> keys) {
    if (payload is! Map<String, dynamic>) {
      return payload is List;
    }

    for (final key in keys) {
      if (_field(payload, [key]) is List) {
        return true;
      }
    }

    return false;
  }

  Object? _field(Map<String, dynamic> row, List<String> keys) {
    for (final key in keys) {
      if (row.containsKey(key)) {
        return row[key];
      }
    }

    final lowerCaseKeys = {
      for (final entry in row.entries) entry.key.toLowerCase(): entry.value,
    };
    for (final key in keys) {
      final value = lowerCaseKeys[key.toLowerCase()];
      if (value != null) {
        return value;
      }
    }

    return null;
  }

  Map<String, dynamic> _mapValue(Map<String, dynamic> row, List<String> keys) {
    final value = _field(row, keys);
    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return const {};
  }

  String? _textValue(Map<String, dynamic> row, List<String> keys) {
    final value = _field(row, keys);
    if (value == null) {
      return null;
    }

    return value.toString();
  }

  int? _intValue(Map<String, dynamic> row, List<String> keys) {
    final value = _field(row, keys);
    if (value is int) {
      return value;
    }
    if (value is num) {
      return value.toInt();
    }
    if (value is String) {
      return int.tryParse(value);
    }

    return null;
  }

  int? _boolIntValue(Map<String, dynamic> row, List<String> keys) {
    final value = _field(row, keys);
    if (value is bool) {
      return value ? 1 : 0;
    }
    if (value is num) {
      return value == 0 ? 0 : 1;
    }
    if (value is String) {
      final normalized = value.toLowerCase();
      if (normalized == 'true' || normalized == '1') {
        return 1;
      }
      if (normalized == 'false' || normalized == '0') {
        return 0;
      }
    }

    return null;
  }

  bool? _boolValue(Map<String, dynamic> row, List<String> keys) {
    final value = _boolIntValue(row, keys);
    if (value == null) {
      return null;
    }

    return value == 1;
  }

  String? _firstListTextValue(Map<String, dynamic> row, List<String> keys) {
    final value = _field(row, keys);
    if (value is List && value.isNotEmpty) {
      return value.first.toString();
    }

    return null;
  }
}

class LocalUserProfile {
  const LocalUserProfile({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
    required this.mustChangePassword,
  });

  final int id;
  final String name;
  final String email;
  final String role;
  final bool mustChangePassword;
}
