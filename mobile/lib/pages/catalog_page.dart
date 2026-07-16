import 'dart:async';

import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:url_launcher/url_launcher.dart';

import '../l10n/app_language.dart';
import '../models/mobile_api_data.dart';
import '../repositories/mobile_api_repository.dart';
import '../services/app_data_refresh_service.dart';
import '../services/badges_api_service.dart';
import '../services/app_sync_service.dart';

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
    AppDataRefreshService.instance.addListener(handleDataChanged);
  }

  @override
  void dispose() {
    AppDataRefreshService.instance.removeListener(handleDataChanged);
    searchController.dispose();
    super.dispose();
  }

  void handleDataChanged() {
    unawaited(reloadLocal());
  }

  Future<void> reload({bool force = false}) async {
    await AppSyncService().synchronizeIfNeeded(force: force);
    await reloadLocal();
  }

  Future<void> reloadLocal() async {
    if (!mounted) {
      return;
    }
    final future = repository.getCatalogBadges();
    setState(() {
      badgesFuture = future;
    });
    await future;
  }

  Future<bool> submitApplication(
    CatalogBadge badge,
    List<EvidenceAttachment> evidenceFiles,
  ) async {
    try {
      final result = await repository.submitCandidatura(
        badgeId: badge.id,
        evidenceFiles: evidenceFiles,
      );
      if (!mounted) {
        return true;
      }
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: AppText(result.message)));
      if (result.isQueued) {
        unawaited(reloadLocal());
      } else {
        unawaited(reload(force: true));
      }
      return true;
    } on ApiRequestException catch (error) {
      if (!mounted) {
        return false;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: AppText(
            error.message ?? 'Não foi possível submeter candidatura.',
          ),
        ),
      );
      return false;
    } catch (_) {
      if (!mounted) {
        return false;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: AppText('Não foi possível submeter candidatura.'),
        ),
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
                                  onApply: (evidenceFiles) =>
                                      submitApplication(badge, evidenceFiles),
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
          const AppText(
            'Catálogo de Badges',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          AppText(
            '$total badges sincronizados',
            style: const TextStyle(color: Color(0xD9FFFFFF), fontSize: 13),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            onChanged: queryChanged,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: context.tr('Pesquisar badges...'),
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
                label: AppText(item.$2),
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
                        child: AppText(
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
                  AppText(
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
                  LayoutBuilder(
                    builder: (context, constraints) => Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _MetaPill(
                          icon: Icons.star_border,
                          text: '${badge.points} pts',
                          maxWidth: constraints.maxWidth,
                        ),
                        if (badge.level.isNotEmpty)
                          _MetaPill(
                            icon: Icons.layers_outlined,
                            text: badge.level,
                            maxWidth: constraints.maxWidth,
                          ),
                        if (badge.area.isNotEmpty)
                          _MetaPill(
                            icon: Icons.work_outline,
                            text: badge.area,
                            maxWidth: constraints.maxWidth,
                          ),
                      ],
                    ),
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
  final Future<bool> Function(List<EvidenceAttachment> evidenceFiles) onApply;

  @override
  Widget build(BuildContext context) {
    final application = badge.application;

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
              label: const AppText('Voltar'),
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
                            AppText(
                              badge.title,
                              style: const TextStyle(
                                color: Color(0xFF111827),
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 8),
                            LayoutBuilder(
                              builder: (context, constraints) => Wrap(
                                spacing: 8,
                                runSpacing: 8,
                                children: [
                                  _MetaPill(
                                    icon: Icons.star_border,
                                    text: '${badge.points} pontos',
                                    maxWidth: constraints.maxWidth,
                                  ),
                                  if (badge.level.isNotEmpty)
                                    _MetaPill(
                                      icon: Icons.layers_outlined,
                                      text: badge.level,
                                      maxWidth: constraints.maxWidth,
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  AppText(
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
                  Row(
                    children: [
                      const Expanded(
                        child: AppText(
                          'Requisitos',
                          style: TextStyle(
                            color: Color(0xFF111827),
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (badge.requirements.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    const AppText(
                      'Consulte a descrição de cada evidência necessária antes de iniciar a candidatura.',
                      style: TextStyle(
                        color: Color(0xFF667085),
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  if (badge.requirements.isEmpty)
                    const AppText(
                      'Este badge não tem requisitos sincronizados. Pode submeter a candidatura sem evidências.',
                      style: TextStyle(color: Color(0xFF667085)),
                    )
                  else
                    for (
                      var index = 0;
                      index < badge.requirements.length;
                      index++
                    )
                      Padding(
                        padding: EdgeInsets.only(
                          bottom: index == badge.requirements.length - 1
                              ? 0
                              : 12,
                        ),
                        child: _RequirementDescriptionTile(
                          number: index + 1,
                          requirement: badge.requirements[index],
                        ),
                      ),
                ],
              ),
            ),
            if (application != null) ...[
              const SizedBox(height: 16),
              _DetailCard(
                child: _SentEvidencesSection(application: application),
              ),
            ],
            if (!badge.hasApplication) ...[
              const SizedBox(height: 18),
              SizedBox(
                height: 52,
                child: FilledButton.icon(
                  onPressed: () async {
                    final submitted = await Navigator.of(context).push<bool>(
                      MaterialPageRoute(
                        builder: (context) => BadgeEvidenceSubmissionPage(
                          badge: badge,
                          onApply: onApply,
                        ),
                      ),
                    );
                    if (submitted == true && context.mounted) {
                      Navigator.of(context).pop(true);
                    }
                  },
                  icon: const Icon(Icons.arrow_forward),
                  label: const AppText('Candidatar a Badge'),
                  style: FilledButton.styleFrom(
                    backgroundColor: const Color(0xFF006DAA),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class BadgeEvidenceSubmissionPage extends StatefulWidget {
  const BadgeEvidenceSubmissionPage({
    super.key,
    required this.badge,
    required this.onApply,
  });

  final CatalogBadge badge;
  final Future<bool> Function(List<EvidenceAttachment> evidenceFiles) onApply;

  @override
  State<BadgeEvidenceSubmissionPage> createState() =>
      _BadgeEvidenceSubmissionPageState();
}

class _BadgeEvidenceSubmissionPageState
    extends State<BadgeEvidenceSubmissionPage> {
  final Map<int, PlatformFile> evidenceByRequirementId = {};
  bool isSubmitting = false;

  bool get hasRequirements => widget.badge.requirements.isNotEmpty;

  bool get allEvidenceSelected {
    if (!hasRequirements) {
      return true;
    }

    return widget.badge.requirements.every((requirement) {
      return requirement.id > 0 &&
          evidenceByRequirementId.containsKey(requirement.id);
    });
  }

  bool get canSubmit => !isSubmitting && allEvidenceSelected;

  Future<void> pickEvidence(CatalogRequirement requirement) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['pdf', 'jpg', 'jpeg', 'png'],
      allowMultiple: false,
      withData: false,
    );

    if (result == null || result.files.isEmpty) {
      return;
    }

    final file = result.files.single;
    if (file.path == null || file.path!.isEmpty) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: AppText('Não foi possível ler o ficheiro.')),
      );
      return;
    }

    setState(() {
      evidenceByRequirementId[requirement.id] = file;
    });
  }

  void removeEvidence(CatalogRequirement requirement) {
    setState(() {
      evidenceByRequirementId.remove(requirement.id);
    });
  }

  Future<void> submit() async {
    if (!canSubmit) {
      return;
    }

    setState(() {
      isSubmitting = true;
    });

    final evidenceFiles = widget.badge.requirements
        .map((requirement) {
          final file = evidenceByRequirementId[requirement.id];
          if (file == null || file.path == null) {
            return null;
          }

          return EvidenceAttachment(
            requirementId: requirement.id,
            path: file.path!,
            fileName: file.name,
          );
        })
        .whereType<EvidenceAttachment>()
        .toList();

    final success = await widget.onApply(evidenceFiles);
    if (!mounted) {
      return;
    }

    if (success) {
      Navigator.of(context).pop(true);
      return;
    }

    setState(() {
      isSubmitting = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final badge = widget.badge;
    final completedCount = evidenceByRequirementId.length;
    final totalCount = badge.requirements.length;

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
              label: const AppText('Voltar'),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF006DAA),
                alignment: Alignment.centerLeft,
                padding: EdgeInsets.zero,
              ),
            ),
            const SizedBox(height: 8),
            _DetailCard(
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _BadgeIconBox(
                    imagePath: badge.imagePath,
                    fallback: badge.type,
                    size: 58,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AppText(
                          badge.title,
                          style: const TextStyle(
                            color: Color(0xFF111827),
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 8),
                        AppText(
                          'Submeta as evidências exigidas pela API para esta candidatura.',
                          style: const TextStyle(
                            color: Color(0xFF667085),
                            fontSize: 13,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            _DetailCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Expanded(
                        child: AppText(
                          'Upload de Evidências',
                          style: TextStyle(
                            color: Color(0xFF111827),
                            fontSize: 18,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                      ),
                      if (hasRequirements)
                        _EvidenceProgressPill(
                          completed: completedCount,
                          total: totalCount,
                        ),
                    ],
                  ),
                  if (hasRequirements) ...[
                    const SizedBox(height: 8),
                    const AppText(
                      'Anexe um PDF, JPG ou PNG em cada requisito antes de submeter.',
                      style: TextStyle(
                        color: Color(0xFF667085),
                        fontSize: 13,
                        height: 1.35,
                      ),
                    ),
                  ],
                  const SizedBox(height: 14),
                  if (badge.requirements.isEmpty)
                    const AppText(
                      'Este badge não tem requisitos sincronizados. Pode submeter a candidatura sem evidências.',
                      style: TextStyle(color: Color(0xFF667085)),
                    )
                  else
                    for (
                      var index = 0;
                      index < badge.requirements.length;
                      index++
                    )
                      Padding(
                        padding: EdgeInsets.only(
                          bottom: index == badge.requirements.length - 1
                              ? 0
                              : 12,
                        ),
                        child: _EvidenceRequirementTile(
                          number: index + 1,
                          requirement: badge.requirements[index],
                          file:
                              evidenceByRequirementId[badge
                                  .requirements[index]
                                  .id],
                          onPick: () => pickEvidence(badge.requirements[index]),
                          onRemove: () =>
                              removeEvidence(badge.requirements[index]),
                        ),
                      ),
                ],
              ),
            ),
            if (hasRequirements && !allEvidenceSelected) ...[
              const SizedBox(height: 16),
              const _ImportantEvidenceNotice(),
            ],
            const SizedBox(height: 18),
            SizedBox(
              height: 52,
              child: FilledButton.icon(
                onPressed: canSubmit ? submit : null,
                icon: isSubmitting
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2.2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.send_outlined),
                label: AppText(
                  isSubmitting
                      ? 'A submeter...'
                      : allEvidenceSelected
                      ? 'Submeter candidatura'
                      : 'Complete todos os requisitos',
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
  const _MetaPill({
    required this.icon,
    required this.text,
    required this.maxWidth,
  });

  final IconData icon;
  final String text;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(maxWidth: maxWidth),
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
          Flexible(
            child: AppText(
              text,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: Color(0xFF475467),
                fontSize: 11,
                fontWeight: FontWeight.w700,
              ),
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
      child: AppText(
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
            child: AppText(
              text,
              style: const TextStyle(color: Color(0xFF475467), fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _EvidenceProgressPill extends StatelessWidget {
  const _EvidenceProgressPill({required this.completed, required this.total});

  final int completed;
  final int total;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF3FF),
        borderRadius: BorderRadius.circular(999),
      ),
      child: AppText(
        '$completed/$total',
        style: const TextStyle(
          color: Color(0xFF005DFF),
          fontSize: 12,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _RequirementDescriptionTile extends StatelessWidget {
  const _RequirementDescriptionTile({
    required this.number,
    required this.requirement,
  });

  final int number;
  final CatalogRequirement requirement;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE0E5EE)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          AppText(
            '$number.',
            style: const TextStyle(
              color: Color(0xFF344054),
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: AppText(
              requirement.displayText,
              style: const TextStyle(
                color: Color(0xFF344054),
                fontSize: 15,
                height: 1.4,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SentEvidencesSection extends StatelessWidget {
  const _SentEvidencesSection({required this.application});

  final CatalogApplication application;

  @override
  Widget build(BuildContext context) {
    final evidences = application.evidences;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Expanded(
              child: AppText(
                'Evidências enviadas',
                style: TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            _StatusPill(text: application.statusLabel),
          ],
        ),
        const SizedBox(height: 12),
        if (evidences.isEmpty)
          const AppText(
            'Esta candidatura ainda não tem evidências sincronizadas localmente.',
            style: TextStyle(color: Color(0xFF667085), fontSize: 14),
          )
        else
          for (var index = 0; index < evidences.length; index++)
            Padding(
              padding: EdgeInsets.only(
                bottom: index == evidences.length - 1 ? 0 : 10,
              ),
              child: _EvidenceViewTile(evidence: evidences[index]),
            ),
      ],
    );
  }
}

class _EvidenceViewTile extends StatelessWidget {
  const _EvidenceViewTile({required this.evidence});

  final ApplicationEvidence evidence;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE0E5EE)),
      ),
      child: Row(
        children: [
          const Icon(Icons.description_outlined, color: Color(0xFF006DAA)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppText(
                  evidence.fileName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                if (evidence.requirementTitle.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  AppText(
                    evidence.requirementTitle,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Color(0xFF667085),
                      fontSize: 12,
                    ),
                  ),
                ],
              ],
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            tooltip: context.tr('Abrir evidência'),
            onPressed: evidence.hasUrl
                ? () => _openEvidenceUrl(context, evidence.url)
                : null,
            icon: const Icon(Icons.open_in_new, color: Color(0xFF006DAA)),
          ),
        ],
      ),
    );
  }
}

class _EvidenceRequirementTile extends StatelessWidget {
  const _EvidenceRequirementTile({
    required this.number,
    required this.requirement,
    required this.file,
    required this.onPick,
    required this.onRemove,
  });

  final int number;
  final CatalogRequirement requirement;
  final PlatformFile? file;
  final VoidCallback onPick;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final selectedFile = file;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE0E5EE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 28,
                height: 28,
                alignment: Alignment.center,
                decoration: const BoxDecoration(
                  color: Color(0xFFE4E7EC),
                  shape: BoxShape.circle,
                ),
                child: AppText(
                  'A$number',
                  style: const TextStyle(
                    color: Color(0xFF667085),
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: AppText(
                  requirement.displayText,
                  style: const TextStyle(
                    color: Color(0xFF344054),
                    fontSize: 15,
                    height: 1.35,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          if (selectedFile == null)
            OutlinedButton.icon(
              onPressed: requirement.id > 0 ? onPick : null,
              icon: const Icon(Icons.upload_file_outlined, size: 20),
              label: const AppText('Upload Evidência (PDF, Imagem)'),
              style: OutlinedButton.styleFrom(
                minimumSize: const Size.fromHeight(52),
                foregroundColor: const Color(0xFF344054),
                side: const BorderSide(color: Color(0xFFD0D5DD)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            )
          else
            _SelectedEvidenceFile(
              file: selectedFile,
              onReplace: onPick,
              onRemove: onRemove,
            ),
          if (requirement.id <= 0) ...[
            const SizedBox(height: 10),
            const AppText(
              'Requisito sem identificador sincronizado.',
              style: TextStyle(color: Color(0xFFB42318), fontSize: 12),
            ),
          ],
        ],
      ),
    );
  }
}

class _SelectedEvidenceFile extends StatelessWidget {
  const _SelectedEvidenceFile({
    required this.file,
    required this.onReplace,
    required this.onRemove,
  });

  final PlatformFile file;
  final VoidCallback onReplace;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFB7D7FF)),
      ),
      child: Row(
        children: [
          const Icon(Icons.description_outlined, color: Color(0xFF005DFF)),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppText(
                  file.name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 13,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 3),
                AppText(
                  _formatFileSize(file.size),
                  style: const TextStyle(
                    color: Color(0xFF667085),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          IconButton(
            tooltip: context.tr('Trocar ficheiro'),
            onPressed: onReplace,
            icon: const Icon(Icons.sync_outlined, color: Color(0xFF006DAA)),
          ),
          IconButton(
            tooltip: context.tr('Remover ficheiro'),
            onPressed: onRemove,
            icon: const Icon(Icons.close, color: Color(0xFFB42318)),
          ),
        ],
      ),
    );
  }
}

class _ImportantEvidenceNotice extends StatelessWidget {
  const _ImportantEvidenceNotice();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF3FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFB7D7FF)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.info_outline, color: Color(0xFF005DFF), size: 22),
          SizedBox(width: 12),
          Expanded(
            child: AppText(
              'Faça upload de todas as evidências necessárias antes de submeter a candidatura.',
              style: TextStyle(
                color: Color(0xFF174EA6),
                fontSize: 14,
                height: 1.35,
                fontWeight: FontWeight.w600,
              ),
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
      child: const AppText(
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

Future<void> _openEvidenceUrl(BuildContext context, String url) async {
  final uri = Uri.tryParse(url.trim());
  if (uri == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: AppText('URL da evidência inválido.')),
    );
    return;
  }

  final opened = await launchUrl(uri, mode: LaunchMode.externalApplication);
  if (!opened && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: AppText('Não foi possível abrir a evidência.')),
    );
  }
}

String _formatFileSize(int bytes) {
  if (bytes <= 0) {
    return 'Tamanho desconhecido';
  }
  if (bytes < 1024) {
    return '$bytes B';
  }
  final kilobytes = bytes / 1024;
  if (kilobytes < 1024) {
    return '${kilobytes.toStringAsFixed(1)} KB';
  }
  final megabytes = kilobytes / 1024;
  return '${megabytes.toStringAsFixed(1)} MB';
}
