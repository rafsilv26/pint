import 'package:flutter/material.dart';

import '../l10n/app_language.dart';
import '../models/dashboard_data.dart';
import '../repositories/mobile_api_repository.dart';
import '../services/auth_service.dart';
import 'change_password_page.dart';
import 'consultants_directory_page.dart';
import 'email_signature_page.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key, required this.data, required this.onLogout});

  final DashboardData data;
  final VoidCallback onLogout;

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  final AuthService authService = AuthService();
  final MobileApiRepository mobileRepository = MobileApiRepository();
  late Future<_ProfileViewData> profileFuture;

  @override
  void initState() {
    super.initState();
    profileFuture = loadProfileData();
  }

  Future<_ProfileViewData> loadProfileData() async {
    final localUser = await mobileRepository.database.getCurrentUserProfile();
    final consultant = await mobileRepository.database
        .getCurrentConsultantProfile();
    final savedEmail = await authService.getSavedEmail();

    return _ProfileViewData(
      email: consultant?.email ?? localUser?.email ?? savedEmail ?? '',
      area: consultant?.area ?? '',
      serviceLine: consultant?.serviceLine ?? '',
    );
  }

  Future<void> logout() async {
    await authService.logout();

    if (mounted) {
      widget.onLogout();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_ProfileViewData>(
      future: profileFuture,
      builder: (context, snapshot) {
        final profile = snapshot.data ?? const _ProfileViewData();

        return _ProfileContent(
          data: widget.data,
          profile: profile,
          onLogout: logout,
        );
      },
    );
  }
}

class _ProfileViewData {
  const _ProfileViewData({
    this.email = '',
    this.area = '',
    this.serviceLine = '',
  });

  final String email;
  final String area;
  final String serviceLine;
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent({
    required this.data,
    required this.profile,
    required this.onLogout,
  });

  final DashboardData data;
  final _ProfileViewData profile;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final horizontalPadding = constraints.maxWidth < 380 ? 16.0 : 24.0;

