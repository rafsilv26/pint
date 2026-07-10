import 'package:flutter/material.dart';

import '../models/consultant_profile.dart';
import '../models/mobile_api_data.dart';
import '../repositories/mobile_api_repository.dart';
import '../widgets/app_bottom_navigation.dart';
import 'consultant_detail_page.dart';

class ConsultantsDirectoryPage extends StatefulWidget {
  const ConsultantsDirectoryPage({super.key});

  @override
  State<ConsultantsDirectoryPage> createState() =>
      _ConsultantsDirectoryPageState();
}

class _ConsultantsDirectoryPageState extends State<ConsultantsDirectoryPage> {
  final MobileApiRepository repository = MobileApiRepository();
  final TextEditingController searchController = TextEditingController();
  late Future<ConsultantsDirectoryData> directoryFuture;
  String query = '';

  @override
  void initState() {
    super.initState();
    directoryFuture = repository.getConsultantsDirectory();
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: FutureBuilder<ConsultantsDirectoryData>(
        future: directoryFuture,
        builder: (context, snapshot) {
          final directory = snapshot.data ?? ConsultantsDirectoryData.empty();
          final filteredConsultants = directory.consultants.where((consultant) {
            final text =
                '${consultant.name} ${consultant.role} ${consultant.area} '
                        '${consultant.serviceLine} ${consultant.email}'
                    .toLowerCase();
            return text.contains(query.toLowerCase());
          }).toList();

          return SafeArea(
            bottom: false,
            child: Column(
              children: [
                _DirectoryHeader(
                  controller: searchController,
                  total: directory.stats.consultants,
                  onChanged: (value) {
                    setState(() {
                      query = value;
                    });
                  },
                ),
                Expanded(
                  child: snapshot.connectionState == ConnectionState.waiting
                      ? const Center(child: CircularProgressIndicator())
                      : RefreshIndicator(
                          onRefresh: () async {
                            final future = repository.getConsultantsDirectory();
                            setState(() {
                              directoryFuture = future;
                            });
                            await future;
                          },
                          child: _DirectoryList(
                            consultants: filteredConsultants,
                            stats: directory.stats,
                            onConsultantTap: (consultant) {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (context) => ConsultantDetailPage(
                                    consultant: consultant,
                                  ),
                                ),
                              );
                            },
                          ),
                        ),
                ),
              ],
            ),
          );
        },
      ),
      bottomNavigationBar: AppBottomNavigation(
        currentDestination: AppBottomNavigationDestination.profile,
        onDestinationSelected: (destination) {
          AppNavigationController.open(context, destination);
        },
      ),
    );
  }
}

class _DirectoryHeader extends StatelessWidget {
  const _DirectoryHeader({
    required this.controller,
    required this.total,
    required this.onChanged,
  });

  final TextEditingController controller;
  final int total;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(22, 16, 22, 18),
      color: const Color(0xFF006DAA),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextButton.icon(
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
          const SizedBox(height: 12),
          Row(
            children: [
              const _HeaderIcon(),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Consultores',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 24,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 3),
                    Text(
                      '$total consultores',
                      style: const TextStyle(
                        color: Color(0xD9FFFFFF),
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          TextField(
            controller: controller,
            onChanged: onChanged,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Pesquisar consultores...',
              hintStyle: const TextStyle(color: Color(0xD9FFFFFF)),
              prefixIcon: const Icon(Icons.search, color: Colors.white),
              contentPadding: const EdgeInsets.symmetric(vertical: 13),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(999),
                borderSide: const BorderSide(color: Color(0xB3FFFFFF)),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(999),
                borderSide: const BorderSide(color: Colors.white, width: 1.4),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _DirectoryList extends StatelessWidget {
  const _DirectoryList({
    required this.consultants,
    required this.stats,
    required this.onConsultantTap,
  });

  final List<ConsultantProfile> consultants;
  final ConsultantsDirectoryStats stats;
  final ValueChanged<ConsultantProfile> onConsultantTap;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final horizontalPadding = constraints.maxWidth < 380 ? 16.0 : 22.0;

        return SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            horizontalPadding,
            18,
            horizontalPadding,
            28,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Column(
                children: [
                  _DirectoryStats(stats: stats),
                  const SizedBox(height: 18),
                  if (consultants.isEmpty)
                    const Padding(
                      padding: EdgeInsets.only(top: 40),
                      child: Text(
                        'Nenhum consultor encontrado.',
                        style: TextStyle(color: Color(0xFF667085)),
                      ),
                    )
                  else
                    for (final consultant in consultants) ...[
                      _ConsultantListCard(
                        consultant: consultant,
                        onTap: () => onConsultantTap(consultant),
                      ),
                      const SizedBox(height: 14),
                    ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _DirectoryStats extends StatelessWidget {
  const _DirectoryStats({required this.stats});

  final ConsultantsDirectoryStats stats;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      decoration: BoxDecoration(
        color: const Color(0xFFF6F8FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFB6D2FF)),
      ),
      child: Row(
        children: [
          Expanded(
            child: _DirectoryStat(
              value: '${stats.consultants}',
              label: 'Consultores',
            ),
          ),
          Expanded(
            child: _DirectoryStat(
              value: '${stats.badgesTotal}',
              label: 'Badges Total',
            ),
          ),
          Expanded(
            child: _DirectoryStat(
              value: '${stats.specialsTotal}',
              label: 'Especiais',
            ),
          ),
        ],
      ),
    );
  }
}

class _DirectoryStat extends StatelessWidget {
  const _DirectoryStat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    final color = label == 'Badges Total'
        ? const Color(0xFF8B35FF)
        : label == 'Especiais'
        ? const Color(0xFFFF4E00)
        : const Color(0xFF005DFF);

    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            color: color,
            fontSize: 19,
            fontWeight: FontWeight.w800,
          ),
        ),
        const SizedBox(height: 5),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xFF475467), fontSize: 11),
        ),
      ],
    );
  }
}

