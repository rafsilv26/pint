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
        version: 1,
        onCreate: _createDatabase,
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
    await db.execute('''
      CREATE TABLE dashboard (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        user_name TEXT NOT NULL,
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
      CREATE TABLE badge_recommendations (
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
      await transaction.insert(
        'dashboard',
        {
          'id': 1,
          'user_name': data.userName,
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
        },
        conflictAlgorithm: ConflictAlgorithm.replace,
      );

      for (final recommendation in data.recommendations) {
        await transaction.insert(
          'badge_recommendations',
          {
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
          },
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
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

    final dashboard = dashboardRows.first;
    return DashboardData(
      userName: dashboard['user_name'] as String,
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
      recommendations: recommendationRows.map(_recommendationFromRow).toList(),
    );
  }

  bool get _useMemoryStore {
    return WidgetsBinding.instance.runtimeType
            .toString()
            .contains('TestWidgetsFlutterBinding') ||
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
}
