import 'package:flutter/material.dart';

class SpecialAchievementsPage extends StatelessWidget {
  const SpecialAchievementsPage({super.key});

  @override
  Widget build(BuildContext context) {
    final achievements = _SpecialAchievement.samples();

    return Scaffold(
      backgroundColor: const Color(0xFFFCF7FF),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const _AchievementsHeader(),
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final horizontalPadding = constraints.maxWidth < 380
                      ? 16.0
                      : 24.0;

                  return SingleChildScrollView(
                    padding: EdgeInsets.fromLTRB(
                      horizontalPadding,
                      16,
                      horizontalPadding,
                      28,
                    ),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 560),
                        child: Column(
                          children: [
                            const _AchievementStats(),
                            const SizedBox(height: 18),
                            for (final achievement in achievements) ...[
                              _SpecialAchievementCard(achievement: achievement),
                              const SizedBox(height: 16),
                            ],
                          ],
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AchievementsHeader extends StatelessWidget {
  const _AchievementsHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
      color: const Color(0xFF006DAA),
      child: TextButton.icon(
        onPressed: () => Navigator.of(context).pop(),
        style: TextButton.styleFrom(
          foregroundColor: Colors.white,
          padding: EdgeInsets.zero,
          minimumSize: const Size(0, 32),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        icon: const Icon(Icons.arrow_back_ios_new, size: 16),
        label: const Text(
          'Conquistas especiais',
          style: TextStyle(fontSize: 17, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class _AchievementStats extends StatelessWidget {
  const _AchievementStats();

  @override
  Widget build(BuildContext context) {
    return Row(
      children: const [
        Expanded(
          child: _StatBox(
            icon: Icons.emoji_events_outlined,
            value: '3',
            label: 'Desbloqueadas',
          ),
        ),
        SizedBox(width: 12),
        Expanded(
          child: _StatBox(
            icon: Icons.star_border,
            value: '500',
            label: 'Pontos Extra',
          ),
        ),
        SizedBox(width: 12),
        Expanded(
          child: _StatBox(
            icon: Icons.trending_up,
            value: '30%',
            label: 'Progresso',
          ),
        ),
      ],
    );
  }
}

class _StatBox extends StatelessWidget {
  const _StatBox({
    required this.icon,
    required this.value,
    required this.label,
  });

  final IconData icon;
  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1F7DAF),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 24),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xD9FFFFFF),
              fontSize: 10,
              height: 1.15,
            ),
          ),
        ],
      ),
    );
  }
}

class _SpecialAchievementCard extends StatelessWidget {
  const _SpecialAchievementCard({required this.achievement});

