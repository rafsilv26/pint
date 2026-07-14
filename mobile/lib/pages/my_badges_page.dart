import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../l10n/app_language.dart';
import '../models/mobile_api_data.dart';
import '../repositories/mobile_api_repository.dart';
import '../services/app_sync_service.dart';

class MyBadgesPage extends StatefulWidget {
  const MyBadgesPage({super.key});

  @override
  State<MyBadgesPage> createState() => _MyBadgesPageState();
}

class _MyBadgesPageState extends State<MyBadgesPage> {
  final MobileApiRepository repository = MobileApiRepository();
  late Future<List<MyBadgeApplication>> applicationsFuture;
  String selectedFilter = 'todos';

  @override
  void initState() {
    super.initState();
    applicationsFuture = repository.getMyBadgeApplications();
  }

  Future<void> reload() async {
    await AppSyncService().synchronizeIfNeeded();
    final future = repository.getMyBadgeApplications();
    setState(() {
      applicationsFuture = future;
    });
    await future;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<MyBadgeApplication>>(
      future: applicationsFuture,
      builder: (context, snapshot) {
        final applications = snapshot.data ?? const <MyBadgeApplication>[];
        final approved = applications.where((item) => item.isApproved).length;
        final rejected = applications.where((item) => item.isRejected).length;
        final inProgress = applications.length - approved - rejected;
        final filtered = applications.where(_matchesFilter).toList();

        return SafeArea(
          bottom: false,
          child: Column(
            children: [
              _MyBadgesHeader(
                total: applications.length,
                approved: approved,
                inProgress: inProgress,
              ),
              _StatusFilters(
                selected: selectedFilter,
                total: applications.length,
                approved: approved,
                inProgress: inProgress,
                rejected: rejected,
                onChanged: (value) {
                  setState(() {
                    selectedFilter = value;
                  });
                },
              ),
              Expanded(
                child: snapshot.connectionState == ConnectionState.waiting
                    ? const Center(child: CircularProgressIndicator())
                    : RefreshIndicator(
                        onRefresh: reload,
                        child: _ApplicationsList(
                          applications: filtered,
                          onTap: (application) {
                            showModalBottomSheet<void>(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (context) => _ApplicationDetailSheet(
                                application: application,
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

  bool _matchesFilter(MyBadgeApplication application) {
    return switch (selectedFilter) {
      'conquistados' => application.isApproved,
      'rejeitados' => application.isRejected,
      'progresso' => !application.isApproved && !application.isRejected,
      _ => true,
    };
  }
}

class _MyBadgesHeader extends StatelessWidget {
  const _MyBadgesHeader({
    required this.total,
    required this.approved,
    required this.inProgress,
  });

  final int total;
  final int approved;
  final int inProgress;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(22, 18, 22, 22),
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
            'Meus Badges',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 6),
          const AppText(
            'Candidaturas e conquistas sincronizadas',
            style: TextStyle(color: Color(0xD9FFFFFF), fontSize: 13),
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              _HeaderCounter(label: 'Total', value: '$total'),
              const SizedBox(width: 10),
              _HeaderCounter(label: 'Conquistados', value: '$approved'),
              const SizedBox(width: 10),
              _HeaderCounter(label: 'Em progresso', value: '$inProgress'),
            ],
          ),
        ],
      ),
    );
  }
}

class _HeaderCounter extends StatelessWidget {
  const _HeaderCounter({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.13),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: Colors.white.withValues(alpha: 0.22)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppText(
              value,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 17,
                fontWeight: FontWeight.w800,
              ),
            ),
            const SizedBox(height: 4),
            AppText(
              label,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Color(0xD9FFFFFF), fontSize: 11),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatusFilters extends StatelessWidget {
  const _StatusFilters({
    required this.selected,
    required this.total,
    required this.approved,
    required this.inProgress,
    required this.rejected,
    required this.onChanged,
  });

  final String selected;
  final int total;
  final int approved;
  final int inProgress;
  final int rejected;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final filters = [
      ('todos', 'Todos', total),
      ('progresso', 'Em progresso', inProgress),
      ('conquistados', 'Conquistados', approved),
      ('rejeitados', 'Rejeitados', rejected),
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
                label: AppText('${item.$2} (${item.$3})'),
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

class _ApplicationsList extends StatelessWidget {
  const _ApplicationsList({required this.applications, required this.onTap});

  final List<MyBadgeApplication> applications;
  final ValueChanged<MyBadgeApplication> onTap;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final horizontalPadding = constraints.maxWidth < 380 ? 16.0 : 22.0;

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            horizontalPadding,
            14,
            horizontalPadding,
            28,
          ),
          children: [
            if (applications.isEmpty)
              const _EmptyMyBadges()
            else
              for (final application in applications) ...[
                _ApplicationCard(
                  application: application,
                  onTap: () => onTap(application),
                ),
                const SizedBox(height: 14),
              ],
          ],
        );
      },
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  const _ApplicationCard({required this.application, required this.onTap});

  final MyBadgeApplication application;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colors = _statusColors(application);

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
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _BadgeIconBox(
                  imagePath: application.imagePath,
                  fallback: application.title,
                  backgroundColor: colors.background,
                  foregroundColor: colors.foreground,
                ),
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
                              application.title,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(
                                color: Color(0xFF111827),
                                fontSize: 16,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          _StatusPill(
                            label: application.statusLabel,
                            colors: colors,
                          ),
                        ],
                      ),
                      if (application.description.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        AppText(
                          application.description,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            color: Color(0xFF475467),
                            fontSize: 13,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                _MetaPill(
                  icon: Icons.star_border,
                  text: '${application.points} pts',
                ),
                const SizedBox(width: 8),
                if (application.createdAt != null)
                  _MetaPill(
                    icon: Icons.schedule_outlined,
                    text: _formatDate(application.createdAt!),
                  ),
                const Spacer(),
                const Icon(Icons.chevron_right, color: Color(0xFF98A2B3)),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _ApplicationDetailSheet extends StatelessWidget {
  const _ApplicationDetailSheet({required this.application});

  final MyBadgeApplication application;

  @override
  Widget build(BuildContext context) {
    final colors = _statusColors(application);

    return DraggableScrollableSheet(
      initialChildSize: 0.56,
      minChildSize: 0.36,
      maxChildSize: 0.88,
      builder: (context, controller) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          child: ListView(
            controller: controller,
            padding: const EdgeInsets.fromLTRB(22, 12, 22, 26),
            children: [
              Center(
                child: Container(
                  width: 44,
                  height: 4,
                  decoration: BoxDecoration(
                    color: const Color(0xFFD0D5DD),
                    borderRadius: BorderRadius.circular(999),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _BadgeIconBox(
                    imagePath: application.imagePath,
                    fallback: application.title,
                    size: 64,
                    backgroundColor: colors.background,
                    foregroundColor: colors.foreground,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AppText(
                          application.title,
                          style: const TextStyle(
                            color: Color(0xFF111827),
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                          ),
                        ),
                        const SizedBox(height: 10),
                        _StatusPill(
                          label: application.statusLabel,
                          colors: colors,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              if (application.description.isNotEmpty)
                AppText(
                  application.description,
                  style: const TextStyle(
                    color: Color(0xFF344054),
                    fontSize: 14,
                    height: 1.45,
                  ),
                ),
              const SizedBox(height: 18),
              _DetailRow(
                icon: Icons.star_border,
                label: 'Pontos',
                value: '${application.points}',
              ),
              if (application.createdAt != null)
                _DetailRow(
                  icon: Icons.play_circle_outline,
                  label: 'Submetida em',
                  value: _formatDate(application.createdAt!),
                ),
              if (application.updatedAt != null)
                _DetailRow(
                  icon: Icons.update,
                  label: 'Última atualização',
                  value: _formatDate(application.updatedAt!),
                ),
              const SizedBox(height: 18),
              const AppText(
                'Evidências enviadas',
                style: TextStyle(
                  color: Color(0xFF111827),
                  fontSize: 17,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 10),
              if (application.evidences.isEmpty)
                const AppText(
                  'Sem evidências sincronizadas para esta candidatura.',
                  style: TextStyle(color: Color(0xFF667085), fontSize: 14),
                )
              else
                for (
                  var index = 0;
                  index < application.evidences.length;
                  index++
                )
                  Padding(
                    padding: EdgeInsets.only(
                      bottom: index == application.evidences.length - 1
                          ? 0
                          : 10,
                    ),
                    child: _EvidenceViewTile(
                      evidence: application.evidences[index],
                    ),
                  ),
              const SizedBox(height: 20),
              SizedBox(
                height: 48,
                child: FilledButton.icon(
                  onPressed: () => Navigator.of(context).pop(),
                  icon: const Icon(Icons.check),
                  label: const AppText('Fechar'),
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
          ),
        );
      },
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

class _BadgeIconBox extends StatelessWidget {
  const _BadgeIconBox({
    required this.imagePath,
    required this.fallback,
    required this.backgroundColor,
    required this.foregroundColor,
    this.size = 56,
  });

  final String imagePath;
  final String fallback;
  final Color backgroundColor;
  final Color foregroundColor;
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
          errorBuilder: (context, error, stackTrace) => _FallbackIcon(
            size: size,
            fallback: fallback,
            backgroundColor: backgroundColor,
            foregroundColor: foregroundColor,
          ),
        ),
      );
    }

    return _FallbackIcon(
      size: size,
      fallback: fallback,
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
    );
  }
}

class _FallbackIcon extends StatelessWidget {
  const _FallbackIcon({
    required this.size,
    required this.fallback,
    required this.backgroundColor,
    required this.foregroundColor,
  });

  final double size;
  final String fallback;
  final Color backgroundColor;
  final Color foregroundColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Icon(_iconFor(fallback), color: foregroundColor, size: size * 0.5),
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
          AppText(
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
  const _StatusPill({required this.label, required this.colors});

  final String label;
  final _StatusColors colors;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 5),
      decoration: BoxDecoration(
        color: colors.background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: AppText(
        label,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: TextStyle(
          color: colors.foreground,
          fontSize: 10,
          fontWeight: FontWeight.w800,
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(13),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE4E7EC)),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF006DAA), size: 19),
          const SizedBox(width: 12),
          Expanded(
            child: AppText(
              label,
              style: const TextStyle(color: Color(0xFF475467), fontSize: 13),
            ),
          ),
          AppText(
            value,
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 13,
              fontWeight: FontWeight.w800,
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyMyBadges extends StatelessWidget {
  const _EmptyMyBadges();

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
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            Icons.workspace_premium_outlined,
            color: Color(0xFF006DAA),
            size: 28,
          ),
          SizedBox(height: 12),
          AppText(
            'Sem candidaturas sincronizadas.',
            style: TextStyle(
              color: Color(0xFF111827),
              fontSize: 15,
              fontWeight: FontWeight.w800,
            ),
          ),
          SizedBox(height: 6),
          AppText(
            'Quando submeter ou conquistar badges, eles aparecem aqui.',
            style: TextStyle(color: Color(0xFF667085), fontSize: 13),
          ),
        ],
      ),
    );
  }
}

class _StatusColors {
  const _StatusColors({required this.background, required this.foreground});

  final Color background;
  final Color foreground;
}

_StatusColors _statusColors(MyBadgeApplication application) {
  if (application.isApproved) {
    return const _StatusColors(
      background: Color(0xFFE9F8EF),
      foreground: Color(0xFF027A48),
    );
  }

  if (application.isRejected) {
    return const _StatusColors(
      background: Color(0xFFFFEDEE),
      foreground: Color(0xFFC01048),
    );
  }

  return const _StatusColors(
    background: Color(0xFFFFF7E8),
    foreground: Color(0xFFB45309),
  );
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
  if (normalized.contains('form') ||
      normalized.contains('learning') ||
      normalized.contains('academy')) {
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

String _formatDate(DateTime value) {
  final local = value.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  return '$day/$month/${local.year}';
}
