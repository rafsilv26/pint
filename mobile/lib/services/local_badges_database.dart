import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:path/path.dart' as path;
import 'package:sqflite/sqflite.dart';

import '../models/consultant_profile.dart';
import '../models/dashboard_data.dart';
import '../models/mobile_api_data.dart';

class LocalBadgesDatabase {
  LocalBadgesDatabase._();

  static final LocalBadgesDatabase instance = LocalBadgesDatabase._();

  Database? _database;
  DashboardData? _memoryDashboard;

  static const int _databaseVersion = 4;

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
    if (kIsWeb) {
      throw UnsupportedError('A base de dados local nao suporta Web.');
    }

    if (Platform.isAndroid || Platform.isIOS) {
      return databaseFactory;
    }

    throw UnsupportedError('A base de dados SQLite e usada apenas em mobile.');
  }

  Future<String> _databasePath(DatabaseFactory factory) async {
    final databasesPath = await factory.getDatabasesPath();
    return path.join(databasesPath, 'softinsa_badges.db');
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

    await _createMobileFeatureTables(db);
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

  Future<void> upsertDashboard(
    DashboardData data, {
    DateTime? updatedAt,
  }) async {
    if (_useMemoryStore) {
      _memoryDashboard = _mergeMemoryDashboard(data);
      return;
    }

    final db = await database;
    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();

    await db.transaction((transaction) async {
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
    });
  }

  Future<void> upsertApiSnapshot(Object? payload, {DateTime? updatedAt}) async {
    if (payload == null || _useMemoryStore) {
      return;
    }

    final db = await database;
    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();

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

      await _upsertMaps(
        transaction,
        table: 'candidaturas',
        maps: _collectMaps(payload, const {
          'candidaturas',
          'candidatura',
          'Candidatura',
        }),
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
        maps: _collectMaps(payload, const {
          'evidencias',
          'evidencia',
          'Evidencia',
        }),
        idKeys: const ['id', 'evidenciaId', 'EVIDENCIAID'],
        values: (row) => {
          'candidatura_id': _intValue(row, const [
            'candidaturaId',
            'CANDIDATURAID',
          ]),
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
        maps: _collectMaps(payload, const {
          'historico',
          'historicos',
          'HistoricoCandidatura',
          'HistoricoCandidaturas',
        }),
        idKeys: const ['id', 'historicoId', 'LOGWF_ID'],
        values: (row) => {
          'candidatura_id': _intValue(row, const [
            'candidaturaId',
            'CANDIDATURAID',
          ]),
          'user_id': _intValue(row, const ['userId', 'USERID']),
          'estado_anterior': _textValue(row, const [
            'estadoAnterior',
            'ANTIGO_ESTADOID',
          ]),
          'estado_novo': _textValue(row, const ['estadoNovo', 'NOVO_ESTADOID']),
          'comentario': _textValue(row, const ['comentario', 'MOTIVO']),
          'acao': _textValue(row, const ['acao']),
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
        },
        syncedAt: timestamp,
      );
    });
  }

  Future<void> upsertCurrentUser(
    Map<String, dynamic> user, {
    DateTime? updatedAt,
  }) async {
    if (_useMemoryStore) {
      return;
    }

    final id = _intValue(user, const ['id', 'USERID']);
    if (id == null) {
      return;
    }

    final db = await database;
    final timestamp = (updatedAt ?? DateTime.now()).toUtc().toIso8601String();
    final role =
        _textValue(user, const ['role']) ??
        _firstListTextValue(user, const ['roles']);

    await db.transaction((transaction) async {
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
      return ConsultantsDirectoryData(
        consultants: ConsultantProfile.samples(),
        stats: const ConsultantsDirectoryStats(
          consultants: 10,
          badgesTotal: 79,
          specialsTotal: 14,
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
      return ConsultantProfile.samples().first;
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

  Future<List<CatalogBadge>> getCatalogBadges() async {
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
          requirements: badge.prerequisites,
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
    final applicationRows = await db.query(
      'candidaturas',
      orderBy: 'updated_at DESC, created_at DESC',
    );
    final applicationByBadgeId = <int, String>{};
    for (final row in applicationRows) {
      final badgeId = row['badge_id'] as int?;
      if (badgeId == null || applicationByBadgeId.containsKey(badgeId)) {
        continue;
      }
      applicationByBadgeId[badgeId] = _statusLabel(
        row['estado'] as String? ?? '',
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
          requirementRows
              .map((item) => item['nome'] as String? ?? '')
              .where((item) => item.isNotEmpty)
              .toList(),
          applicationByBadgeId[row['id'] as int? ?? 0] ?? '',
        ),
      );
    }

    return result;
  }

  Future<List<MyBadgeApplication>> getMyBadgeApplications() async {
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
    final rows = await db.rawQuery('''
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
      ORDER BY c.updated_at DESC, c.created_at DESC
    ''');

    return rows.map(_myBadgeApplicationFromRow).toList();
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
      return null;
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
    );
  }

  bool get _useMemoryStore {
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
    List<String> requirements,
    String applicationStatus,
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
      applicationStatus: applicationStatus,
    );
  }

  MyBadgeApplication _myBadgeApplicationFromRow(Map<String, Object?> row) {
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
      createdAt: _dateFromText(row['candidatura_created_at'] as String?),
      updatedAt: _dateFromText(row['candidatura_updated_at'] as String?),
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
  });

  final int id;
  final String name;
  final String email;
  final String role;
}