class _ConsultantListCard extends StatelessWidget {
  const _ConsultantListCard({required this.consultant, required this.onTap});

  final ConsultantProfile consultant;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE0E5EE)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x12101828),
              blurRadius: 14,
              offset: Offset(0, 7),
            ),
          ],
        ),
        child: Row(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                _ConsultantAvatar(consultant: consultant, size: 56),
                Positioned(
                  top: -7,
                  right: -7,
                  child: _RankBubble(rank: consultant.rank),
                ),
              ],
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          consultant.name,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF111827),
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      if (consultant.isCurrentUser)
                        Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 3,
                          ),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEAF3FF),
                            borderRadius: BorderRadius.circular(999),
                          ),
                          child: const Text(
                            'Você',
                            style: TextStyle(
                              color: Color(0xFF005DFF),
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    consultant.role,
                    style: const TextStyle(
                      color: Color(0xFF475467),
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  _AreaPill(text: consultant.area),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 12,
                    runSpacing: 6,
                    children: [
                      _MiniMetric(
                        icon: Icons.location_on_outlined,
                        text: consultant.location,
                      ),
                      _MiniMetric(
                        icon: Icons.trending_up,
                        text: '${consultant.points} pts',
                        color: const Color(0xFF005DFF),
                      ),
                      _MiniMetric(
                        icon: Icons.workspace_premium_outlined,
                        text: '${consultant.badges}',
                        color: const Color(0xFF8B35FF),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right, color: Color(0xFF98A2B3)),
          ],
        ),
      ),
    );
  }
}

class _HeaderIcon extends StatelessWidget {
  const _HeaderIcon();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 42,
      height: 42,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.18),
        borderRadius: BorderRadius.circular(13),
      ),
      child: const Icon(Icons.groups_2_outlined, color: Colors.white),
    );
  }
}

class _RankBubble extends StatelessWidget {
  const _RankBubble({required this.rank});

  final int rank;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 26,
      height: 26,
      alignment: Alignment.center,
      decoration: const BoxDecoration(
        color: Color(0xFF2F8AB9),
        shape: BoxShape.circle,
      ),
      child: Text(
        '$rank',
        style: const TextStyle(
          color: Colors.white,
          fontSize: 11,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _ConsultantAvatar extends StatelessWidget {
  const _ConsultantAvatar({required this.consultant, required this.size});

  final ConsultantProfile consultant;
  final double size;

  @override
  Widget build(BuildContext context) {
    final imagePath = consultant.imagePath.trim();
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Image.network(
          imagePath,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _ConsultantAvatarFallback(size: size);
          },
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(14),
      child: Image.asset(
        imagePath,
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return _ConsultantAvatarFallback(size: size);
        },
      ),
    );
  }
}

class _ConsultantAvatarFallback extends StatelessWidget {
  const _ConsultantAvatarFallback({required this.size});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xFFEAF3FF),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Icon(
        Icons.person,
        color: const Color(0xFF006DAA),
        size: size * 0.5,
      ),
    );
  }
}

class _AreaPill extends StatelessWidget {
  const _AreaPill({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: Color(0xFF475467),
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _MiniMetric extends StatelessWidget {
  const _MiniMetric({
    required this.icon,
    required this.text,
    this.color = const Color(0xFF667085),
  });

  final IconData icon;
  final String text;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, color: color, size: 13),
        const SizedBox(width: 3),
        Text(text, style: TextStyle(color: color, fontSize: 11)),
      ],
    );
  }
}
