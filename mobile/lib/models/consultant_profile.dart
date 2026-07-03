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

  static List<ConsultantProfile> samples() {
    return const [
      ConsultantProfile(
        name: 'João Silva',
        role: 'Consultor',
        area: 'Hybrid Cloud',
        location: 'Lisboa',
        email: 'joao.silva@softinsa.pt',
        startDate: '01/2023',
        points: 2450,
        badges: 12,
        specials: 3,
        rank: 1,
        imagePath: 'assets/images/consultant_joao_silva.png',
        isCurrentUser: true,
      ),
      ConsultantProfile(
        name: 'Maria Santos',
        role: 'Consultora Sénior',
        area: 'Data & AI',
        location: 'Porto',
        email: 'maria.santos@softinsa.pt',
        startDate: '05/2022',
        points: 2380,
        badges: 15,
        specials: 2,
        rank: 2,
        imagePath: 'assets/images/consultant_maria_santos.png',
      ),
      ConsultantProfile(
        name: 'Pedro Costa',
        role: 'Consultor',
        area: 'Cybersecurity',
        location: 'Lisboa',
        email: 'pedro.costa@softinsa.pt',
        startDate: '10/2022',
        points: 2120,
        badges: 10,
        specials: 2,
        rank: 3,
        imagePath: 'assets/images/consultant_pedro_costa.png',
      ),
      ConsultantProfile(
        name: 'Ana Rodrigues',
        role: 'Consultora',
        area: 'Custom Development',
        location: 'Braga',
        email: 'ana.rodrigues@softinsa.pt',
        startDate: '03/2023',
        points: 1890,
        badges: 9,
        specials: 1,
        rank: 4,
        imagePath: 'assets/images/consultant_ana_rodrigues.png',
      ),
      ConsultantProfile(
        name: 'Ricardo Oliveira',
        role: 'Consultor',
        area: 'Application Operations',
        location: 'Lisboa',
        email: 'ricardo.oliveira@softinsa.pt',
        startDate: '07/2022',
        points: 1650,
        badges: 8,
        specials: 1,
        rank: 5,
        imagePath: 'assets/images/consultant_ricardo_oliveira.png',
      ),
      ConsultantProfile(
        name: 'Sofia Fernandes',
        role: 'Consultora',
        area: 'Digital Experience',
        location: 'Porto',
        email: 'sofia.fernandes@softinsa.pt',
        startDate: '11/2023',
        points: 1520,
        badges: 7,
        specials: 1,
        rank: 6,
        imagePath: 'assets/images/consultant_sofia_fernandes.png',
      ),
      ConsultantProfile(
        name: 'Miguel Pereira',
        role: 'Consultor Júnior',
        area: 'Hybrid Cloud',
        location: 'Coimbra',
        email: 'miguel.pereira@softinsa.pt',
        startDate: '02/2024',
        points: 1280,
        badges: 6,
        specials: 1,
        rank: 7,
        imagePath: 'assets/images/consultant_miguel_pereira.png',
      ),
      ConsultantProfile(
        name: 'Beatriz Alves',
        role: 'Consultora Júnior',
        area: 'Data & AI',
        location: 'Lisboa',
        email: 'beatriz.alves@softinsa.pt',
        startDate: '01/2024',
        points: 980,
        badges: 5,
        specials: 1,
        rank: 8,
        imagePath: 'assets/images/consultant_beatriz_alves.png',
      ),
      ConsultantProfile(
        name: 'Tiago Martins',
        role: 'Consultor Júnior',
        area: 'Cybersecurity',
        location: 'Porto',
        email: 'tiago.martins@softinsa.pt',
        startDate: '04/2024',
        points: 850,
        badges: 4,
        specials: 1,
        rank: 9,
        imagePath: 'assets/images/consultant_tiago_martins.png',
      ),
      ConsultantProfile(
        name: 'Carla Sousa',
        role: 'Consultora Júnior',
        area: 'Custom Development',
        location: 'Faro',
        email: 'carla.sousa@softinsa.pt',
        startDate: '05/2024',
        points: 720,
        badges: 3,
        specials: 0,
        rank: 10,
        imagePath: 'assets/images/consultant_carla_sousa.png',
      ),
    ];
  }
}
