import 'package:flutter/material.dart';

import '../models/mobile_api_data.dart';
import '../repositories/mobile_api_repository.dart';

class CatalogPage extends StatefulWidget {
  const CatalogPage({super.key});

  @override
  State<CatalogPage> createState() => _CatalogPageState();
}

class _CatalogPageState extends State<CatalogPage> {
  final MobileApiRepository repository = MobileApiRepository();
  final TextEditingController searchController = TextEditingController();
  late Future<List<CatalogBadge>> badgesFuture;
  String query = '';
  String filter = 'todos';

  @override
  void initState() {
    super.initState();
    badgesFuture = repository.getCatalogBadges();
  }

  @override
  void dispose() {
    searchController.dispose();
    super.dispose();
  }

  Future<void> reload() async {
    final future = repository.getCatalogBadges();
    setState(() {
      badgesFuture = future;
    });
    await future;
  }

  Future<bool> submitApplication(CatalogBadge badge) async {
    try {
      await repository.submitCandidatura(badge.id);
      await reload();
      if (!mounted) {
        return true;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Candidatura submetida com sucesso.')),
      );
      return true;
    } catch (_) {
      if (!mounted) {
        return false;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível submeter candidatura.')),
      );
      return false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<CatalogBadge>>(
      future: badgesFuture,
      builder: (context, snapshot) {
        final badges = snapshot.data ?? const <CatalogBadge>[];
        final filtered = badges.where((badge) {
          final text =
              '${badge.title} ${badge.description} ${badge.area} '
                      '${badge.level} ${badge.provider}'
                  .toLowerCase();
          final matchesQuery = text.contains(query.toLowerCase());
          final matchesFilter = switch (filter) {
            'disponiveis' => !badge.hasApplication,
            'candidaturas' => badge.hasApplication,
            _ => true,
          };
          return matchesQuery && matchesFilter;
        }).toList();

        return SafeArea(
          bottom: false,
          child: Column(
            children: [
              _CatalogHeader(
                controller: searchController,
                total: badges.length,
                queryChanged: (value) {
                  setState(() {
                    query = value;
                  });
                },
              ),
              _CatalogFilters(
                selected: filter,
                onChanged: (value) {
                  setState(() {
                    filter = value;
                  });
                },
              ),
              Expanded(
                child: snapshot.connectionState == ConnectionState.waiting
                    ? const Center(child: CircularProgressIndicator())
                    : RefreshIndicator(
                        onRefresh: reload,
                        child: _CatalogList(
                          badges: filtered,
                          onTap: (badge) {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) => BadgeDetailPage(
                                  badge: badge,
                                  onApply: () => submitApplication(badge),
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
    );
  }
}

class _CatalogHeader extends StatelessWidget {
  const _CatalogHeader({
    required this.controller,
    required this.total,
    required this.queryChanged,
  });

  final TextEditingController controller;
  final int total;
  final ValueChanged<String> queryChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(22, 18, 22, 20),
      decoration: const BoxDecoration(
        color: Color(0xFF006DAA),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(22),
          bottomRight: Radius.circular(22),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Catálogo de Badges',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '$total badges sincronizados',
            style: const TextStyle(color: Color(0xD9FFFFFF), fontSize: 13),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            onChanged: queryChanged,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'Pesquisar badges...',
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

class _CatalogFilters extends StatelessWidget {
  const _CatalogFilters({required this.selected, required this.onChanged});

  final String selected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    const filters = [
      ('todos', 'Todos'),
      ('disponiveis', 'Disponíveis'),
      ('candidaturas', 'Em candidatura'),
    ];

    return Container(
      color: const Color(0xFFF4F7FB),
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            for (final item in filters) ...[
              ChoiceChip(
                label: Text(item.$2),
                selected: selected == item.$1,
                onSelected: (_) => onChanged(item.$1),
                selectedColor: const Color(0xFFEAF3FF),
                labelStyle: TextStyle(
                  color: selected == item.$1
                      ? const Color(0xFF005DFF)
                      : const Color(0xFF475467),
                  fontWeight: FontWeight.w700,
                ),
                side: BorderSide(
                  color: selected == item.$1
                      ? const Color(0xFFB6D2FF)
                      : const Color(0xFFE0E5EE),
                ),
              ),
              const SizedBox(width: 8),
            ],
          ],
        ),
      ),
    );
  }
}

class _CatalogList extends StatelessWidget {
  const _CatalogList({required this.badges, required this.onTap});

  final List<CatalogBadge> badges;
  final ValueChanged<CatalogBadge> onTap;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final horizontalPadding = constraints.maxWidth < 380 ? 16.0 : 22.0;

        return ListView(
          padding: EdgeInsets.fromLTRB(
            horizontalPadding,
            14,
            horizontalPadding,
            28,
          ),
          children: [
            if (badges.isEmpty)
              const _EmptyCatalog()
            else
              for (final badge in badges) ...[
                _CatalogBadgeCard(badge: badge, onTap: () => onTap(badge)),
                const SizedBox(height: 14),
              ],
          ],
        );
      },
    );
  }
}

class _CatalogBadgeCard extends StatelessWidget {
  const _CatalogBadgeCard({required this.badge, required this.onTap});

  final CatalogBadge badge;
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
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _BadgeIconBox(imagePath: badge.imagePath, fallback: badge.type),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          badge.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF111827),
                            fontSize: 16,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      if (badge.hasApplication)
                        _StatusPill(text: badge.applicationStatus),
                    ],
                  ),
                  const SizedBox(height: 7),
                  Text(
                    badge.description,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF475467),
                      fontSize: 13,
                      height: 1.35,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _MetaPill(
                        icon: Icons.star_border,
                        text: '${badge.points} pts',
                      ),
                      if (badge.level.isNotEmpty)
                        _MetaPill(
                          icon: Icons.layers_outlined,
                          text: badge.level,
                        ),
                      if (badge.area.isNotEmpty)
                        _MetaPill(icon: Icons.work_outline, text: badge.area),
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

class BadgeDetailPage extends StatelessWidget {
  const BadgeDetailPage({
    super.key,
    required this.badge,
    required this.onApply,
  });

  final CatalogBadge badge;
  final Future<bool> Function() onApply;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: SafeArea(
        bottom: false,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 28),
          children: [
            TextButton.icon(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back, size: 18),
              label: const Text('Voltar'),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF006DAA),
                alignment: Alignment.centerLeft,
                padding: EdgeInsets.zero,
              ),
            ),
            const SizedBox(height: 8),
            _DetailCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _BadgeIconBox(
                        imagePath: badge.imagePath,
                        fallback: badge.type,
                        size: 70,
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              badge.title,
                              style: const TextStyle(
                                color: Color(0xFF111827),
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: [
                                _MetaPill(
                                  icon: Icons.star_border,
                                  text: '${badge.points} pontos',
                                ),
                                if (badge.level.isNotEmpty)
                                  _MetaPill(
                                    icon: Icons.layers_outlined,
                                    text: badge.level,
                                  ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  Text(
                    badge.description.isNotEmpty
                        ? badge.description
                        : 'Sem descrição local sincronizada.',
                    style: const TextStyle(
                      color: Color(0xFF344054),
                      fontSize: 15,
                      height: 1.45,
                    ),
                  ),
                  const SizedBox(height: 18),
                  if (badge.area.isNotEmpty)
                    _InfoLine(icon: Icons.work_outline, text: badge.area),
                  if (badge.provider.isNotEmpty)
                    _InfoLine(
                      icon: Icons.business_outlined,
                      text: badge.provider,
                    ),
                  if (badge.duration.isNotEmpty)
                    _InfoLine(
                      icon: Icons.schedule_outlined,
                      text: badge.duration,
                    ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _DetailCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Requisitos',
                    style: TextStyle(
                      color: Color(0xFF111827),
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                    ),
                  ),
                  const SizedBox(height: 14),
                  if (badge.requirements.isEmpty)
                    const Text(
                      'Sem requisitos sincronizados para este badge.',
                      style: TextStyle(color: Color(0xFF667085)),
                    )
                  else
                    for (final requirement in badge.requirements)
                      _RequirementRow(text: requirement),
                ],
              ),
            ),
            const SizedBox(height: 18),
            SizedBox(
              height: 52,
              child: FilledButton.icon(
                onPressed: badge.hasApplication
                    ? null
                    : () async {
                        final success = await onApply();
                        if (success && context.mounted) {
                          Navigator.of(context).pop();
                        }
                      },
                icon: const Icon(Icons.send_outlined),
                label: Text(
                  badge.hasApplication
                      ? 'Candidatura já existente'
                      : 'Submeter candidatura',
                ),
                style: FilledButton.styleFrom(
                  backgroundColor: const Color(0xFF006DAA),
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: const Color(0xFF9BBFD4),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _BadgeIconBox extends StatelessWidget {
  const _BadgeIconBox({
    required this.imagePath,
    required this.fallback,
    this.size = 56,
  });

  final String imagePath;
  final String fallback;
  final double size;

  @override
  Widget build(BuildContext context) {
    final trimmed = imagePath.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(14),
        child: Image.network(
          trimmed,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) =>
              _FallbackIcon(size: size, fallback: fallback),
        ),
      );
    }

    return _FallbackIcon(size: size, fallback: fallback);
  }
}

class _FallbackIcon extends StatelessWidget {
  const _FallbackIcon({required this.size, required this.fallback});

  final double size;
  final String fallback;

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
        _iconFor(fallback),
        color: const Color(0xFF006DAA),
        size: size * 0.5,
      ),
    );
  }
}

