import 'package:flutter/material.dart';

import '../l10n/app_language.dart';
import '../models/dashboard_data.dart';
import '../repositories/dashboard_repository.dart';
import '../repositories/mobile_api_repository.dart';
import '../widgets/app_bottom_navigation.dart';
import 'catalog_page.dart';
import 'gamification_page.dart';
import 'my_badges_page.dart';
import 'notifications_page.dart';
import 'profile_page.dart';
import 'special_achievements_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key, this.onLoggedOut});

  final VoidCallback? onLoggedOut;

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  final DashboardRepository repository = DashboardRepository();
  late Future<DashboardData> dashboardFuture;

  int selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    selectedIndex = AppBottomNavigationDestination.home.index;
    AppNavigationController.select(AppBottomNavigationDestination.home);
    AppNavigationController.destination.addListener(updateSelectedDestination);
    dashboardFuture = repository.getDashboard();
  }

  @override
  void dispose() {
    AppNavigationController.destination.removeListener(
      updateSelectedDestination,
    );
    super.dispose();
  }

  void updateSelectedDestination() {
    final nextIndex = AppNavigationController.destination.value.index;
    if (selectedIndex == nextIndex) {
      return;
    }

    setState(() {
      selectedIndex = nextIndex;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: FutureBuilder<DashboardData>(
        future: dashboardFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (!snapshot.hasData) {
            return const Center(
              child: AppText('Não foi possível carregar os dados.'),
            );
          }

          final data = snapshot.data!;

          if (selectedIndex == 1) {
            return const CatalogPage();
          }

          if (selectedIndex == 2) {
            return const MyBadgesPage();
          }

          if (selectedIndex == 3) {
            return const GamificationPage();
          }

          if (selectedIndex == 4) {
            return ProfilePage(
              data: data,
              onLogout: widget.onLoggedOut ?? () {},
            );
          }

          return _HomeContent(
            data: data,
            onOpenCatalog: () {
              AppNavigationController.select(
                AppBottomNavigationDestination.catalog,
              );
            },
          );
        },
      ),
      bottomNavigationBar: AppBottomNavigation(
        currentDestination:
            AppBottomNavigationDestination.values[selectedIndex],
        onDestinationSelected: (destination) {
          AppNavigationController.select(destination);
        },
      ),
    );
  }
}

class _HomeContent extends StatelessWidget {
  const _HomeContent({required this.data, required this.onOpenCatalog});

  final DashboardData data;
  final VoidCallback onOpenCatalog;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final horizontalPadding = constraints.maxWidth < 380 ? 16.0 : 24.0;

