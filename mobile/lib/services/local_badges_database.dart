import 'dart:convert';
import 'dart:io' show Platform;

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:path/path.dart' as path;
import 'package:sqflite/sqflite.dart';

import '../models/dashboard_data.dart';

class LocalBadgesDatabase {
  LocalBadgesDatabase._();

  static final LocalBadgesDatabase instance = LocalBadgesDatabase._();

  Database? _database;
  DashboardData? _memoryDashboard;

  static const int _databaseVersion = 3;

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
          'level_id': _intValue(row, const ['levelId', 'NIVELID']),
          'nome': _textValue(row, const ['nome', 'NOME', 'title']),
          'descricao': _textValue(row, const ['descricao', 'DESCRICAO']),
          'imagem': _textValue(row, const ['imagem', 'IMAGEM', 'iconName']),
          'pontos': _intValue(row, const ['pontos', 'PONTO', 'points']),
          'uuid': _textValue(row, const ['uuid', 'PUBLIC_TOKEN', 'SLUG']),
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
          'level_id': _intValue(row, const ['levelId', 'NIVELID']),
          'nome': _textValue(row, const ['nome', 'NOME', 'TITULO']),
          'descricao': _textValue(row, const ['descricao', 'DESCRICAO']),
          'tipo': _textValue(row, const ['tipo', 'TIPO']),
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
          'estado': _textValue(row, const ['estado', 'ESTADOID']),
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
          'created_at': _textValue(row, const ['createdAt', 'CREATED_AT']),
          'updated_at': _textValue(row, const ['updatedAt', 'UPDATED_AT']),
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
