import 'package:flutter/material.dart';

import '../models/consultant_profile.dart';
import '../models/mobile_api_data.dart';
import '../repositories/mobile_api_repository.dart';
import '../widgets/app_bottom_navigation.dart';

class ConsultantDetailPage extends StatefulWidget {
  const ConsultantDetailPage({super.key, required this.consultant});

  final ConsultantProfile consultant;

  @override
  State<ConsultantDetailPage> createState() => _ConsultantDetailPageState();
}

class _ConsultantDetailPageState extends State<ConsultantDetailPage> {
  final MobileApiRepository repository = MobileApiRepository();
  late Future<ConsultantDetailData> detailFuture;
  int selectedTab = 0;

  @override
  void initState() {
    super.initState();
    detailFuture = repository.getConsultantDetail(widget.consultant);
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<ConsultantDetailData>(
      future: detailFuture,
      builder: (context, snapshot) {
        final detail =
            snapshot.data ??
            ConsultantDetailData.empty(consultant: widget.consultant);
        final isLoading = snapshot.connectionState == ConnectionState.waiting;

        return Scaffold(
          backgroundColor: const Color(0xFFF4F7FB),
          body: SafeArea(
            bottom: false,
            child: Column(
              children: [
                const _DetailHeader(),
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
                                _ConsultantSummary(
                                  consultant: detail.consultant,
                                ),
                                const SizedBox(height: 18),
                                _DetailTabs(
                                  selectedIndex: selectedTab,
                                  onChanged: (index) {
                                    setState(() {
                                      selectedTab = index;
                                    });
                                  },
                                ),
                                const SizedBox(height: 20),
                                IndexedStack(
                                  index: selectedTab,
                                  children: [
                                    isLoading
                                        ? const _LoadingTab()
                                        : _BadgesTab(badges: detail.badges),
                                    isLoading
                                        ? const _LoadingTab()
                                        : _AchievementsTab(
                                            achievements: detail.achievements,
                                          ),
                                    _StatsTab(stats: detail.stats),
                                  ],
                                ),
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
          bottomNavigationBar: AppBottomNavigation(
            currentDestination: AppBottomNavigationDestination.profile,
            onDestinationSelected: (destination) {
              AppNavigationController.open(context, destination);
            },
          ),
        );
      },
    );
  }
}

class _LoadingTab extends StatelessWidget {
  const _LoadingTab();

  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.symmetric(vertical: 32),
      child: Center(child: CircularProgressIndicator()),
    );
  }
}

class _DetailHeader extends StatelessWidget {
  const _DetailHeader();

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
          minimumSize: const Size(0, 30),
          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        ),
        icon: const Icon(Icons.arrow_back, size: 18),
        label: const Text(
          'Voltar',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
        ),
      ),
    );
  }
}

class _ConsultantSummary extends StatelessWidget {
  const _ConsultantSummary({required this.consultant});

  final ConsultantProfile consultant;

