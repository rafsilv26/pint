class DashboardData {
  const DashboardData({
    required this.userName,
    required this.userRole,
    required this.greeting,
    required this.totalPoints,
    required this.learningPathTitle,
    required this.learningPathProgress,
    required this.noticeTitle,
    required this.noticeMessage,
    required this.specialAchievementTitle,
    required this.specialAchievementMessage,
    required this.recommendations,
    required this.badgesWon,
    required this.inProgress,
    required this.ranking,
    this.loadedFromCache = false,
  });

  final String userName;
  final String userRole;
  final String greeting;
  final int totalPoints;
  final String learningPathTitle;
  final double learningPathProgress;
  final String noticeTitle;
  final String noticeMessage;
  final String specialAchievementTitle;
  final String specialAchievementMessage;
  final List<BadgeRecommendation> recommendations;
  final int badgesWon;
  final int inProgress;
  final int ranking;
  final bool loadedFromCache;

  DashboardData copyWith({
    String? userName,
    String? userRole,
    bool? loadedFromCache,
  }) {
    return DashboardData(
      userName: userName ?? this.userName,
      userRole: userRole ?? this.userRole,
      greeting: greeting,
      totalPoints: totalPoints,
      learningPathTitle: learningPathTitle,
      learningPathProgress: learningPathProgress,
      noticeTitle: noticeTitle,
      noticeMessage: noticeMessage,
      specialAchievementTitle: specialAchievementTitle,
      specialAchievementMessage: specialAchievementMessage,
      recommendations: recommendations,
      badgesWon: badgesWon,
      inProgress: inProgress,
      ranking: ranking,
      loadedFromCache: loadedFromCache ?? this.loadedFromCache,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'userName': userName,
      'userRole': userRole,
      'greeting': greeting,
      'totalPoints': totalPoints,
      'learningPathTitle': learningPathTitle,
      'learningPathProgress': learningPathProgress,
      'noticeTitle': noticeTitle,
      'noticeMessage': noticeMessage,
      'specialAchievementTitle': specialAchievementTitle,
      'specialAchievementMessage': specialAchievementMessage,
      'recommendations': recommendations
          .map((badge) => badge.toJson())
          .toList(),
      'badgesWon': badgesWon,
      'inProgress': inProgress,
      'ranking': ranking,
    };
  }

  factory DashboardData.fromJson(Map<String, dynamic> json) {
    final recommendationsJson = _listValue(json, const [
      'recommendations',
      'badgeRecommendations',
      'badges',
    ]);

    return DashboardData(
      userName: _textValue(json, const ['userName', 'user_name', 'nome']) ?? '',
      userRole: _textValue(json, const ['userRole', 'user_role', 'role']) ?? '',
      greeting: _textValue(json, const ['greeting']) ?? 'Boa noite,',
      totalPoints:
          _intValue(json, const [
            'totalPoints',
            'total_points',
            'totalPontos',
          ]) ??
          0,
      learningPathTitle:
          _textValue(json, const [
            'learningPathTitle',
            'learning_path_title',
          ]) ??
          'Learning Path',
      learningPathProgress:
          _doubleValue(json, const [
            'learningPathProgress',
            'learning_path_progress',
          ]) ??
          0,
      noticeTitle:
          _textValue(json, const ['noticeTitle', 'notice_title']) ?? '',
      noticeMessage:
          _textValue(json, const ['noticeMessage', 'notice_message']) ?? '',
      specialAchievementTitle:
          _textValue(json, const [
            'specialAchievementTitle',
            'special_achievement_title',
          ]) ??
          '',
      specialAchievementMessage:
          _textValue(json, const [
            'specialAchievementMessage',
            'special_achievement_message',
          ]) ??
          '',
      recommendations: recommendationsJson
          .map(
            (item) => BadgeRecommendation.fromJson(
              Map<String, dynamic>.from(item as Map),
            ),
          )
          .toList(),
      badgesWon: _intValue(json, const ['badgesWon', 'badges_won']) ?? 0,
      inProgress: _intValue(json, const ['inProgress', 'in_progress']) ?? 0,
      ranking: _intValue(json, const ['ranking']) ?? 0,
    );
  }

  static Object? _field(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      if (json.containsKey(key)) {
        return json[key];
      }
    }

    final lowerCaseKeys = {
      for (final entry in json.entries) entry.key.toLowerCase(): entry.value,
    };
    for (final key in keys) {
      final value = lowerCaseKeys[key.toLowerCase()];
      if (value != null) {
        return value;
      }
    }

    return null;
  }

  static String? _textValue(Map<String, dynamic> json, List<String> keys) {
    return _field(json, keys)?.toString();
  }

  static int? _intValue(Map<String, dynamic> json, List<String> keys) {
    final value = _field(json, keys);
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

  static double? _doubleValue(Map<String, dynamic> json, List<String> keys) {
    final value = _field(json, keys);
    if (value is num) {
      return value.toDouble();
    }
    if (value is String) {
      return double.tryParse(value);
    }

    return null;
  }

  static List<dynamic> _listValue(
    Map<String, dynamic> json,
    List<String> keys,
  ) {
    final value = _field(json, keys);
    if (value is List) {
      return value;
    }

    return const [];
  }

  factory DashboardData.sample() {
    return const DashboardData(
      userName: 'Rafael Silva',
      userRole: 'Consultor',
      greeting: 'Boa noite,',
      totalPoints: 1250,
      learningPathTitle: 'Learning Path: Jornada Técnica',
      learningPathProgress: 0.65,
      noticeTitle: 'Informações',
      noticeMessage:
          'O badge AWS Cloud Practitioner expira em 30 dias. Renove a sua certificação.',
      specialAchievementTitle: 'Conquistas especiais',
      specialAchievementMessage: '3 novas conquistas desbloqueadas!',
      badgesWon: 8,
      inProgress: 3,
      ranking: 12,
      recommendations: [
        BadgeRecommendation(
          title: 'OutSystems Advanced',
          description: 'Próximo Nível do OutSystems que já completou',
          level: 'Nível B',
          tag: 'Próximo Nível',
          points: 200,
          duration: '2-3 meses',
          prerequisites: ['OutSystems Nível A completado'],
          iconName: 'outsystems',
        ),
        BadgeRecommendation(
          title: 'Azure Fundamentals AZ-900',
          description: 'Recomendado para a sua Service Line: Hybrid Cloud',
          level: 'Nível A',
          tag: '',
          points: 100,
          duration: '1-2 meses',
          prerequisites: [],
          iconName: 'cloud',
        ),
        BadgeRecommendation(
          title: 'Azure Developer AZ-204',
          description: 'Próximo passo após Azure Fundamentals',
          level: 'Nível B',
          tag: 'Próximo Nível',
          points: 250,
          duration: '3-4 meses',
          prerequisites: ['Azure Fundamentals completado'],
          iconName: 'cloud',
        ),
        BadgeRecommendation(
          title: 'Kubernetes Administra',
          description: 'Complementa as suas skills de cloud',
          level: 'Nível B',
          tag: 'Relacionado',
          points: 200,
          duration: '2-3 meses',
          prerequisites: [],
          iconName: 'kubernetes',
        ),
      ],
    );
  }
}

