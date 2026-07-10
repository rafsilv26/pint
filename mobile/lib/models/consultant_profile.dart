class ConsultantProfile {
  const ConsultantProfile({
    this.id,
    required this.name,
    required this.role,
    required this.area,
    this.serviceLine = '',
    required this.location,
    required this.email,
    required this.startDate,
    required this.points,
    required this.badges,
    required this.specials,
    required this.rank,
    required this.imagePath,
    this.biography = '',
    this.linkedinUrl = '',
    this.isCurrentUser = false,
  });

  final int? id;
  final String name;
  final String role;
  final String area;
  final String serviceLine;
  final String location;
  final String email;
  final String startDate;
  final int points;
  final int badges;
  final int specials;
  final int rank;
  final String imagePath;
  final String biography;
  final String linkedinUrl;
  final bool isCurrentUser;

  ConsultantProfile copyWith({
    int? id,
    String? name,
    String? role,
    String? area,
    String? serviceLine,
    String? location,
    String? email,
    String? startDate,
    int? points,
    int? badges,
    int? specials,
    int? rank,
    String? imagePath,
    String? biography,
    String? linkedinUrl,
    bool? isCurrentUser,
  }) {
    return ConsultantProfile(
      id: id ?? this.id,
      name: name ?? this.name,
      role: role ?? this.role,
      area: area ?? this.area,
      serviceLine: serviceLine ?? this.serviceLine,
      location: location ?? this.location,
      email: email ?? this.email,
      startDate: startDate ?? this.startDate,
      points: points ?? this.points,
      badges: badges ?? this.badges,
      specials: specials ?? this.specials,
      rank: rank ?? this.rank,
      imagePath: imagePath ?? this.imagePath,
      biography: biography ?? this.biography,
      linkedinUrl: linkedinUrl ?? this.linkedinUrl,
      isCurrentUser: isCurrentUser ?? this.isCurrentUser,
    );
  }

  factory ConsultantProfile.fromJson(Map<String, dynamic> json) {
    return ConsultantProfile(
      id: _intValue(json, const ['id', 'consultorId', 'consultor_id']),
      name: _textValue(json, const ['name', 'nome']) ?? '',
      role: _textValue(json, const ['role']) ?? 'Consultor',
      area: _textValue(json, const ['area']) ?? '',
      serviceLine:
          _textValue(json, const ['serviceLine', 'service_line']) ?? '',
      location: _textValue(json, const ['location', 'localizacao']) ?? '',
      email: _textValue(json, const ['email']) ?? '',
      startDate: _textValue(json, const ['startDate', 'start_date']) ?? '',
      points: _intValue(json, const ['points', 'pontos']) ?? 0,
      badges: _intValue(json, const ['badges', 'badgesTotal']) ?? 0,
      specials: _intValue(json, const ['specials', 'specialsTotal']) ?? 0,
      rank: _intValue(json, const ['rank', 'ranking']) ?? 0,
      imagePath: _textValue(json, const ['imagePath', 'image_path']) ?? '',
      biography: _textValue(json, const ['biography', 'bio']) ?? '',
      linkedinUrl:
          _textValue(json, const ['linkedinUrl', 'linkedin_url']) ?? '',
      isCurrentUser:
          _boolValue(json, const ['isCurrentUser', 'is_current_user']) ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'role': role,
      'area': area,
      'serviceLine': serviceLine,
      'location': location,
      'email': email,
      'startDate': startDate,
      'points': points,
      'badges': badges,
      'specials': specials,
      'rank': rank,
      'imagePath': imagePath,
      'biography': biography,
      'linkedinUrl': linkedinUrl,
      'isCurrentUser': isCurrentUser,
    };
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
    final value = _field(json, keys);
    return value?.toString();
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

  static bool? _boolValue(Map<String, dynamic> json, List<String> keys) {
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
}