  @override
  Widget build(BuildContext context) {
    return _DetailCard(
      padding: const EdgeInsets.fromLTRB(20, 22, 20, 20),
      child: Column(
        children: [
          Row(
            children: [
              _DetailAvatar(consultant: consultant),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      consultant.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF111827),
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      consultant.role,
                      style: const TextStyle(
                        color: Color(0xFF475467),
                        fontSize: 15,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            consultant.biography.isNotEmpty
                ? consultant.biography
                : 'Perfil profissional sincronizado a partir da plataforma.',
            style: const TextStyle(
              color: Color(0xFF344054),
              fontSize: 15,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 18),
          Wrap(
            spacing: 16,
            runSpacing: 10,
            children: [
              _ProfileMiniInfo(icon: Icons.work_outline, text: consultant.area),
              _ProfileMiniInfo(
                icon: Icons.location_on_outlined,
                text: consultant.location,
              ),
              _ProfileMiniInfo(
                icon: Icons.mail_outline,
                text: consultant.email,
              ),
              _ProfileMiniInfo(
                icon: Icons.calendar_month_outlined,
                text: 'Desde ${consultant.startDate}',
              ),
            ],
          ),
          const SizedBox(height: 18),
          const Divider(height: 1, color: Color(0xFFE8EDF3)),
          const SizedBox(height: 16),
          Row(
            children: [
              _SummaryStat(
                value: '${consultant.points}',
                label: 'Pontos',
                color: const Color(0xFF005DFF),
              ),
              _SummaryStat(
                value: '${consultant.badges}',
                label: 'Badges',
                color: const Color(0xFF8B35FF),
              ),
              _SummaryStat(
                value: '${consultant.specials}',
                label: 'Especiais',
                color: const Color(0xFFFF4E00),
              ),
              _SummaryStat(
                value: '#${consultant.rank}',
                label: 'Ranking',
                color: const Color(0xFF00A651),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _DetailTabs extends StatelessWidget {
  const _DetailTabs({required this.selectedIndex, required this.onChanged});

  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final tabs = const [
      _TabData(Icons.workspace_premium_outlined, 'Badges'),
      _TabData(Icons.emoji_events_outlined, 'Conquistas'),
      _TabData(Icons.trending_up, 'Stats'),
    ];

    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE0E5EE)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x10101828),
            blurRadius: 12,
            offset: Offset(0, 5),
          ),
        ],
      ),
      child: Row(
        children: [
          for (var index = 0; index < tabs.length; index++)
            Expanded(
              child: InkWell(
                onTap: () => onChanged(index),
                borderRadius: BorderRadius.circular(12),
                child: Container(
                  height: 44,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: selectedIndex == index
                        ? const Color(0xFF2F8AB9)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: selectedIndex == index
                        ? const [
                            BoxShadow(
                              color: Color(0x332F8AB9),
                              blurRadius: 8,
                              offset: Offset(0, 4),
                            ),
                          ]
                        : null,
                  ),
                  child: FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          tabs[index].icon,
                          color: selectedIndex == index
                              ? Colors.white
                              : const Color(0xFF475467),
                          size: 18,
                        ),
                        const SizedBox(width: 6),
                        Text(
                          tabs[index].label,
                          style: TextStyle(
                            color: selectedIndex == index
                                ? Colors.white
                                : const Color(0xFF475467),
                            fontSize: 14,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _BadgesTab extends StatelessWidget {
  const _BadgesTab({required this.badges});

  final List<ConsultantAwardedBadge> badges;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _TabTitle(
          title: 'Badges Conquistados',
          trailing: '${badges.length} badges',
        ),
        const SizedBox(height: 16),
        if (badges.isEmpty)
          const _EmptyState(
            icon: Icons.workspace_premium_outlined,
            title: 'Sem badges conquistados',
            message:
                'Ainda não existem badges guardados localmente para este consultor.',
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: badges.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 14,
              mainAxisSpacing: 14,
              childAspectRatio: 0.82,
            ),
            itemBuilder: (context, index) {
              return _BadgeCard(badge: badges[index]);
            },
          ),
      ],
    );
  }
}

class _AchievementsTab extends StatelessWidget {
  const _AchievementsTab({required this.achievements});

  final List<ConsultantSpecialAchievement> achievements;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _TabTitle(
          title: 'Conquistas Especiais',
          trailing: '${achievements.length} conquistas',
        ),
        const SizedBox(height: 16),
        if (achievements.isEmpty)
          const _EmptyState(
            icon: Icons.emoji_events_outlined,
            title: 'Sem conquistas especiais',
            message:
                'Ainda não existem conquistas especiais guardadas localmente.',
          )
        else
          for (final achievement in achievements) ...[
            _AchievementCard(achievement: achievement),
            const SizedBox(height: 14),
          ],
      ],
    );
  }
}

class _StatsTab extends StatelessWidget {
  const _StatsTab({required this.stats});

  final ConsultantActivityStats stats;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        _MetricCard(
          icon: Icons.track_changes,
          title: 'Taxa de Conclusão',
          value: '${(stats.completionRate * 100).round()}%',
          color: const Color(0xFF005DFF),
          progress: stats.completionRate,
        ),
        const SizedBox(height: 14),
        _MetricCard(
          icon: Icons.trending_up,
          title: 'Crescimento Mensal',
          value: '+${stats.monthlyGrowthPercent}%',
          color: const Color(0xFF00A651),
          subtitle: 'Aumento de pontos no último mês',
        ),
        const SizedBox(height: 14),
        _MetricCard(
          icon: Icons.bolt_outlined,
          title: 'Dias com Atividade',
          value: '${stats.activityDays}',
          color: const Color(0xFFFF4E00),
          subtitle: 'Dias distintos com badges ou conquistas registadas',
        ),
        const SizedBox(height: 18),
        _ActivitySummary(stats: stats),
      ],
    );
  }
}

class _BadgeCard extends StatelessWidget {
  const _BadgeCard({required this.badge});

