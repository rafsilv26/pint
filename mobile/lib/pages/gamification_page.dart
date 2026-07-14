import 'package:flutter/material.dart';

import '../l10n/app_language.dart';
import '../models/mobile_api_data.dart';
import '../repositories/mobile_api_repository.dart';
import '../services/app_sync_service.dart';

class GamificationPage extends StatefulWidget {
  const GamificationPage({super.key});

  @override
  State<GamificationPage> createState() => _GamificationPageState();
}

class _GamificationPageState extends State<GamificationPage> {
  final MobileApiRepository repository = MobileApiRepository();
  late Future<GamificationData> gamificationFuture;

  @override
  void initState() {
    super.initState();
    gamificationFuture = repository.getGamification();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<GamificationData>(
      future: gamificationFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        final data = snapshot.data ?? GamificationData.empty();

        return SafeArea(
          bottom: false,
          child: RefreshIndicator(
            onRefresh: () async {
              await AppSyncService().synchronizeIfNeeded();
              final future = repository.getGamification();
              setState(() {
                gamificationFuture = future;
              });
              await future;
            },
            child: LayoutBuilder(
              builder: (context, constraints) {
                final horizontalPadding = constraints.maxWidth < 380
                    ? 16.0
                    : 24.0;

                return SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.only(bottom: 26),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: const BoxConstraints(maxWidth: 560),
                      child: Column(
                        children: [
                          _GamificationHeader(data: data),
                          Padding(
                            padding: EdgeInsets.symmetric(
                              horizontal: horizontalPadding,
                            ),
                            child: Column(
                              children: [
                                const SizedBox(height: 18),
                                _SpecialAchievementsGrid(
                                  achievements: data.achievements,
                                ),
                                const SizedBox(height: 22),
                                _LeaderboardSection(users: data.ranking),
                                const SizedBox(height: 22),
                                _ProfessionalEvolution(events: data.timeline),
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
          ),
        );
      },
    );
  }
}

class _GamificationHeader extends StatelessWidget {
  const _GamificationHeader({required this.data});

  final GamificationData data;

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
                    AppText(
                      'Gamification',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 21,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 4),
                    AppText(
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
            child: Row(
              children: [
                _HeaderStat(
                  title: 'A Sua Posição',
                  value: data.summary.rank > 0 ? '#${data.summary.rank}' : '-',
                ),
                _HeaderStat(title: 'Pontos', value: '${data.summary.points}'),
                _HeaderStat(title: 'Badges', value: '${data.summary.badges}'),
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
          AppText(
            title,
            style: const TextStyle(color: Color(0xD9FFFFFF), fontSize: 12),
          ),
          const SizedBox(height: 8),
          AppText(
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
  const _SpecialAchievementsGrid({required this.achievements});

  final List<GamificationAchievement> achievements;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionLabel(
          icon: Icons.star_border,
          text: 'Conquistas Especiais',
          iconColor: Color(0xFFFF9900),
        ),
        const SizedBox(height: 14),
        if (achievements.isEmpty)
          const _EmptyCard(text: 'Sem conquistas especiais sincronizadas.')
        else
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
              final color = _achievementColor(index);

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
                        color: color,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(
                        _iconFor(achievement.icon),
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 14),
                    AppText(
                      achievement.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF111827),
                        fontSize: 13,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Expanded(
                      child: AppText(
                        achievement.description,
                        maxLines: 3,
                        overflow: TextOverflow.ellipsis,
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
  const _LeaderboardSection({required this.users});

  final List<LeaderboardUser> users;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionLabel(
          icon: Icons.emoji_events_outlined,
          text: 'Top Consultores - Hybrid Cloud',
          iconColor: Color(0xFF005DFF),
        ),
        const SizedBox(height: 14),
        if (users.isEmpty)
          const _EmptyCard(text: 'Sem ranking local sincronizado.')
        else
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE0E5EE)),
            ),
            child: Column(
              children: [
                for (var index = 0; index < users.length; index++)
                  _LeaderboardRow(
                    user: users[index],
                    rank: users[index].rank > 0 ? users[index].rank : index + 1,
                    isLast: index == users.length - 1,
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

  final LeaderboardUser user;
  final int rank;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final rankText = rank == 1
        ? '1'
        : rank == 2
        ? '2'
        : rank == 3
        ? '3'
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
            child: AppText(
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
          _InitialsAvatar(name: user.name, highlighted: user.currentUser),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppText(
                  user.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: TextStyle(
                    color: user.currentUser
                        ? const Color(0xFF005DFF)
                        : const Color(0xFF111827),
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                AppText(
                  '${user.badges} badges',
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
              AppText(
                '${user.points}',
                style: const TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 14,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const AppText(
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
  const _ProfessionalEvolution({required this.events});

  final List<TimelineEventData> events;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _SectionLabel(
          icon: Icons.trending_up,
          text: 'Evolução Profissional',
          iconColor: Color(0xFF005DFF),
        ),
        const SizedBox(height: 14),
        if (events.isEmpty)
          const _EmptyCard(text: 'Sem eventos de evolução sincronizados.')
        else
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

  final TimelineEventData event;
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
              decoration: const BoxDecoration(
                color: Color(0xFFEAF3FF),
                shape: BoxShape.circle,
              ),
              child: Icon(_iconFor(event.icon), color: const Color(0xFF005DFF)),
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
                AppText(
                  event.title,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                if (event.description.isNotEmpty) ...[
                  const SizedBox(height: 5),
                  AppText(
                    event.description,
                    style: const TextStyle(
                      color: Color(0xFF475467),
                      fontSize: 11,
                    ),
                  ),
                ],
                const SizedBox(height: 6),
                AppText(
                  _formatDate(event.date),
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

class _InitialsAvatar extends StatelessWidget {
  const _InitialsAvatar({required this.name, required this.highlighted});

  final String name;
  final bool highlighted;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 34,
      height: 34,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: highlighted ? const Color(0xFF006DAA) : const Color(0xFFEAF3FF),
        shape: BoxShape.circle,
      ),
      child: AppText(
        _initials(name),
        style: TextStyle(
          color: highlighted ? Colors.white : const Color(0xFF006DAA),
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
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
          child: AppText(
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

class _EmptyCard extends StatelessWidget {
  const _EmptyCard({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE0E5EE)),
      ),
      child: AppText(
        text,
        style: const TextStyle(color: Color(0xFF667085), fontSize: 13),
      ),
    );
  }
}

IconData _iconFor(String value) {
  final normalized = value.toLowerCase();
  if (normalized.contains('badge') ||
      normalized.contains('premium') ||
      normalized.contains('workspace')) {
    return Icons.workspace_premium_outlined;
  }
  if (normalized.contains('rank') || normalized.contains('trophy')) {
    return Icons.emoji_events_outlined;
  }
  if (normalized.contains('timeline') || normalized.contains('trend')) {
    return Icons.trending_up;
  }
  if (normalized.contains('star')) {
    return Icons.star_border;
  }
  return Icons.auto_awesome;
}

Color _achievementColor(int index) {
  const colors = [
    Color(0xFFFF9900),
    Color(0xFF00A651),
    Color(0xFF5C6CFF),
    Color(0xFFE681DB),
  ];
  return colors[index % colors.length];
}

String _initials(String name) {
  final parts = name
      .trim()
      .split(RegExp(r'\s+'))
      .where((part) => part.isNotEmpty)
      .toList();
  if (parts.isEmpty) {
    return '?';
  }
  return parts.take(2).map((part) => part[0].toUpperCase()).join();
}

String _formatDate(DateTime? date) {
  if (date == null) {
    return '';
  }

  final local = date.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  return '$day/$month/${local.year}';
}