class _MetaPill extends StatelessWidget {
  const _MetaPill({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F5F9),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: const Color(0xFF475467), size: 13),
          const SizedBox(width: 4),
          Text(
            text,
            style: const TextStyle(
              color: Color(0xFF475467),
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class _StatusPill extends StatelessWidget {
  const _StatusPill({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: const Color(0xFFFFF7E8),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Color(0xFFB45309),
          fontSize: 10,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _DetailCard extends StatelessWidget {
  const _DetailCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE0E5EE)),
      ),
      child: child,
    );
  }
}

class _InfoLine extends StatelessWidget {
  const _InfoLine({required this.icon, required this.text});

  final IconData icon;
  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF006DAA), size: 18),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Color(0xFF475467), fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _RequirementRow extends StatelessWidget {
  const _RequirementRow({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(
            Icons.check_circle_outline,
            color: Color(0xFF00A651),
            size: 18,
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(color: Color(0xFF344054), fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyCatalog extends StatelessWidget {
  const _EmptyCatalog();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE0E5EE)),
      ),
      child: const Text(
        'Sem badges de catálogo sincronizados.',
        style: TextStyle(color: Color(0xFF667085), fontSize: 14),
      ),
    );
  }
}

IconData _iconFor(String value) {
  final normalized = value.toLowerCase();
  if (normalized.contains('cloud') ||
      normalized.contains('aws') ||
      normalized.contains('azure')) {
    return Icons.cloud_outlined;
  }
  if (normalized.contains('security') || normalized.contains('cyber')) {
    return Icons.shield_outlined;
  }
  if (normalized.contains('form') || normalized.contains('learning')) {
    return Icons.school_outlined;
  }
  return Icons.workspace_premium_outlined;
}
