import 'consultant_profile.dart';

class ConsultantsDirectoryData {
  const ConsultantsDirectoryData({
    required this.consultants,
    required this.stats,
    this.loadedFromCache = false,
  });

  final List<ConsultantProfile> consultants;
  final ConsultantsDirectoryStats stats;
  final bool loadedFromCache;

  factory ConsultantsDirectoryData.empty({bool loadedFromCache = false}) {
    return ConsultantsDirectoryData(
      consultants: const [],
      stats: const ConsultantsDirectoryStats(
        consultants: 0,
        badgesTotal: 0,
        specialsTotal: 0,
      ),
      loadedFromCache: loadedFromCache,
    );
  }
}

class ConsultantsDirectoryStats {
  const ConsultantsDirectoryStats({
    required this.consultants,
    required this.badgesTotal,
    required this.specialsTotal,
  });

  final int consultants;
  final int badgesTotal;
  final int specialsTotal;
}

class ConsultantDetailData {
  const ConsultantDetailData({
    required this.consultant,
    required this.badges,
    required this.achievements,
    required this.stats,
    this.loadedFromCache = false,
  });

  final ConsultantProfile consultant;
  final List<ConsultantAwardedBadge> badges;
  final List<ConsultantSpecialAchievement> achievements;
  final ConsultantActivityStats stats;
  final bool loadedFromCache;

  factory ConsultantDetailData.empty({
    required ConsultantProfile consultant,
    bool loadedFromCache = false,
  }) {
    return ConsultantDetailData(
      consultant: consultant,
      badges: const [],
      achievements: const [],
      stats: ConsultantActivityStats.fromTotals(
        points: consultant.points,
        badges: consultant.badges,
        achievements: consultant.specials,
      ),
      loadedFromCache: loadedFromCache,
    );
  }
}

class ConsultantAwardedBadge {
  const ConsultantAwardedBadge({
    required this.badgeId,
    required this.title,
    required this.level,
    required this.points,
    required this.imagePath,
    this.obtainedAt,
    this.valid = true,
  });

  final int badgeId;
  final String title;
  final String level;
  final int points;
  final String imagePath;
  final DateTime? obtainedAt;
  final bool valid;
}

class ConsultantSpecialAchievement {
  const ConsultantSpecialAchievement({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    this.awardedAt,
  });

  final int id;
  final String title;
  final String description;
  final String icon;
  final DateTime? awardedAt;
}

class ConsultantActivityStats {
  const ConsultantActivityStats({
    required this.completionRate,
    required this.monthlyGrowthPercent,
    required this.activityDays,
    required this.points,
    required this.badges,
    required this.achievements,
  });

  final double completionRate;
  final int monthlyGrowthPercent;
  final int activityDays;
  final int points;
  final int badges;
  final int achievements;

  factory ConsultantActivityStats.fromTotals({
    required int points,
    required int badges,
    required int achievements,
    int totalAvailableBadges = 0,
    int recentPoints = 0,
    int activityDays = 0,
  }) {
    final completionRate = totalAvailableBadges <= 0
        ? 0.0
        : (badges / totalAvailableBadges).clamp(0.0, 1.0).toDouble();
    final monthlyGrowthPercent = points <= 0
        ? 0
        : ((recentPoints / points) * 100).round();

    return ConsultantActivityStats(
      completionRate: completionRate,
      monthlyGrowthPercent: monthlyGrowthPercent,
      activityDays: activityDays,
      points: points,
      badges: badges,
      achievements: achievements,
    );
  }
}