        return SafeArea(
          bottom: false,
          child: SingleChildScrollView(
            padding: const EdgeInsets.only(bottom: 22),
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 560),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _HeaderCard(data: data),
                    const SizedBox(height: 16),
                    Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal: horizontalPadding,
                      ),
                      child: Column(
                        children: [
                          if (_reachedMilestone(data.badgesWon) != null) ...[
                            _MilestoneBanner(
                              milestone: _reachedMilestone(data.badgesWon)!,
                            ),
                            const SizedBox(height: 18),
                          ],
                          _StatsRow(data: data),
                          const SizedBox(height: 18),
                          _LearningPathCard(data: data),
                          const SizedBox(height: 20),
                          _NoticeCard(data: data),
                          const SizedBox(height: 22),
                          _AchievementCard(data: data),
                          const SizedBox(height: 22),
                          _SectionTitle(onOpenCatalog: onOpenCatalog),
                          const SizedBox(height: 14),
                          const _SuggestionCard(),
                          const SizedBox(height: 16),
                          for (final badge in data.recommendations) ...[
                            _RecommendationCard(
                              badge: badge,
                              onOpenCatalog: onOpenCatalog,
                            ),
                            const SizedBox(height: 16),
                          ],
                          _ExploreButton(onPressed: onOpenCatalog),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

int? _reachedMilestone(int badges) {
  const milestones = [1, 3, 5, 10, 15, 25, 50];
  for (final milestone in milestones.reversed) {
    if (badges >= milestone) return milestone;
  }
  return null;
}

class _MilestoneBanner extends StatelessWidget {
  const _MilestoneBanner({required this.milestone});
  final int milestone;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF6B4EFF), Color(0xFF006DAA)],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const Icon(Icons.celebration_outlined, color: Colors.white, size: 32),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AppText(
                  'Marco alcançado!',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                AppText(
                  'Parabéns por conquistar $milestone badge${milestone == 1 ? '' : 's'}. Continue a evoluir!',
                  style: const TextStyle(
                    color: Color(0xE6FFFFFF),
                    fontSize: 13,
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

class _HeaderCard extends StatelessWidget {
  const _HeaderCard({required this.data});

  final DashboardData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.fromLTRB(16, 12, 16, 0),
      padding: const EdgeInsets.fromLTRB(22, 20, 18, 22),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF005C9A), Color(0xFF0077B6), Color(0xFF0088B8)],
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: const [
          BoxShadow(
            color: Color(0x26006DAA),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const AppText(
                      'Softinsa Badges',
                      style: TextStyle(
                        color: Color(0xCFFFFFFF),
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 18),
                    AppText(
                      data.greeting,
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    ),
                    const SizedBox(height: 6),
                    AppText(
                      data.userName,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 26,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    if (data.userRole.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      AppText(
                        data.userRole,
                        style: const TextStyle(
                          color: Color(0xFFE6F5FF),
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const _NotificationButton(),
            ],
          ),
          const SizedBox(height: 28),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 18),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(18),
              color: Colors.white.withValues(alpha: 0.14),
              border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const AppText(
                        'Total de Pontos',
                        style: TextStyle(
                          color: Color(0xFFE6F5FF),
                          fontSize: 14,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          AppText(
                            '${data.totalPoints}',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(width: 8),
                          const Icon(
                            Icons.trending_up,
                            color: Color(0xFF3AE981),
                            size: 18,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 52,
                  height: 52,
                  decoration: const BoxDecoration(
                    color: Color(0xFF4E9AC1),
                    borderRadius: BorderRadius.all(Radius.circular(18)),
                  ),
                  child: const Icon(
                    Icons.workspace_premium_outlined,
                    color: Colors.white,
                    size: 30,
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

class _NotificationButton extends StatefulWidget {
  const _NotificationButton();

  @override
  State<_NotificationButton> createState() => _NotificationButtonState();
}

class _NotificationButtonState extends State<_NotificationButton> {
  final MobileApiRepository repository = MobileApiRepository();
  late Future<int> unreadCountFuture;

  @override
  void initState() {
    super.initState();
    unreadCountFuture = _loadUnreadCount();
  }

  Future<int> _loadUnreadCount() async {
    final notifications = await repository.getNotifications();
    return notifications.where((item) => item.unread).length;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<int>(
      future: unreadCountFuture,
      builder: (context, snapshot) {
        final unreadCount = snapshot.data ?? 0;

        return InkWell(
          onTap: () async {
            await Navigator.of(context).push(
              MaterialPageRoute(
                builder: (context) => const NotificationsPage(),
              ),
            );
            if (mounted) {
              setState(() {
                unreadCountFuture = _loadUnreadCount();
              });
            }
          },
          borderRadius: BorderRadius.circular(999),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: const BoxDecoration(
                  color: Color(0xFF4E9AC1),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_none,
                  color: Colors.white,
                  size: 22,
                ),
              ),
              if (unreadCount > 0)
                Positioned(
                  top: -3,
                  right: -3,
                  child: Container(
                    width: 18,
                    height: 18,
                    alignment: Alignment.center,
                    decoration: const BoxDecoration(
                      color: Color(0xFFFF3B48),
                      shape: BoxShape.circle,
                    ),
                    child: AppText(
                      unreadCount > 9 ? '9+' : '$unreadCount',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}

class _LearningPathCard extends StatelessWidget {
  const _LearningPathCard({required this.data});

  final DashboardData data;

  @override
  Widget build(BuildContext context) {
    final percentage = (data.learningPathProgress * 100).round();

    return _CardShell(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(
                Icons.track_changes,
                color: Color(0xFF0067FF),
                size: 20,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppText(
                      data.learningPathTitle,
                      style: const TextStyle(
                        color: Color(0xFF111827),
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 3),
                    const AppText(
                      'Continue a evoluir no seu percurso técnico',
                      style: TextStyle(color: Color(0xFF667085), fontSize: 12),
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: const Color(0xFFEAF2FF),
                  borderRadius: BorderRadius.circular(999),
                ),
                child: AppText(
                  '$percentage%',
                  style: const TextStyle(
                    color: Color(0xFF005DFF),
                    fontSize: 12,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              minHeight: 11,
              value: data.learningPathProgress,
              color: const Color(0xFF1F6BFF),
              backgroundColor: const Color(0xFFE8ECF2),
            ),
          ),
        ],
      ),
    );
  }
}

class _NoticeCard extends StatelessWidget {
  const _NoticeCard({required this.data});

  final DashboardData data;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFCF0),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFFFCC30)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 30,
            height: 30,
            decoration: const BoxDecoration(
              color: Color(0xFFFFF0BD),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.notifications_none,
              color: Color(0xFFFF7A00),
              size: 19,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppText(
                  data.noticeTitle,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 6),
                AppText(
                  data.noticeMessage,
                  style: const TextStyle(
                    color: Color(0xFF263244),
                    fontSize: 14,
                    height: 1.35,
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

class _AchievementCard extends StatelessWidget {
  const _AchievementCard({required this.data});

  final DashboardData data;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => const SpecialAchievementsPage(),
          ),
        );
      },
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF006DAA),
          borderRadius: BorderRadius.circular(8),
          boxShadow: const [
            BoxShadow(
              color: Color(0x33006DAA),
              offset: Offset(0, 8),
              blurRadius: 16,
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.emoji_events_outlined,
                color: Colors.white,
                size: 27,
              ),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AppText(
                    data.specialAchievementTitle,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 5),
                  AppText(
                    data.specialAchievementMessage,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      height: 1.25,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white),
          ],
        ),
      ),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.onOpenCatalog});

  final VoidCallback onOpenCatalog;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.trending_up, color: Color(0xFF005DFF), size: 20),
        const SizedBox(width: 8),
        const Expanded(
          child: AppText(
            'Recomendado para Si',
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        TextButton(
          onPressed: onOpenCatalog,
          style: TextButton.styleFrom(
            foregroundColor: const Color(0xFF005DFF),
            padding: const EdgeInsets.symmetric(horizontal: 6),
            minimumSize: const Size(0, 32),
          ),
          child: const Row(
            children: [
              AppText('Ver Todas', style: TextStyle(fontSize: 12)),
              SizedBox(width: 2),
              Icon(Icons.chevron_right, size: 17),
            ],
          ),
        ),
      ],
    );
  }
}

class _SuggestionCard extends StatelessWidget {
  const _SuggestionCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: const Color(0xFF9BC7FF)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.track_changes, color: Color(0xFF005DFF), size: 20),
          SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppText(
                  'Sugestões Personalizadas',
                  style: TextStyle(
                    color: Color(0xFF12379F),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 6),
                AppText(
                  'Baseadas no seu progresso atual e na sua área: OutSystems',
                  style: TextStyle(
                    color: Color(0xFF005DFF),
                    fontSize: 13,
                    height: 1.35,
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

class _RecommendationCard extends StatelessWidget {
  const _RecommendationCard({required this.badge, required this.onOpenCatalog});

  final BadgeRecommendation badge;
  final VoidCallback onOpenCatalog;

  @override
  Widget build(BuildContext context) {
    return _CardShell(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 10, 12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _BadgeIcon(iconName: badge.iconName),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: AppText(
                              badge.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF101827),
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                height: 1.25,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          _LevelPill(level: badge.level),
                        ],
                      ),
                      if (badge.tag.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        _TagPill(text: badge.tag),
                      ],
                      const SizedBox(height: 8),
                      AppText(
                        badge.description,
                        style: const TextStyle(
                          color: Color(0xFF4B5563),
                          fontSize: 12,
                          height: 1.35,
                        ),
                      ),
                      const SizedBox(height: 10),
                      _BadgeMetaRow(
                        points: badge.points,
                        duration: badge.duration,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (badge.prerequisites.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
              child: _PrerequisitesBox(items: badge.prerequisites),
            ),
          const Divider(height: 1, color: Color(0xFFE8EDF3)),
          InkWell(
            onTap: onOpenCatalog,
            borderRadius: const BorderRadius.only(
              bottomLeft: Radius.circular(10),
              bottomRight: Radius.circular(10),
            ),
            child: const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16, vertical: 13),
              child: Row(
                children: [
                  Expanded(
                    child: AppText(
                      'Ver detalhes do badge',
                      style: TextStyle(color: Color(0xFF4B5563), fontSize: 12),
                    ),
                  ),
                  Icon(Icons.chevron_right, color: Color(0xFF98A2B3), size: 18),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _BadgeIcon extends StatelessWidget {
  const _BadgeIcon({required this.iconName});

  final String iconName;

  @override
  Widget build(BuildContext context) {
    Widget icon;

    if (iconName == 'outsystems') {
      icon = Container(
        width: 22,
        height: 22,
        decoration: const BoxDecoration(
          color: Color(0xFFD91F26),
          shape: BoxShape.circle,
        ),
      );
    } else if (iconName == 'kubernetes') {
      icon = const Icon(Icons.hub_outlined, color: Colors.black, size: 26);
    } else {
      icon = const Icon(Icons.cloud_queue, color: Color(0xFFB8C7D9), size: 28);
    }

    return Container(
      width: 50,
      height: 50,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xFFF5F7FF),
        borderRadius: BorderRadius.circular(8),
      ),
      child: icon,
    );
  }
}

class _LevelPill extends StatelessWidget {
  const _LevelPill({required this.level});

  final String level;

  @override
  Widget build(BuildContext context) {
    final isLevelA = level.contains('A');

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: isLevelA ? const Color(0xFFEF35A6) : const Color(0xFFFF6B00),
        borderRadius: BorderRadius.circular(999),
      ),
      child: AppText(
        level,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _TagPill extends StatelessWidget {
  const _TagPill({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    final isRelated = text == 'Relacionado';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: isRelated ? const Color(0xFFF1E5FF) : const Color(0xFFDDEBFF),
        borderRadius: BorderRadius.circular(6),
      ),
      child: AppText(
        text,
        style: TextStyle(
          color: isRelated ? const Color(0xFF7624CA) : const Color(0xFF005DFF),
          fontSize: 11,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}

class _BadgeMetaRow extends StatelessWidget {
  const _BadgeMetaRow({required this.points, required this.duration});

  final int points;
  final String duration;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        const Icon(Icons.star_border, color: Color(0xFF005DFF), size: 14),
        const SizedBox(width: 3),
        AppText(
          '$points pontos',
          style: const TextStyle(color: Color(0xFF667085), fontSize: 11),
        ),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 10),
          child: AppText(
            '•',
            style: TextStyle(color: Color(0xFF667085), fontSize: 11),
          ),
        ),
        Flexible(
          child: AppText(
            duration,
            style: const TextStyle(color: Color(0xFF667085), fontSize: 11),
          ),
        ),
      ],
    );
  }
}

class _PrerequisitesBox extends StatelessWidget {
  const _PrerequisitesBox({required this.items});

  final List<String> items;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: const Color(0xFFFAFBFC),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFD9DEE8)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const AppText(
            'Pré-requisitos:',
            style: TextStyle(color: Color(0xFF4B5563), fontSize: 10),
          ),
          const SizedBox(height: 6),
          for (final item in items)
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 6,
                  height: 6,
                  margin: const EdgeInsets.only(top: 5, right: 6),
                  decoration: const BoxDecoration(
                    color: Color(0xFF19C37D),
                    shape: BoxShape.circle,
                  ),
                ),
                Expanded(
                  child: AppText(
                    item,
                    style: const TextStyle(
                      color: Color(0xFF4B5563),
                      fontSize: 10,
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}

class _ExploreButton extends StatelessWidget {
  const _ExploreButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 46,
      child: OutlinedButton(
        onPressed: onPressed,
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFF4B5563),
          side: const BorderSide(color: Color(0xFFC5CCD8)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(10),
          ),
        ),
        child: const AppText('Explorar Mais Badges'),
      ),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({required this.data});

  final DashboardData data;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _StatCard(
            icon: Icons.workspace_premium_outlined,
            number: '${data.badgesWon}',
            label: 'Badges ganhos',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCard(
            icon: Icons.bolt_outlined,
            number: '${data.inProgress}',
            label: 'Em progresso',
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _StatCard(
            icon: Icons.leaderboard_outlined,
            number: '${data.ranking}º',
            label: 'Ranking',
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.icon,
    required this.number,
    required this.label,
  });

  final IconData icon;
  final String number;
  final String label;

  @override
  Widget build(BuildContext context) {
    return _CardShell(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 14),
      child: Column(
        children: [
          Container(
            width: 34,
            height: 34,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: const Color(0xFFEAF5FF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFF006DAA), size: 19),
          ),
          const SizedBox(height: 10),
          AppText(
            number,
            style: const TextStyle(
              color: Color(0xFF005DFF),
              fontSize: 17,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          AppText(
            label,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(
              color: Color(0xFF4B5563),
              fontSize: 11,
              height: 1.2,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _CardShell extends StatelessWidget {
  const _CardShell({required this.child, required this.padding});

  final Widget child;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8EDF3)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0F101828),
            offset: Offset(0, 8),
            blurRadius: 18,
          ),
        ],
      ),
      child: child,
    );
  }
}