  final ConsultantAwardedBadge badge;

  @override
  Widget build(BuildContext context) {
    return _DetailCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _BadgeImage(badge: badge),
          const SizedBox(height: 12),
          Text(
            badge.title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 14,
              fontWeight: FontWeight.w800,
              height: 1.25,
            ),
          ),
          const SizedBox(height: 7),
          Text(
            badge.level,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Color(0xFF667085), fontSize: 12),
          ),
          const SizedBox(height: 6),
          Text(
            _formatDate(badge.obtainedAt),
            style: const TextStyle(color: Color(0xFF667085), fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _AchievementCard extends StatelessWidget {
  const _AchievementCard({required this.achievement});

  final ConsultantSpecialAchievement achievement;

  @override
  Widget build(BuildContext context) {
    final achievementColor = _colorForText(achievement.title);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: achievementColor.withValues(alpha: 0.35)),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: achievementColor,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: achievementColor.withValues(alpha: 0.25),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Icon(
              _achievementIcon(achievement.icon),
              color: Colors.white,
              size: 26,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  achievement.title,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 15,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 7),
                Text(
                  achievement.description,
                  style: const TextStyle(
                    color: Color(0xFF475467),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _achievementDateText(achievement.awardedAt),
                  style: const TextStyle(
                    color: Color(0xFF667085),
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard({
    required this.icon,
    required this.title,
    required this.value,
    required this.color,
    this.subtitle,
    this.progress,
  });

  final IconData icon;
  final String title;
  final String value;
  final Color color;
  final String? subtitle;
  final double? progress;

  @override
  Widget build(BuildContext context) {
    return _DetailCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              Text(
                value,
                style: TextStyle(
                  color: color,
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          if (progress != null) ...[
            const SizedBox(height: 18),
            ClipRRect(
              borderRadius: BorderRadius.circular(999),
              child: LinearProgressIndicator(
                minHeight: 10,
                value: progress,
                backgroundColor: const Color(0xFFE0E5EE),
                color: const Color(0xFF2F8AB9),
              ),
            ),
          ],
          if (subtitle != null) ...[
            const SizedBox(height: 14),
            Text(
              subtitle!,
              style: const TextStyle(color: Color(0xFF475467), fontSize: 13),
            ),
          ],
        ],
      ),
    );
  }
}

class _ActivitySummary extends StatelessWidget {
  const _ActivitySummary({required this.stats});

  final ConsultantActivityStats stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F8FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFB6D2FF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.star_border, color: Color(0xFF005DFF)),
              SizedBox(width: 10),
              Text(
                'Resumo de Atividade',
                style: TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 15,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              _ActivityMetric(
                value: '${stats.badges}',
                label: 'Total de Badges',
                color: const Color(0xFF005DFF),
              ),
              _ActivityMetric(
                value: '${stats.achievements}',
                label: 'Conquistas',
                color: const Color(0xFF8B35FF),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              _ActivityMetric(
                value: '${stats.activityDays}',
                label: 'Dias ativos',
                color: const Color(0xFFFF4E00),
              ),
              _ActivityMetric(
                value: '${stats.points}',
                label: 'Pontos Totais',
                color: const Color(0xFF00A651),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActivityMetric extends StatelessWidget {
  const _ActivityMetric({
    required this.value,
    required this.label,
    required this.color,
  });

  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 19,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 7),
          Text(
            label,
            style: const TextStyle(color: Color(0xFF475467), fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class _DetailAvatar extends StatelessWidget {
  const _DetailAvatar({required this.consultant});

  final ConsultantProfile consultant;

  @override
  Widget build(BuildContext context) {
    final imagePath = consultant.imagePath.trim();
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return ClipOval(
        child: Image.network(
          imagePath,
          width: 72,
          height: 72,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return const _DetailAvatarFallback();
          },
        ),
      );
    }

    return ClipOval(
      child: Image.asset(
        imagePath,
        width: 72,
        height: 72,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return const _DetailAvatarFallback();
        },
      ),
    );
  }
}

class _DetailAvatarFallback extends StatelessWidget {
  const _DetailAvatarFallback();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 72,
      height: 72,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        color: Colors.black,
        shape: BoxShape.circle,
      ),
      child: const Icon(Icons.person_outline, color: Colors.white, size: 36),
    );
  }
}

class _ProfileMiniInfo extends StatelessWidget {
  const _ProfileMiniInfo({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 132,
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF005DFF), size: 15),
          const SizedBox(width: 6),
          Expanded(
            child: Text(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Color(0xFF475467), fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }
}

class _SummaryStat extends StatelessWidget {
  const _SummaryStat({
    required this.value,
    required this.label,
    required this.color,
  });

  final String value;
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Column(
        children: [
          Text(
            value,
            style: TextStyle(
              color: color,
              fontSize: 19,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            label,
            textAlign: TextAlign.center,
            style: const TextStyle(color: Color(0xFF475467), fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _TabTitle extends StatelessWidget {
  const _TabTitle({required this.title, required this.trailing});

  final String title;
  final String trailing;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 17,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
        Text(
          trailing,
          style: const TextStyle(color: Color(0xFF667085), fontSize: 12),
        ),
      ],
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState({
    required this.icon,
    required this.title,
    required this.message,
  });

  final IconData icon;
  final String title;
  final String message;

  @override
  Widget build(BuildContext context) {
    return _DetailCard(
      padding: const EdgeInsets.all(22),
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFF667085), size: 32),
          const SizedBox(height: 12),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF667085),
              fontSize: 13,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
  }
}

class _BadgeImage extends StatelessWidget {
  const _BadgeImage({required this.badge});

  final ConsultantAwardedBadge badge;

  @override
  Widget build(BuildContext context) {
    final imagePath = badge.imagePath.trim();
    final color = _colorForText(badge.title);

    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.network(
          imagePath,
          width: double.infinity,
          height: 88,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _BadgeImageFallback(color: color);
          },
        ),
      );
    }

    if (imagePath.startsWith('assets/')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.asset(
          imagePath,
          width: double.infinity,
          height: 88,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _BadgeImageFallback(color: color);
          },
        ),
      );
    }

    return _BadgeImageFallback(color: color);
  }
}

class _BadgeImageFallback extends StatelessWidget {
  const _BadgeImageFallback({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Container(
        width: double.infinity,
        height: 88,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [color, color.withValues(alpha: 0.55)],
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Icon(
          Icons.workspace_premium_outlined,
          color: Colors.white,
          size: 34,
        ),
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  const _DetailCard({required this.child, required this.padding});

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE0E5EE)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x15101828),
            blurRadius: 18,
            offset: Offset(0, 8),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _TabData {
  const _TabData(this.icon, this.label);

  final IconData icon;
  final String label;
}

String _formatDate(DateTime? date) {
  if (date == null) {
    return 'Data indisponível';
  }

  final day = date.day.toString().padLeft(2, '0');
  final month = date.month.toString().padLeft(2, '0');
  return '$day/$month/${date.year}';
}

String _achievementDateText(DateTime? date) {
  if (date == null) {
    return 'Desbloqueado sem data registada';
  }

  return 'Desbloqueado em ${_formatDate(date)}';
}

Color _colorForText(String text) {
  const colors = [
    Color(0xFF244B7A),
    Color(0xFF2C5574),
    Color(0xFF3B2E7E),
    Color(0xFF5D6878),
    Color(0xFF0B7DAE),
    Color(0xFF1D7D79),
  ];
  final index = text.codeUnits.fold<int>(0, (sum, code) => sum + code);
  return colors[index % colors.length];
}

IconData _achievementIcon(String icon) {
  return switch (icon.trim().toLowerCase()) {
    'target' || 'goal' => Icons.track_changes,
    'crown' || 'leader' => Icons.workspace_premium_outlined,
    'fire' || 'streak' => Icons.local_fire_department_outlined,
    'diamond' || 'gem' => Icons.diamond_outlined,
    'trophy' || 'award' => Icons.emoji_events_outlined,
    'star' => Icons.star_border,
    _ => Icons.emoji_events_outlined,
  };
}