class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.read,
    required this.createdAt,
    this.readAt,
  });

  final String id;
  final String title;
  final String message;
  final String type;
  final bool read;
  final DateTime? createdAt;
  final DateTime? readAt;

  bool get unread => !read;

  AppNotification copyWith({bool? read, DateTime? readAt}) {
    return AppNotification(
      id: id,
      title: title,
      message: message,
      type: type,
      read: read ?? this.read,
      createdAt: createdAt,
      readAt: readAt ?? this.readAt,
    );
  }

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id:
          _textValue(json, const ['noticeId', 'id', 'notificationId']) ??
          _textValue(json, const ['createdAt']) ??
          '',
      title: _textValue(json, const ['title', 'titulo']) ?? '',
      message: _textValue(json, const ['message', 'mensagem', 'body']) ?? '',
      type: _textValue(json, const ['type', 'tipo']) ?? 'info',
      read: _boolValue(json, const ['read', 'lida']) ?? false,
      createdAt: _dateValue(json, const ['createdAt', 'created_at']),
      readAt: _dateValue(json, const ['readAt', 'read_at']),
    );
  }
}

class GamificationData {
  const GamificationData({
    required this.summary,
    required this.achievements,
    required this.ranking,
    required this.timeline,
    this.loadedFromCache = false,
  });

  final GamificationSummary summary;
  final List<GamificationAchievement> achievements;
  final List<LeaderboardUser> ranking;
  final List<TimelineEventData> timeline;
  final bool loadedFromCache;

  factory GamificationData.empty({bool loadedFromCache = false}) {
    return GamificationData(
      summary: const GamificationSummary(rank: 0, points: 0, badges: 0),
      achievements: const [],
      ranking: const [],
      timeline: const [],
      loadedFromCache: loadedFromCache,
    );
  }
}

class GamificationSummary {
  const GamificationSummary({
    required this.rank,
    required this.points,
    required this.badges,
  });

  final int rank;
  final int points;
  final int badges;

  factory GamificationSummary.fromJson(Map<String, dynamic> json) {
    return GamificationSummary(
      rank: _intValue(json, const ['rank', 'ranking']) ?? 0,
      points: _intValue(json, const ['points', 'pontos']) ?? 0,
      badges: _intValue(json, const ['badges']) ?? 0,
    );
  }
}

class GamificationAchievement {
  const GamificationAchievement({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    this.awardedAt,
  });

  final String id;
  final String title;
  final String description;
  final String icon;
  final DateTime? awardedAt;

  factory GamificationAchievement.fromJson(Map<String, dynamic> json) {
    return GamificationAchievement(
      id: _textValue(json, const ['id', 'badgePremiumId']) ?? '',
      title: _textValue(json, const ['title', 'name', 'nome']) ?? '',
      description: _textValue(json, const ['description', 'descricao']) ?? '',
      icon: _textValue(json, const ['icon', 'icone']) ?? 'star',
      awardedAt: _dateValue(json, const ['awardedAt', 'createdAt']),
    );
  }
}

class LeaderboardUser {
  const LeaderboardUser({
    required this.id,
    required this.name,
    required this.points,
    required this.badges,
    required this.rank,
    this.currentUser = false,
  });

  final int id;
  final String name;
  final int points;
  final int badges;
  final int rank;
  final bool currentUser;

  factory LeaderboardUser.fromJson(Map<String, dynamic> json) {
    return LeaderboardUser(
      id: _intValue(json, const ['id', 'consultorId']) ?? 0,
      name: _textValue(json, const ['name', 'nome']) ?? '',
      points: _intValue(json, const ['points', 'pontos']) ?? 0,
      badges: _intValue(json, const ['badges']) ?? 0,
      rank: _intValue(json, const ['rank', 'ranking']) ?? 0,
      currentUser:
          _boolValue(json, const ['currentUser', 'isCurrentUser']) ?? false,
    );
  }
}

class TimelineEventData {
  const TimelineEventData({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
    this.date,
    this.completionDate,
    this.status = '',
    this.priority = 3,
  });

  final String id;
  final String title;
  final String description;
  final String icon;
  final DateTime? date;
  final DateTime? completionDate;
  final String status;
  final int priority;

  bool get completed =>
      completionDate != null || status.toLowerCase().contains('conclu');
  bool get overdue =>
      !completed && date != null && date!.isBefore(DateTime.now());

