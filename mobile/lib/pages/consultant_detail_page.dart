import 'package:flutter/material.dart';

import '../models/consultant_profile.dart';

class ConsultantDetailPage extends StatefulWidget {
  const ConsultantDetailPage({super.key, required this.consultant});

  final ConsultantProfile consultant;

  @override
  State<ConsultantDetailPage> createState() => _ConsultantDetailPageState();
}

class _ConsultantDetailPageState extends State<ConsultantDetailPage> {
  int selectedTab = 0;

  final List<_ConsultantBadge> badges = const [
    _ConsultantBadge(
      title: 'Azure Fundament',
      level: 'Nível: Júnior',
      date: '10/03/2023',
      imagePath: 'assets/images/badge_azure_fundamentals.png',
      color: Color(0xFF244B7A),
    ),
    _ConsultantBadge(
      title: 'AWS Solutions',
      level: 'Nível: Sénior',
      date: '22/06/2023',
      imagePath: 'assets/images/badge_aws_cloud_practitioner.png',
      color: Color(0xFF2C5574),
    ),
    _ConsultantBadge(
      title: 'Kubernetes Administra',
      level: 'Nível: Especialista',
      date: '15/09/2023',
      imagePath: 'assets/images/badge_kubernetes_administra.png',
      color: Color(0xFF3B2E7E),
    ),
    _ConsultantBadge(
      title: 'Terraform Associate',
      level: 'Nível: Pleno',
      date: '08/11/2023',
      imagePath: 'assets/images/badge_terraform_associate.png',
      color: Color(0xFF5D6878),
    ),
    _ConsultantBadge(
      title: 'Docker Certified',
      level: 'Nível: Júnior',
      date: '20/01/2024',
      imagePath: 'assets/images/badge_docker_certified.png',
      color: Color(0xFF0B7DAE),
    ),
    _ConsultantBadge(
      title: 'Cloud Security',
      level: 'Nível: Sénior',
      date: '05/03/2024',
      imagePath: 'assets/images/badge_cloud_security.png',
      color: Color(0xFF1D7D79),
    ),
  ];

  final List<_Achievement> achievements = const [
    _Achievement(
      icon: '🎯',
      title: 'Primeiro Passo',
      description: 'Conquistou o primeiro badge',
      date: 'Desbloqueado em 10/03/2023',
      color: Color(0xFF667085),
    ),
    _Achievement(
      icon: '👑',
      title: 'Mestre da Área',
      description: 'Domínio completo em Hybrid Cloud',
      date: 'Desbloqueado em 15/09/2023',
      color: Color(0xFFFF7A00),
      borderColor: Color(0xFFFFB000),
    ),
    _Achievement(
      icon: '🔥',
      title: 'Maratona de Aprendizagem',
      description: '30 dias consecutivos de atividade',
      date: 'Desbloqueado em 01/12/2023',
      color: Color(0xFF9C3BFF),
      borderColor: Color(0xFFC45BFF),
    ),
    _Achievement(
      icon: '💎',
      title: 'Colecionador',
      description: 'Conquistou 10+ badges',
      date: 'Desbloqueado em 14/02/2024',
      color: Color(0xFF2F80ED),
      borderColor: Color(0xFF2F80ED),
    ),
  ];

  @override
  Widget build(BuildContext context) {
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
                            _ConsultantSummary(consultant: widget.consultant),
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
                                _BadgesTab(badges: badges),
                                _AchievementsTab(achievements: achievements),
                                _StatsTab(consultant: widget.consultant),
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
      bottomNavigationBar: const _ConsultantBottomNavigation(),
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
          const Text(
            'Especialista em Cloud Computing com foco em soluções Azure e AWS. Apaixonado por automação e DevOps.',
            style: TextStyle(
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

  final List<_ConsultantBadge> badges;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _TabTitle(title: 'Badges Conquistados', trailing: '6 badges'),
        const SizedBox(height: 16),
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

  final List<_Achievement> achievements;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _TabTitle(
          title: 'Conquistas Especiais',
          trailing: '4 conquistas',
        ),
        const SizedBox(height: 16),
        for (final achievement in achievements) ...[
          _AchievementCard(achievement: achievement),
          const SizedBox(height: 14),
        ],
      ],
    );
  }
}

class _StatsTab extends StatelessWidget {
  const _StatsTab({required this.consultant});