  final _SpecialAchievement achievement;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: achievement.borderColor),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12101828),
            blurRadius: 16,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 56,
                height: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: achievement.iconColor,
                  borderRadius: BorderRadius.circular(13),
                ),
                child: Icon(achievement.icon, color: Colors.white, size: 30),
              ),
              if (achievement.unlocked)
                const Positioned(top: -6, right: -6, child: _UnlockedBadge()),
            ],
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        achievement.title,
                        style: const TextStyle(
                          color: Color(0xFF111827),
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          height: 1.25,
                        ),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: achievement.badgeColor,
                        borderRadius: BorderRadius.circular(999),
                      ),
                      child: Text(
                        achievement.rarity,
                        style: TextStyle(
                          color: achievement.badgeTextColor,
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  achievement.description,
                  style: const TextStyle(
                    color: Color(0xFF475467),
                    fontSize: 13,
                    height: 1.3,
                  ),
                ),
                const SizedBox(height: 14),
                _RequirementLine(text: achievement.requirement),
                const SizedBox(height: 12),
                if (achievement.progress != null) ...[
                  Row(
                    children: [
                      const Text(
                        'Progresso',
                        style: TextStyle(
                          color: Color(0xFF667085),
                          fontSize: 11,
                        ),
                      ),
                      const Spacer(),
                      Text(
                        '${(achievement.progress! * 100).round()}%',
                        style: const TextStyle(
                          color: Color(0xFF005DFF),
                          fontSize: 10,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(999),
                    child: LinearProgressIndicator(
                      minHeight: 7,
                      value: achievement.progress,
                      color: const Color(0xFFAC5BFF),
                      backgroundColor: const Color(0xFFE8EDF3),
                    ),
                  ),
                  const SizedBox(height: 12),
                ] else
                  const Divider(color: Color(0xFFE8EDF3)),
                Row(
                  children: [
                    const Icon(
                      Icons.star_border,
                      color: Color(0xFF005DFF),
                      size: 14,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '${achievement.points} pontos',
                      style: const TextStyle(
                        color: Color(0xFF005DFF),
                        fontSize: 12,
                      ),
                    ),
                    if (achievement.date != null) ...[
                      const Spacer(),
                      Flexible(
                        child: Text(
                          achievement.date!,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          textAlign: TextAlign.right,
                          style: const TextStyle(
                            color: Color(0xFF667085),
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RequirementLine extends StatelessWidget {
  const _RequirementLine({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.track_changes, color: Color(0xFF667085), size: 13),
        const SizedBox(width: 6),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              color: Color(0xFF667085),
              fontSize: 11,
              height: 1.3,
            ),
          ),
        ),
      ],
    );
  }
}

class _UnlockedBadge extends StatelessWidget {
  const _UnlockedBadge();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 18,
      height: 18,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        color: Color(0xFF00C853),
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.check, color: Colors.white, size: 12),
    );
  }
}

class _SpecialAchievement {
  const _SpecialAchievement({
    required this.title,
    required this.description,
    required this.requirement,
    required this.points,
    required this.rarity,
    required this.icon,
    required this.iconColor,
    required this.borderColor,
    required this.badgeColor,
    required this.badgeTextColor,
    this.unlocked = false,
    this.progress,
    this.date,
  });

  final String title;
  final String description;
  final String requirement;
  final int points;
  final String rarity;
  final IconData icon;
  final Color iconColor;
  final Color borderColor;
  final Color badgeColor;
  final Color badgeTextColor;
  final bool unlocked;
  final double? progress;
  final String? date;

  static List<_SpecialAchievement> samples() {
    return const [
      _SpecialAchievement(
        title: 'Primeiro Passo',
        description: 'Conquistou o seu primeiro badge',
        requirement: 'Obter 1 badge',
        points: 50,
        rarity: 'Comum',
        icon: Icons.star_border,
        iconColor: Color(0xFF98A2B3),
        borderColor: Color(0xFFE0E5EE),
        badgeColor: Color(0xFFF2F4F7),
        badgeTextColor: Color(0xFF475467),
        unlocked: true,
        date: 'Desbloqueada em 15/11/2024',
      ),
      _SpecialAchievement(
        title: 'Trio de Sucesso',
        description: 'Completou 3 badges na timeline proposta',
        requirement: 'Completar 3 badges na timeline',
        points: 150,
        rarity: 'Raro',
        icon: Icons.track_changes,
        iconColor: Color(0xFF3388FF),
        borderColor: Color(0xFF90C2FF),
        badgeColor: Color(0xFFEAF3FF),
        badgeTextColor: Color(0xFF005DFF),
        unlocked: true,
        date: 'Desbloqueada em 01/12/2024',
      ),
      _SpecialAchievement(
        title: 'Velocista',
        description: 'Obteve 5 badges em menos de 3 meses',
        requirement: '5 badges em 3 meses (3/5 completos)',
        points: 200,
        rarity: 'Raro',
        icon: Icons.lock_open_outlined,
        iconColor: Color(0xFF64A0FF),
        borderColor: Color(0xFF90C2FF),
        badgeColor: Color(0xFFEAF3FF),
        badgeTextColor: Color(0xFF005DFF),
        progress: 0.60,
      ),
      _SpecialAchievement(
        title: 'Certificação Premium',
        description: 'Conquistou uma certificação paga oficial',
        requirement: 'Obter certificação paga (AWS/Azure/etc)',
        points: 300,
        rarity: 'Épico',
        icon: Icons.workspace_premium_outlined,
        iconColor: Color(0xFFB02EFF),
        borderColor: Color(0xFFD7A6FF),
        badgeColor: Color(0xFFF3E8FF),
        badgeTextColor: Color(0xFF9C27B0),
        unlocked: true,
        date: 'Desbloqueada em 20/11/2024',
      ),
      _SpecialAchievement(
        title: 'Colecionador',
        description: 'Possui 10 badges diferentes',
        requirement: '10 badges totais (4/10 completos)',
        points: 250,
        rarity: 'Raro',
        icon: Icons.lock_open_outlined,
        iconColor: Color(0xFF64A0FF),
        borderColor: Color(0xFF90C2FF),
        badgeColor: Color(0xFFEAF3FF),
        badgeTextColor: Color(0xFF005DFF),
        progress: 0.40,
      ),
      _SpecialAchievement(
        title: 'Especialista Multi-Cloud',
        description: 'Certificações em AWS, Azure e GCP',
        requirement: 'Certificações nas 3 clouds principais',
        points: 500,
        rarity: 'Lendário',
        icon: Icons.lock_open_outlined,
        iconColor: Color(0xFFFF8A34),
        borderColor: Color(0xFFFFB000),
        badgeColor: Color(0xFFFFF1D6),
        badgeTextColor: Color(0xFFFF7A00),
        progress: 0.33,
      ),
      _SpecialAchievement(
        title: 'Maratona de Conhecimento',
        description: 'Completou 3 badges no mesmo mês',
        requirement: '3 badges em 1 mês (2/3 completos)',
        points: 150,
        rarity: 'Raro',
        icon: Icons.lock_open_outlined,
        iconColor: Color(0xFF64A0FF),
        borderColor: Color(0xFF90C2FF),
        badgeColor: Color(0xFFEAF3FF),
        badgeTextColor: Color(0xFF005DFF),
        progress: 0.66,
      ),
      _SpecialAchievement(
        title: 'Mestre da Área',
        description: 'Todos os badges disponíveis na sua Service Line',
        requirement: 'Completar todos badges da área',
        points: 600,
        rarity: 'Lendário',
        icon: Icons.lock_open_outlined,
        iconColor: Color(0xFFFF8A34),
        borderColor: Color(0xFFFFB000),
        badgeColor: Color(0xFFFFF1D6),
        badgeTextColor: Color(0xFFFF7A00),
        progress: 0.25,
      ),
      _SpecialAchievement(
        title: 'Trilha Completa',
        description: 'Completou um Learning Path inteiro',
        requirement: 'Completar todos badges de um Learning Path',
        points: 400,
        rarity: 'Épico',
        icon: Icons.lock_open_outlined,
        iconColor: Color(0xFFC35BFF),
        borderColor: Color(0xFFD7A6FF),
        badgeColor: Color(0xFFF3E8FF),
        badgeTextColor: Color(0xFF9C27B0),
        progress: 0.75,
      ),
      _SpecialAchievement(
        title: 'Consistência Anual',
        description: 'Obteve pelo menos 1 badge por mês durante 12 meses',
        requirement: '1 badge/mês por 12 meses (2/12 meses)',
        points: 800,
        rarity: 'Lendário',
        icon: Icons.lock_open_outlined,
        iconColor: Color(0xFFFF8A34),
        borderColor: Color(0xFFFFB000),
        badgeColor: Color(0xFFFFF1D6),
        badgeTextColor: Color(0xFFFF7A00),
        progress: 0.16,
      ),
    ];
  }
}