  factory TimelineEventData.fromJson(Map<String, dynamic> json) {
    final title =
        _textValue(json, const ['title', 'titulo', 'name', 'nome']) ??
        _textValue(json, const ['event', 'acao']) ??
        '';
    final date = _dateValue(json, const [
      'expectedDate',
      'startDate',
      'createdAt',
      'date',
    ]);
    return TimelineEventData(
      id:
          _textValue(json, const ['id', 'timelineId']) ??
          '$title-${date?.toIso8601String() ?? ''}',
      title: title,
      description:
          _textValue(json, const ['description', 'descricao', 'details']) ?? '',
      icon: _textValue(json, const ['icon', 'type', 'tipo']) ?? 'timeline',
      date: date,
      completionDate: _dateValue(json, const ['completionDate']),
      status: _textValue(json, const ['status', 'estado']) ?? '',
      priority: _intValue(json, const ['priority', 'prioridade']) ?? 3,
    );
  }
}

class EmailSignatureData {
  const EmailSignatureData({
    required this.profile,
    required this.badges,
    required this.templateHtml,
    this.loadedFromCache = false,
  });

  final EmailSignatureProfile profile;
  final List<EmailSignatureBadge> badges;
  final String templateHtml;
  final bool loadedFromCache;

  factory EmailSignatureData.empty({bool loadedFromCache = false}) {
    return EmailSignatureData(
      profile: const EmailSignatureProfile(
        name: '',
        email: '',
        role: 'Consultor',
        website: 'www.softinsa.pt',
      ),
      badges: const [],
      templateHtml: '',
      loadedFromCache: loadedFromCache,
    );
  }
}

class EmailSignatureProfile {
  const EmailSignatureProfile({
    required this.name,
    required this.email,
    required this.role,
    required this.website,
  });

  final String name;
  final String email;
  final String role;
  final String website;

  factory EmailSignatureProfile.fromJson(Map<String, dynamic> json) {
    return EmailSignatureProfile(
      name: _textValue(json, const ['name', 'nome']) ?? '',
      email: _textValue(json, const ['email']) ?? '',
      role: _textValue(json, const ['role']) ?? 'Consultor',
      website: _textValue(json, const ['website']) ?? 'www.softinsa.pt',
    );
  }
}

class EmailSignatureBadge {
  const EmailSignatureBadge({
    required this.id,
    required this.title,
    required this.imagePath,
    required this.publicToken,
    this.selected = false,
  });

  final int id;
  final String title;
  final String imagePath;
  final String publicToken;
  final bool selected;

  EmailSignatureBadge copyWith({bool? selected}) {
    return EmailSignatureBadge(
      id: id,
      title: title,
      imagePath: imagePath,
      publicToken: publicToken,
      selected: selected ?? this.selected,
    );
  }

  factory EmailSignatureBadge.fromJson(Map<String, dynamic> json) {
    return EmailSignatureBadge(
      id: _intValue(json, const ['id', 'badgeId']) ?? 0,
      title: _textValue(json, const ['title', 'nome']) ?? '',
      imagePath: _textValue(json, const ['imagePath', 'imagem']) ?? '',
      publicToken: _textValue(json, const ['publicToken', 'uuid']) ?? '',
      selected: _boolValue(json, const ['selected']) ?? false,
    );
  }
}

class CatalogBadge {
  const CatalogBadge({
    required this.id,
    required this.title,
    required this.description,
    required this.level,
    required this.area,
    required this.points,
    required this.duration,
    required this.type,
    required this.provider,
    required this.imagePath,
    required this.requirements,
    this.applicationStatus = '',
    this.application,
  });

  final int id;
  final String title;
  final String description;
  final String level;
  final String area;
  final int points;
  final String duration;
  final String type;
  final String provider;
  final String imagePath;
  final List<CatalogRequirement> requirements;
  final String applicationStatus;
  final CatalogApplication? application;

  bool get hasApplication => applicationStatus.isNotEmpty;
}