class BadgeRecommendation {
  const BadgeRecommendation({
    required this.title,
    required this.description,
    required this.level,
    required this.tag,
    required this.points,
    required this.duration,
    required this.prerequisites,
    required this.iconName,
  });

  final String title;
  final String description;
  final String level;
  final String tag;
  final int points;
  final String duration;
  final List<String> prerequisites;
  final String iconName;

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'level': level,
      'tag': tag,
      'points': points,
      'duration': duration,
      'prerequisites': prerequisites,
      'iconName': iconName,
    };
  }

  factory BadgeRecommendation.fromJson(Map<String, dynamic> json) {
    final prerequisitesJson = _listValue(json, const [
      'prerequisites',
      'requisitos',
    ]);

    return BadgeRecommendation(
      title: _textValue(json, const ['title', 'nome']) ?? '',
      description: _textValue(json, const ['description', 'descricao']) ?? '',
      level: _textValue(json, const ['level', 'nivel', 'ordem']) ?? '',
      tag: _textValue(json, const ['tag', 'tipo']) ?? '',
      points: _intValue(json, const ['points', 'pontos']) ?? 0,
      prerequisites: prerequisitesJson.map((item) => item.toString()).toList(),
      duration: _textValue(json, const ['duration', 'duracao']) ?? '',
      iconName: _textValue(json, const ['iconName', 'imagem']) ?? 'badge',
    );
  }

  static Object? _field(Map<String, dynamic> json, List<String> keys) {
    for (final key in keys) {
      if (json.containsKey(key)) {
        return json[key];
      }
    }

    final lowerCaseKeys = {
      for (final entry in json.entries) entry.key.toLowerCase(): entry.value,
    };
    for (final key in keys) {
      final value = lowerCaseKeys[key.toLowerCase()];
      if (value != null) {
        return value;
      }
    }

    return null;
  }

  static String? _textValue(Map<String, dynamic> json, List<String> keys) {
    return _field(json, keys)?.toString();
  }

  static int? _intValue(Map<String, dynamic> json, List<String> keys) {
    final value = _field(json, keys);
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

  static List<dynamic> _listValue(
    Map<String, dynamic> json,
    List<String> keys,
  ) {
    final value = _field(json, keys);
    if (value is List) {
      return value;
    }

    return const [];
  }
}
