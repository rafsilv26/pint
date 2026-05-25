import 'package:flutter/material.dart';

class GamificationPage extends StatelessWidget {
  const GamificationPage({super.key});

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final horizontalPadding = constraints.maxWidth < 380 ? 16.0 : 24.0;

          return SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 26),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Column(
                  children: [
                    const _GamificationHeader(),
                    Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: horizontalPadding,
                      ),
                      child: const Column(
                        children: [
                          SizedBox(height: 18),
                          _SpecialAchievementsGrid(),
                          SizedBox(height: 22),
                          _LeaderboardSection(),
                          SizedBox(height: 22),
                          _ProfessionalEvolution(),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _GamificationHeader extends StatelessWidget {
  const _GamificationHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 22, 24, 24),
      decoration: const BoxDecoration(
        color: Color(0xFF006DAA),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(24),
          bottomRight: Radius.circular(24),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 42,
                height: 42,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.18),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(
                  Icons.emoji_events_outlined,
                  color: Colors.white,
                ),
              ),
              const SizedBox(width: 14),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Gamification',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 21,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Ranking e Conquistas',
                      style: TextStyle(color: Color(0xD9FFFFFF), fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 22),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.25)),
            ),
            child: const Row(
              children: [
                _HeaderStat(title: 'A Sua Posição', value: '#12'),
                _HeaderStat(title: 'Pontos', value: '1250'),
                _HeaderStat(title: 'Badges', value: '8'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _HeaderStat extends StatelessWidget {
  const _HeaderStat({required this.title, required this.value});

  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(color: Color(0xD9FFFFFF), fontSize: 12),
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _SpecialAchievementsGrid extends StatelessWidget {
  const _SpecialAchievementsGrid();

  @override
  Widget build(BuildContext context) {
    final achievements = const [
      _CompactAchievement(
        icon: Icons.star_border,
        title: 'Early Adopter',
        description: 'Primeiros 100 utilizadores da plataforma',
        color: Color(0xFFFF9900),
      ),
      _CompactAchievement(
        icon: Icons.trending_up,
        title: 'Streak Master',
        description: '30 dias consecutivos com atividade',
        color: Color(0xFF00C853),
      ),
      _CompactAchievement(
        icon: Icons.workspace_premium_outlined,
        title: 'Badge Collector',
        description: '10+ badges conquistados',
        color: Color(0xFF5C6CFF),
      ),
      _CompactAchievement(
        icon: Icons.diamond_outlined,
        title: 'Quick Learner',
        description: '3 certificações num mês',
        color: Color(0xFFE681DB),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionLabel(
          icon: Icons.star_border,
          text: 'Conquistas Especiais',
          iconColor: Color(0xFFFF9900),
        ),
        const SizedBox(height: 14),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: achievements.length,
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.05,
          ),
          itemBuilder: (context, index) {
            final achievement = achievements[index];

            return Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: const Color(0xFFE0E5EE)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 38,
                    height: 38,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: achievement.color,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(achievement.icon, color: Colors.white),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    achievement.title,
                    style: const TextStyle(
                      color: Color(0xFF111827),
                      fontSize: 13,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Expanded(
                    child: Text(
                      achievement.description,
                      style: const TextStyle(
                        color: Color(0xFF475467),
                        fontSize: 11,
                        height: 1.25,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ],
    );
  }
}

class _LeaderboardSection extends StatelessWidget {
  const _LeaderboardSection();

  @override
  Widget build(BuildContext context) {
    final consultants = const [
      _LeaderboardUser('👩‍💼', 'Ana Costa', 2850, 15),
      _LeaderboardUser('👨‍💼', 'Carlos Mendes', 2650, 14),
      _LeaderboardUser('👩‍💻', 'Maria Silva', 2400, 12),
      _LeaderboardUser('🧑‍💼', 'Pedro Santos', 2100, 11),
      _LeaderboardUser('🤓', 'Rita Oliveira', 1950, 10),
      _LeaderboardUser('👨‍🔧', 'João Ferreira', 1850, 10),
      _LeaderboardUser('👨‍🎓', 'Sofia Rodrigues', 1700, 9),
      _LeaderboardUser('🧑‍💻', 'Miguel Alves', 1600, 9),
      _LeaderboardUser('👩‍🔬', 'Teresa Carvalho', 1500, 8),
      _LeaderboardUser('👨‍🔧', 'Francisco Dias', 1400, 8),
      _LeaderboardUser('👩‍💼', 'Inês Martins', 1300, 8),
      _LeaderboardUser('👤', 'João Silva', 1250, 8, currentUser: true),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionLabel(
          icon: Icons.emoji_events_outlined,
          text: 'Top Consultores - Hybrid Cloud',
          iconColor: Color(0xFF005DFF),
        ),
        const SizedBox(height: 14),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE0E5EE)),
          ),
          child: Column(
            children: [
              for (var index = 0; index < consultants.length; index++)
                _LeaderboardRow(
                  user: consultants[index],
                  rank: index + 1,
                  isLast: index == consultants.length - 1,
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _LeaderboardRow extends StatelessWidget {
  const _LeaderboardRow({
    required this.user,
    required this.rank,
    required this.isLast,
  });

  final _LeaderboardUser user;
  final int rank;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final rankText = rank == 1
        ? '👑'
        : rank == 2
        ? '🥈'
        : rank == 3
        ? '🥉'
        : '$rank';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: user.currentUser ? const Color(0xFFEAF3FF) : Colors.white,
        borderRadius: isLast
            ? const BorderRadius.only(
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              )
            : null,
        border: isLast
            ? null
            : const Border(bottom: BorderSide(color: Color(0xFFE8EDF3))),
      ),
      child: Row(
        children: [
          SizedBox(
            width: 30,
            child: Text(
              rankText,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: user.currentUser
                    ? const Color(0xFF005DFF)
                    : const Color(0xFF344054),
                fontSize: 14,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          const SizedBox(width: 10),
          Text(user.icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  style: TextStyle(
                    color: user.currentUser
                        ? const Color(0xFF005DFF)
                        : const Color(0xFF111827),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '♙ ${user.badges}',
                  style: const TextStyle(
                    color: Color(0xFF475467),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                '${user.points}',
                style: const TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const Text(
                'pontos',
                style: TextStyle(color: Color(0xFF475467), fontSize: 10),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProfessionalEvolution extends StatelessWidget {
  const _ProfessionalEvolution();

  @override
  Widget build(BuildContext context) {
    final events = const [
      _TimelineEvent(
        icon: Icons.workspace_premium_outlined,
        title: 'Badge Azure Fundamentals aprovado',
        date: '1 de dezembro de 2025',
        color: Color(0xFFEAF3FF),
      ),
      _TimelineEvent(
        icon: Icons.star_border,
        title: 'Atingiu 1000 pontos',
        date: '15 de novembro de 2025',
        color: Color(0xFFEAFBF0),
      ),
      _TimelineEvent(
        icon: Icons.workspace_premium_outlined,
        title: 'Badge Docker Essentials conquistado',
        date: '20 de outubro de 2025',
        color: Color(0xFFEAF3FF),
      ),
      _TimelineEvent(
        icon: Icons.trending_up,
        title: 'Subiu para nível Sénior',
        date: '1 de outubro de 2025',
        color: Color(0xFFF3E8FF),
      ),
      _TimelineEvent(
        icon: Icons.workspace_premium_outlined,
        title: 'Primeira certificação completada',
        date: '10 de setembro de 2025',
        color: Color(0xFFEAF3FF),
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionLabel(
          icon: Icons.trending_up,
          text: 'Evolução Profissional',
          iconColor: Color(0xFF005DFF),
        ),
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE0E5EE)),
          ),
          child: Column(
            children: [
              for (var index = 0; index < events.length; index++)
                _TimelineRow(
                  event: events[index],
                  isLast: index == events.length - 1,
                ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TimelineRow extends StatelessWidget {
  const _TimelineRow({required this.event, required this.isLast});

  final _TimelineEvent event;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Column(
          children: [
            Container(
              width: 38,
              height: 38,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: event.color,
                shape: BoxShape.circle,
              ),
              child: Icon(event.icon, color: const Color(0xFF005DFF), size: 20),
            ),
            if (!isLast)
              Container(width: 2, height: 38, color: const Color(0xFFE0E5EE)),
          ],
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 3),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  event.title,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  event.date,
                  style: const TextStyle(
                    color: Color(0xFF667085),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _SectionLabel extends StatelessWidget {
  const _SectionLabel({
    required this.icon,
    required this.text,
    required this.iconColor,
  });

  final IconData icon;
  final String text;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: iconColor, size: 18),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 14,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      ],
    );
  }
}

class _CompactAchievement {
  const _CompactAchievement({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String description;
  final Color color;
}

class _LeaderboardUser {
  const _LeaderboardUser(
    this.icon,
    this.name,
    this.points,
    this.badges, {
    this.currentUser = false,
  });

  final String icon;
  final String name;
  final int points;
  final int badges;
  final bool currentUser;
}

class _TimelineEvent {
  const _TimelineEvent({
    required this.icon,
    required this.title,
    required this.date,
    required this.color,
  });

  final IconData icon;
  final String title;
  final String date;
  final Color color;
}