class CatalogApplication {
  const CatalogApplication({
    required this.id,
    required this.status,
    required this.statusLabel,
    required this.evidences,
  });

  final int id;
  final String status;
  final String statusLabel;
  final List<ApplicationEvidence> evidences;
}

class CatalogRequirement {
  const CatalogRequirement({
    required this.id,
    required this.title,
    this.description = '',
  });

  final int id;
  final String title;
  final String description;

  String get displayText {
    if (description.trim().isEmpty) {
      return title;
    }

    return '$title\n$description';
  }
}

class EvidenceAttachment {
  const EvidenceAttachment({
    required this.requirementId,
    required this.path,
    required this.fileName,
  });

  final int requirementId;
  final String path;
  final String fileName;
}

class ApplicationEvidence {
  const ApplicationEvidence({
    required this.id,
    required this.fileName,
    required this.url,
    required this.type,
    this.requirementId,
    this.requirementTitle = '',
    this.validated,
  });

  final int id;
  final int? requirementId;
  final String requirementTitle;
  final String fileName;
  final String url;
  final String type;
  final bool? validated;

  bool get hasUrl => url.trim().isNotEmpty;
}

class MyBadgeApplication {
  const MyBadgeApplication({
    required this.id,
    required this.badgeId,
    required this.title,
    required this.description,
    required this.status,
    required this.statusLabel,
    required this.points,
    required this.imagePath,
    this.evidences = const [],
    this.createdAt,
    this.updatedAt,
    this.obtainedAt,
    this.expirationDate,
    this.valid = true,
    this.publicToken = '',
    this.history = const [],
  });

  final int id;
  final int badgeId;
  final String title;
  final String description;
  final String status;
  final String statusLabel;
  final int points;
  final String imagePath;
  final List<ApplicationEvidence> evidences;
  final DateTime? createdAt;
  final DateTime? updatedAt;
  final DateTime? obtainedAt;
  final DateTime? expirationDate;
  final bool valid;
  final String publicToken;
  final List<ApplicationHistoryItem> history;

  bool get isApproved {
    final normalized = status.toUpperCase();
    return normalized == 'APPROVED' || normalized == 'FECHADO_APROVADO';
  }

  bool get isRejected {
    final normalized = status.toUpperCase();
    return normalized == 'REJECTED' || normalized == 'FECHADO_REJEITADO';
  }

  bool get isAwarded => obtainedAt != null || isApproved;

  int? get daysUntilExpiration {
    if (expirationDate == null) return null;
    return expirationDate!.difference(DateTime.now()).inDays;
  }

  bool get isExpired =>
      !valid || (daysUntilExpiration != null && daysUntilExpiration! < 0);
  bool get isExpiringSoon =>
      !isExpired && daysUntilExpiration != null && daysUntilExpiration! <= 90;
}

class ApplicationHistoryItem {
  const ApplicationHistoryItem({
    required this.id,
    required this.label,
    required this.comment,
    this.responsible = '',
    this.date,
  });

  final int id;
  final String label;
  final String comment;
  final String responsible;
  final DateTime? date;
}

Object? _field(Map<String, dynamic> json, List<String> keys) {
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

String? _textValue(Map<String, dynamic> json, List<String> keys) {
  final value = _field(json, keys);
  return value?.toString();
}

int? _intValue(Map<String, dynamic> json, List<String> keys) {
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

bool? _boolValue(Map<String, dynamic> json, List<String> keys) {
  final value = _field(json, keys);
  if (value is bool) {
    return value;
  }
  if (value is num) {
    return value != 0;
  }
  if (value is String) {
    final normalized = value.toLowerCase();
    if (normalized == 'true' || normalized == '1') {
      return true;
    }
    if (normalized == 'false' || normalized == '0') {
      return false;
    }
  }

  return null;
}

DateTime? _dateValue(Map<String, dynamic> json, List<String> keys) {
  final value = _field(json, keys);
  if (value == null) {
    return null;
  }

  return DateTime.tryParse(value.toString());
}