  final ConsultantProfile consultant;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const _MetricCard(
          icon: Icons.track_changes,
          title: 'Taxa de Conclusão',
          value: '92%',
          color: Color(0xFF005DFF),
          progress: 0.92,
        ),
        const SizedBox(height: 14),
        const _MetricCard(
          icon: Icons.trending_up,
          title: 'Crescimento Mensal',
          value: '+15%',
          color: Color(0xFF00A651),
          subtitle: 'Aumento de pontos no último mês',
        ),
        const SizedBox(height: 14),
        const _MetricCard(
          icon: Icons.bolt_outlined,
          title: 'Sequência de Dias',
          value: '45 🔥',
          color: Color(0xFFFF4E00),
          subtitle: 'Dias consecutivos de atividade',
        ),
        const SizedBox(height: 18),
        _ActivitySummary(consultant: consultant),
      ],
    );
  }
}

class _BadgeCard extends StatelessWidget {
  const _BadgeCard({required this.badge});

  final _ConsultantBadge badge;

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
            badge.date,
            style: const TextStyle(color: Color(0xFF667085), fontSize: 11),
          ),
        ],
      ),
    );
  }
}

class _AchievementCard extends StatelessWidget {
  const _AchievementCard({required this.achievement});

  final _Achievement achievement;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: achievement.borderColor),
      ),
      child: Row(
        children: [
          Container(
            width: 52,
            height: 52,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: achievement.color,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: achievement.color.withValues(alpha: 0.25),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Text(achievement.icon, style: const TextStyle(fontSize: 22)),
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
                  achievement.date,
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
  const _ActivitySummary({required this.consultant});

  final ConsultantProfile consultant;

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
                value: '${consultant.badges}',
                label: 'Total de Badges',
                color: const Color(0xFF005DFF),
              ),
              _ActivityMetric(
                value: '${consultant.specials}',
                label: 'Conquistas',
                color: const Color(0xFF8B35FF),
              ),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              const _ActivityMetric(
                value: '45',
                label: 'Sequência de dias',
                color: Color(0xFFFF4E00),
              ),
              _ActivityMetric(
                value: '${consultant.points}',
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
    return ClipOval(
      child: Image.asset(
        consultant.imagePath,
        width: 72,
        height: 72,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            width: 72,
            height: 72,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: Colors.black,
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.person_outline,
              color: Colors.white,
              size: 36,
            ),
          );
        },
      ),
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

class _BadgeImage extends StatelessWidget {
  const _BadgeImage({required this.badge});

  final _ConsultantBadge badge;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Image.asset(
        badge.imagePath,
        width: double.infinity,
        height: 88,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return Container(
            width: double.infinity,
            height: 88,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [badge.color, badge.color.withValues(alpha: 0.55)],
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.workspace_premium_outlined,
              color: Colors.white,
              size: 34,
            ),
          );
        },
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

class _ConsultantBottomNavigation extends StatelessWidget {
  const _ConsultantBottomNavigation();

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: 4,
      type: BottomNavigationBarType.fixed,
      backgroundColor: Colors.white,
      elevation: 12,
      selectedItemColor: const Color(0xFF006DAA),
      unselectedItemColor: const Color(0xFF5E6878),
      selectedFontSize: 11,
      unselectedFontSize: 11,
      onTap: (index) {
        if (index == 4) {
          Navigator.of(context).popUntil((route) => route.isFirst);
        }
      },
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          label: 'Início',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.workspace_premium_outlined),
          label: 'Catálogo',
        ),
        BottomNavigationBarItem(
          icon: _BadgeNavigationIcon(),
          label: 'Meus\nBadges',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.emoji_events_outlined),
          label: 'Ranking',
        ),
        BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Perfil'),
      ],
    );
  }
}

class _BadgeNavigationIcon extends StatelessWidget {
  const _BadgeNavigationIcon();

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        const Icon(Icons.notifications_none),
        Positioned(
          top: -7,
          right: -8,
          child: Container(
            width: 16,
            height: 16,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: Color(0xFFFF3B48),
              shape: BoxShape.circle,
            ),
            child: const Text(
              '2',
              style: TextStyle(
                color: Colors.white,
                fontSize: 9,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _TabData {
  const _TabData(this.icon, this.label);

  final IconData icon;
  final String label;
}

class _ConsultantBadge {
  const _ConsultantBadge({
    required this.title,
    required this.level,
    required this.date,
    required this.imagePath,
    required this.color,
  });

  final String title;
  final String level;
  final String date;
  final String imagePath;
  final Color color;
}

class _Achievement {
  const _Achievement({
    required this.icon,
    required this.title,
    required this.description,
    required this.date,
    required this.color,
    this.borderColor = const Color(0xFFE0E5EE),
  });

  final String icon;
  final String title;
  final String description;
  final String date;
  final Color color;
  final Color borderColor;
}
