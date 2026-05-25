class DashboardData {
  const DashboardData({
    required this.userName,
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

  DashboardData copyWith({bool? loadedFromCache}) {
    return DashboardData(
      userName: userName,
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
    final recommendationsJson = json['recommendations'] as List<dynamic>? ?? [];

    return DashboardData(
      userName: json['userName'] as String? ?? '',
      greeting: json['greeting'] as String? ?? 'Boa noite,',
      totalPoints: json['totalPoints'] as int? ?? 0,
      learningPathTitle:
          json['learningPathTitle'] as String? ?? 'Learning Path',
      learningPathProgress:
          (json['learningPathProgress'] as num?)?.toDouble() ?? 0,
      noticeTitle: json['noticeTitle'] as String? ?? '',
      noticeMessage: json['noticeMessage'] as String? ?? '',
      specialAchievementTitle: json['specialAchievementTitle'] as String? ?? '',
      specialAchievementMessage:
          json['specialAchievementMessage'] as String? ?? '',
      recommendations: recommendationsJson
          .map(
            (item) => BadgeRecommendation.fromJson(
              Map<String, dynamic>.from(item as Map),
            ),
          )
          .toList(),
      badgesWon: json['badgesWon'] as int? ?? 0,
      inProgress: json['inProgress'] as int? ?? 0,
      ranking: json['ranking'] as int? ?? 0,
    );
  }

  factory DashboardData.sample() {
    return const DashboardData(
      userName: 'Rafael Silva',
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
    final prerequisitesJson = json['prerequisites'] as List<dynamic>? ?? [];

    return BadgeRecommendation(
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      level: json['level'] as String? ?? '',
      tag: json['tag'] as String? ?? '',
      points: json['points'] as int? ?? 0,
      duration: json['duration'] as String? ?? '',
      prerequisites: prerequisitesJson.map((item) => item.toString()).toList(),
      iconName: json['iconName'] as String? ?? 'badge',
    );
  }
}