          return ListView(
            padding: EdgeInsets.zero,
            children: [
              const _ProfileHeader(),
              Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      horizontalPadding,
                      16,
                      horizontalPadding,
                      36,
                    ),
                    child: Column(
                      children: [
                        _ProfileSummaryCard(data: data, email: profile.email),
                        const SizedBox(height: 18),
                        _AccountCard(
                          email: profile.email,
                          area: profile.area,
                          serviceLine: profile.serviceLine,
                        ),
                        const SizedBox(height: 18),
                        const _LanguageSection(),
                        const SizedBox(height: 18),
                        const _PrivacyCard(),
                        const SizedBox(height: 20),
                        _LogoutButton(onPressed: onLogout),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader();

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
      decoration: const BoxDecoration(
        color: Color(0xFF006DAA),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(22),
          bottomRight: Radius.circular(22),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            AppText(
              strings.profileTitle,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 10),
            AppText(
              strings.profileSubtitle,
              style: const TextStyle(
                color: Color(0xFFE6F5FF),
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProfileSummaryCard extends StatelessWidget {
  const _ProfileSummaryCard({required this.data, required this.email});

  final DashboardData data;
  final String email;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return _ProfileCard(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 18),
      child: Column(
        children: [
          Row(
            children: [
              const _ProfileAvatar(),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppText(
                      data.userName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF111827),
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 6),
                    AppText(
                      email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF536075),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    _SoftPill(
                      text: data.userRole.isNotEmpty
                          ? data.userRole
                          : strings.consultant,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFFE8EDF3), height: 1),
          const SizedBox(height: 14),
          Row(
            children: [
              Expanded(
                child: _ProfileStat(
                  value: '${data.totalPoints}',
                  label: strings.totalPoints,
                ),
              ),
              Expanded(
                child: _ProfileStat(
                  value: '${data.badgesWon}',
                  label: strings.earnedBadges,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ProfileAvatar extends StatelessWidget {
  const _ProfileAvatar();

  @override
  Widget build(BuildContext context) {
    return ClipOval(
      child: Image.asset(
        'assets/images/profile_avatar.png',
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

class _ProfileStat extends StatelessWidget {
  const _ProfileStat({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        AppText(
          value,
          style: const TextStyle(
            color: Color(0xFF005DFF),
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        AppText(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
        ),
      ],
    );
  }
}

class _AccountCard extends StatelessWidget {
  const _AccountCard({
    required this.email,
    required this.area,
    required this.serviceLine,
  });

  final String email;
  final String area;
  final String serviceLine;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);
    final areaValue = [
      if (area.isNotEmpty) area,
      if (serviceLine.isNotEmpty) serviceLine,
    ].join(' · ');

    return _ProfileCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          _SectionHeader(icon: Icons.person_outline, title: strings.account),
          _InfoRow(
            icon: Icons.mail_outline,
            title: strings.email,
            value: email.isNotEmpty ? email : strings.noLocalEmail,
          ),
          _InfoRow(
            icon: Icons.work_outline,
            title: strings.area,
            value: areaValue.isNotEmpty ? areaValue : strings.noLocalArea,
          ),
          _InfoRow(
            icon: Icons.groups_2_outlined,
            title: strings.consultantsDirectory,
            showArrow: true,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const ConsultantsDirectoryPage(),
                ),
              );
            },
          ),
          _InfoRow(
            icon: Icons.description_outlined,
            title: strings.configureSignature,
            showArrow: true,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const EmailSignaturePage(),
                ),
              );
            },
          ),
          _InfoRow(
            icon: Icons.shield_outlined,
            title: strings.changePassword,
            showArrow: true,
            onTap: () {
              Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (context) => const ChangePasswordPage(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _LanguageSection extends StatelessWidget {
  const _LanguageSection();

  @override
  Widget build(BuildContext context) {
    final controller = AppLanguageScope.of(context);
    final strings = AppStrings.of(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.language, color: Color(0xFF344054), size: 18),
            const SizedBox(width: 8),
            AppText(
              strings.languageTitle,
              style: const TextStyle(
                color: Color(0xFF344054),
                fontSize: 16,
                fontWeight: FontWeight.w800,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: [
            for (final language in AppLanguage.values)
              _LanguageChip(
                text: '${language.flag} ${strings.languageName(language)}',
                selected: controller.language == language,
                onTap: () => controller.setLanguage(language),
              ),
          ],
        ),
      ],
    );
  }
}

class _PrivacyCard extends StatelessWidget {
  const _PrivacyCard();

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return _ProfileCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          _SectionHeader(
            icon: Icons.shield_outlined,
            title: strings.privacyTitle,
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppText(
                  strings.privacyBody,
                  style: const TextStyle(
                    color: Color(0xFF344054),
                    fontSize: 15,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEAF3FF),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      AppText(
                        strings.rgpdInfo,
                        style: const TextStyle(
                          color: Color(0xFF0F3F98),
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 6),
                      AppText(
                        strings.rgpdBody,
                        style: const TextStyle(
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
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(18),
          topRight: Radius.circular(18),
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: const Color(0xFF005DFF), size: 22),
          const SizedBox(width: 12),
          AppText(
            title,
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow({
    required this.icon,
    required this.title,
    this.value,
    this.showArrow = false,
    this.onTap,
  });

  final IconData icon;
  final String title;
  final String? value;
  final bool showArrow;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFFE8EDF3))),
        ),
        child: Row(
          children: [
            Icon(icon, color: const Color(0xFF98A2B3), size: 23),
            const SizedBox(width: 16),
            Expanded(
              child: AppText(
                title,
                style: const TextStyle(color: Color(0xFF344054), fontSize: 16),
              ),
            ),
            if (value != null)
              Flexible(
                child: AppText(
                  value!,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.right,
                  style: const TextStyle(
                    color: Color(0xFF667085),
                    fontSize: 14,
                  ),
                ),
              ),
            if (showArrow)
              const Icon(Icons.chevron_right, color: Color(0xFF98A2B3)),
          ],
        ),
      ),
    );
  }
}

class _LanguageChip extends StatelessWidget {
  const _LanguageChip({
    required this.text,
    required this.onTap,
    this.selected = false,
  });

  final String text;
  final VoidCallback onTap;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: selected ? const Color(0xFF2F8AB9) : Colors.white,
          borderRadius: BorderRadius.circular(999),
          border: Border.all(
            color: selected ? const Color(0xFF2F8AB9) : const Color(0xFFE8EDF3),
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0F101828),
              blurRadius: 12,
              offset: Offset(0, 6),
            ),
          ],
        ),
        child: AppText(
          text,
          style: TextStyle(
            color: selected ? Colors.white : const Color(0xFF344054),
            fontSize: 15,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}

class _SoftPill extends StatelessWidget {
  const _SoftPill({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
      decoration: BoxDecoration(
        color: const Color(0xFFDCEBFF),
        borderRadius: BorderRadius.circular(999),
      ),
      child: AppText(
        text,
        style: const TextStyle(
          color: Color(0xFF005DFF),
          fontSize: 14,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _LogoutButton extends StatelessWidget {
  const _LogoutButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    final strings = AppStrings.of(context);

    return SizedBox(
      width: double.infinity,
      height: 44,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: const Icon(Icons.logout, size: 22),
        label: AppText(strings.logout),
        style: OutlinedButton.styleFrom(
          foregroundColor: const Color(0xFFFF1D1D),
          side: const BorderSide(color: Color(0xFFFF5A5A)),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(999),
          ),
          textStyle: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
        ),
      ),
    );
  }
}

class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.child, required this.padding});

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
        border: Border.all(color: const Color(0xFFE8EDF3)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F101828),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }
}
