import 'package:flutter/material.dart';

import '../models/dashboard_data.dart';
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
  late Future<String> emailFuture;

  @override
  void initState() {
    super.initState();
    emailFuture = loadEmail();
  }

  Future<String> loadEmail() async {
    return await authService.getSavedEmail() ?? 'rafsilv26@gmail.com';
  }

  Future<void> logout() async {
    await authService.logout();

    if (mounted) {
      widget.onLogout();
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<String>(
      future: emailFuture,
      builder: (context, snapshot) {
        final email = snapshot.data ?? 'rafsilv26@gmail.com';

        return _ProfileContent(
          data: widget.data,
          email: email,
          onLogout: logout,
        );
      },
    );
  }
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent({
    required this.data,
    required this.email,
    required this.onLogout,
  });

  final DashboardData data;
  final String email;
  final VoidCallback onLogout;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final horizontalPadding = constraints.maxWidth < 380 ? 16.0 : 24.0;

        return CustomScrollView(
          slivers: [
            const SliverToBoxAdapter(child: _ProfileHeader()),
            SliverToBoxAdapter(
              child: Center(
                child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 560),
                  child: Padding(
                    padding: EdgeInsets.fromLTRB(
                      horizontalPadding,
                      0,
                      horizontalPadding,
                      26,
                    ),
                    child: Column(
                      children: [
                        const SizedBox(height: 16),
                        _ProfileSummaryCard(data: data, email: email),
                        const SizedBox(height: 16),
                        _ConsultantsCard(
                          onTap: () {
                            Navigator.of(context).push(
                              MaterialPageRoute(
                                builder: (context) =>
                                    const ConsultantsDirectoryPage(),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 18),
                        _AccountCard(email: email),
                        const SizedBox(height: 18),
                        const _LanguageSection(),
                        const SizedBox(height: 18),
                        const _EmailSignatureCard(),
                        const SizedBox(height: 18),
                        const _PrivacyCard(),
                        const SizedBox(height: 20),
                        _LogoutButton(onPressed: onLogout),
                        const SizedBox(height: 36),
                        const _FooterInfo(),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ProfileHeader extends StatelessWidget {
  const _ProfileHeader();

  @override
  Widget build(BuildContext context) {
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
      child: const SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Perfil',
              style: TextStyle(
                color: Colors.white,
                fontSize: 26,
                fontWeight: FontWeight.w700,
              ),
            ),
            SizedBox(height: 10),
            Text(
              'Gestão de conta e preferências',
              style: TextStyle(
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
                    Text(
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
                    Text(
                      email,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF536075),
                        fontSize: 14,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const _SoftPill(text: 'Hybrid Cloud'),
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
                  label: 'Total Pontos',
                ),
              ),
              Expanded(
                child: _ProfileStat(
                  value: '${data.badgesWon}',
                  label: 'Badges Ganhos',
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
        Text(
          value,
          style: const TextStyle(
            color: Color(0xFF005DFF),
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          textAlign: TextAlign.center,
          style: const TextStyle(color: Color(0xFF4B5563), fontSize: 13),
        ),
      ],
    );
  }
}

class _ConsultantsCard extends StatelessWidget {
  const _ConsultantsCard({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(18),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: const Color(0xFF2F8AB9),
          borderRadius: BorderRadius.circular(18),
          boxShadow: const [
            BoxShadow(
              color: Color(0x332F8AB9),
              blurRadius: 18,
              offset: Offset(0, 10),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 52,
              height: 52,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.groups_2_outlined,
                color: Colors.white,
                size: 28,
              ),
            ),
            const SizedBox(width: 14),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Diretório de\nConsultores',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      height: 1.25,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Descubra o perfil de outros colegas',
                    style: TextStyle(
                      color: Color(0xEFFFFFFF),
                      fontSize: 14,
                      height: 1.35,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.white, size: 28),
          ],
        ),
      ),
    );
  }
}

class _AccountCard extends StatelessWidget {
  const _AccountCard({required this.email});

  final String email;

  @override
  Widget build(BuildContext context) {
    return _ProfileCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          const _SectionHeader(icon: Icons.person_outline, title: 'Conta'),
          _InfoRow(icon: Icons.mail_outline, title: 'Email', value: email),
          const _InfoRow(
            icon: Icons.work_outline,
            title: 'Área',
            value: 'Hybrid Cloud',
          ),
          _InfoRow(
            icon: Icons.shield_outlined,
            title: 'Alterar Password',
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Row(
          children: [
            Icon(Icons.language, color: Color(0xFF344054), size: 18),
            SizedBox(width: 8),
            Text(
              'Idioma',
              style: TextStyle(
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
          children: const [
            _LanguageChip(text: '🇵🇹 Português', selected: true),
            _LanguageChip(text: '🇬🇧 Inglês'),
            _LanguageChip(text: '🇪🇸 Espanhol'),
          ],
        ),
      ],
    );
  }
}

class _EmailSignatureCard extends StatelessWidget {
  const _EmailSignatureCard();

  @override
  Widget build(BuildContext context) {
    return _ProfileCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          const _SectionHeader(
            icon: Icons.description_outlined,
            title: 'Assinatura de Email',
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Configure a sua assinatura de email profissional com os badges conquistados.',
                  style: TextStyle(
                    color: Color(0xFF475467),
                    fontSize: 15,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 18),
                InkWell(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (context) => const EmailSignaturePage(),
                      ),
                    );
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF6F9FF),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFB6D2FF)),
                    ),
                    child: Row(
                      children: [
                        Container(
                          width: 50,
                          height: 50,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: const Color(0xFF2F8AB9),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(
                            Icons.settings_outlined,
                            color: Colors.white,
                            size: 26,
                          ),
                        ),
                        const SizedBox(width: 14),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Configurar Assinatura',
                                style: TextStyle(
                                  color: Color(0xFF111827),
                                  fontSize: 17,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              SizedBox(height: 4),
                              Text(
                                'Personalize e exporte',
                                style: TextStyle(
                                  color: Color(0xFF667085),
                                  fontSize: 13,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Icon(
                          Icons.chevron_right,
                          color: Color(0xFF005DFF),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFAEB),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFFFD666)),
                  ),
                  child: const Text(
                    'Mostre as suas certificações em todos os emails que enviar!',
                    style: TextStyle(
                      color: Color(0xFF8A3B12),
                      fontSize: 13,
                      height: 1.35,
                    ),
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

class _PrivacyCard extends StatelessWidget {
  const _PrivacyCard();

  @override
  Widget build(BuildContext context) {
    return _ProfileCard(
      padding: EdgeInsets.zero,
      child: Column(
        children: [
          const _SectionHeader(
            icon: Icons.shield_outlined,
            title: 'Privacidade e RGPD',
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 20, 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Aceito a partilha pública dos meus badges e conquistas no ranking da plataforma. Os dados pessoais são tratados de acordo com o RGPD.',
                  style: TextStyle(
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
                  child: const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Informação RGPD',
                        style: TextStyle(
                          color: Color(0xFF0F3F98),
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      SizedBox(height: 6),
                      Text(
                        'A Softinsa compromete-se a proteger a sua privacidade. Os seus dados são utilizados apenas para fins de gestão de competências e desenvolvimento profissional.',
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
          Text(
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
              child: Text(
                title,
                style: const TextStyle(color: Color(0xFF344054), fontSize: 16),
              ),
            ),
            if (value != null)
              Flexible(
                child: Text(
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
  const _LanguageChip({required this.text, this.selected = false});

  final String text;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    return Container(
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
      child: Text(
        text,
        style: TextStyle(
          color: selected ? Colors.white : const Color(0xFF344054),
          fontSize: 15,
          fontWeight: FontWeight.w800,
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
      child: Text(
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
    return SizedBox(
      width: double.infinity,
      height: 44,
      child: OutlinedButton.icon(
        onPressed: onPressed,
        icon: const Icon(Icons.logout, size: 22),
        label: const Text('Terminar Sessão'),
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

class _FooterInfo extends StatelessWidget {
  const _FooterInfo();

  @override
  Widget build(BuildContext context) {
    return const Column(
      children: [
        Text(
          'Versão 3.2 Mobile',
          style: TextStyle(
            color: Color(0xFF667085),
            fontSize: 13,
            fontWeight: FontWeight.w700,
          ),
        ),
        SizedBox(height: 12),
        Text(
          '© 2025 Softinsa. Todos os direitos reservados.',
          textAlign: TextAlign.center,
          style: TextStyle(
            color: Color(0xFF667085),
            fontSize: 13,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
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
