import 'package:flutter/material.dart';

import '../models/mobile_api_data.dart';
import '../repositories/mobile_api_repository.dart';
import '../widgets/app_bottom_navigation.dart';

class EmailSignaturePage extends StatefulWidget {
  const EmailSignaturePage({super.key});

  @override
  State<EmailSignaturePage> createState() => _EmailSignaturePageState();
}

class _EmailSignaturePageState extends State<EmailSignaturePage> {
  final MobileApiRepository repository = MobileApiRepository();
  int selectedTab = 0;
  bool showCompanyLogo = true;
  bool loading = true;
  bool saving = false;

  final TextEditingController nameController = TextEditingController();
  final TextEditingController roleController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController phoneController = TextEditingController(
    text: '+351 21 000 0000',
  );
  final TextEditingController websiteController = TextEditingController(
    text: 'www.softinsa.pt',
  );

  List<_SignatureBadge> badges = const [];

  @override
  void initState() {
    super.initState();
    loadSignature();
  }

  Future<void> loadSignature() async {
    final data = await repository.getEmailSignature();
    if (!mounted) {
      return;
    }

    setState(() {
      applySignatureData(data);
      loading = false;
    });
  }

  void applySignatureData(EmailSignatureData data) {
    nameController.text = data.profile.name;
    roleController.text = data.profile.role;
    emailController.text = data.profile.email;
    websiteController.text = data.profile.website;
    badges = data.badges.map(_SignatureBadge.fromApi).toList();
  }

  void toggleBadge(int index) {
    final badge = badges[index];
    final selectedCount = badges.where((item) => item.selected).length;
    if (!badge.selected && selectedCount >= 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pode selecionar até 4 badges.')),
      );
      return;
    }

    setState(() {
      badges = [
        for (var i = 0; i < badges.length; i++)
          if (i == index)
            badges[i].copyWith(selected: !badges[i].selected)
          else
            badges[i],
      ];
    });
  }

  Future<void> saveSignature() async {
    setState(() {
      saving = true;
    });

    try {
      final updated = await repository.saveEmailSignature(
        badgeIds: badges
            .where((badge) => badge.selected)
            .map((badge) => badge.id)
            .toList(),
        templateHtml: buildTemplateHtml(),
      );

      if (!mounted) {
        return;
      }

      setState(() {
        applySignatureData(updated);
        saving = false;
      });
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Assinatura guardada.')));
    } catch (_) {
      if (!mounted) {
        return;
      }
      setState(() {
        saving = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Não foi possível guardar a assinatura.')),
      );
    }
  }

  String buildTemplateHtml() {
    final selectedBadges = badges.where((badge) => badge.selected).toList();
    final badgesHtml = selectedBadges
        .map((badge) => '<span>${badge.title}</span>')
        .join(' · ');
    return '<strong>${nameController.text}</strong><br>'
        '${roleController.text}<br>'
        '${emailController.text}<br>'
        '$badgesHtml';
  }

  @override
  void dispose() {
    nameController.dispose();
    roleController.dispose();
    emailController.dispose();
    phoneController.dispose();
    websiteController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Scaffold(
        backgroundColor: Color(0xFFF4F7FB),
        body: Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const _SignatureHeader(),
            _SignatureTabs(
              selectedIndex: selectedTab,
              onChanged: (index) {
                setState(() {
                  selectedTab = index;
                });
              },
            ),
            Expanded(
              child: IndexedStack(
                index: selectedTab,
                children: [
                  _EditSignatureView(
                    nameController: nameController,
                    roleController: roleController,
                    emailController: emailController,
                    phoneController: phoneController,
                    websiteController: websiteController,
                    badges: badges,
                    showCompanyLogo: showCompanyLogo,
                    saving: saving,
                    onLogoChanged: (value) {
                      setState(() {
                        showCompanyLogo = value;
                      });
                    },
                    onBadgeTap: toggleBadge,
                    onSave: saveSignature,
                  ),
                  _PreviewSignatureView(
                    name: nameController.text,
                    role: roleController.text,
                    email: emailController.text,
                    phone: phoneController.text,
                    website: websiteController.text,
                    showCompanyLogo: showCompanyLogo,
                    badges: badges.where((badge) => badge.selected).toList(),
                  ),
                  const _ExportSignatureView(),
                ],
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
  }
}

class _SignatureHeader extends StatelessWidget {
  const _SignatureHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
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
          const Text(
            'Assinatura de Email',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 10),
          const Text(
            'Configure a sua assinatura profissional com badges',
            style: TextStyle(
              color: Color(0xFFE6F5FF),
              fontSize: 14,
              height: 1.3,
            ),
          ),
        ],
      ),
    );
  }
}

class _SignatureTabs extends StatelessWidget {
  const _SignatureTabs({required this.selectedIndex, required this.onChanged});

  final int selectedIndex;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) {
    final tabs = [
      _SignatureTabItem(Icons.settings_outlined, 'Editar'),
      _SignatureTabItem(Icons.visibility_outlined, 'Pré-visualizar'),
      _SignatureTabItem(Icons.code, 'Exportar'),
    ];

    return Container(
      height: 50,
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Color(0x12000000),
            blurRadius: 8,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          for (var index = 0; index < tabs.length; index++)
            Expanded(
              child: InkWell(
                onTap: () => onChanged(index),
                child: _SignatureTab(
                  item: tabs[index],
                  selected: selectedIndex == index,
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SignatureTab extends StatelessWidget {
  const _SignatureTab({required this.item, required this.selected});

  final _SignatureTabItem item;
  final bool selected;

  @override
  Widget build(BuildContext context) {
    final color = selected ? const Color(0xFF005DFF) : const Color(0xFF4B5563);

    return Container(
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: selected ? const Color(0xFFF2F7FF) : Colors.white,
        border: Border(
          bottom: BorderSide(
            color: selected ? const Color(0xFF005DFF) : Colors.transparent,
            width: 2,
          ),
        ),
      ),
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(item.icon, color: color, size: 18),
            const SizedBox(width: 6),
            Text(
              item.label,
              style: TextStyle(
                color: color,
                fontSize: 13,
                fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EditSignatureView extends StatelessWidget {
  const _EditSignatureView({
    required this.nameController,
    required this.roleController,
    required this.emailController,
    required this.phoneController,
    required this.websiteController,
    required this.badges,
    required this.showCompanyLogo,
    required this.saving,
    required this.onLogoChanged,
    required this.onBadgeTap,
    required this.onSave,
  });

  final TextEditingController nameController;
  final TextEditingController roleController;
  final TextEditingController emailController;
  final TextEditingController phoneController;
  final TextEditingController websiteController;
  final List<_SignatureBadge> badges;
  final bool showCompanyLogo;
  final bool saving;
  final ValueChanged<bool> onLogoChanged;
  final ValueChanged<int> onBadgeTap;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    final selectedCount = badges.where((badge) => badge.selected).length;

    return _SignatureScroll(
      child: Column(
        children: [
          _SignatureCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _CardTitle(
                  icon: Icons.mail_outline,
                  title: 'Informações Pessoais',
                ),
                const SizedBox(height: 24),
                _SignatureTextField(
                  label: 'Nome Completo',
                  controller: nameController,
                ),
                const SizedBox(height: 18),
                _SignatureTextField(label: 'Cargo', controller: roleController),
                const SizedBox(height: 18),
                _SignatureTextField(
                  label: 'Email',
                  controller: emailController,
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 18),
                _SignatureTextField(
                  label: 'Telefone',
                  controller: phoneController,
                  keyboardType: TextInputType.phone,
                ),
                const SizedBox(height: 18),
                _SignatureTextField(
                  label: 'Website',
                  controller: websiteController,
                  keyboardType: TextInputType.url,
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          _SignatureCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.auto_awesome, color: Color(0xFF8B35FF)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: const Text(
                        'Badges\nConquistados',
                        style: TextStyle(
                          color: Color(0xFF111827),
                          fontSize: 19,
                          fontWeight: FontWeight.w800,
                          height: 1.25,
                        ),
                      ),
                    ),
                    Text(
                      '$selectedCount/4\nselecionados',
                      textAlign: TextAlign.right,
                      style: const TextStyle(
                        color: Color(0xFF475467),
                        fontSize: 13,
                        height: 1.25,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 18),
                const Text(
                  'Selecione até 4 badges para mostrar na sua assinatura',
                  style: TextStyle(
                    color: Color(0xFF475467),
                    fontSize: 14,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 20),
                if (badges.isEmpty)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: const Text(
                      'Sem badges conquistados sincronizados.',
                      style: TextStyle(color: Color(0xFF667085)),
                    ),
                  )
                else
                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: badges.length,
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                          childAspectRatio: 1.08,
                        ),
                    itemBuilder: (context, index) {
                      return _BadgeTile(
                        badge: badges[index],
                        onTap: () => onBadgeTap(index),
                      );
                    },
                  ),
                const SizedBox(height: 18),
                SizedBox(
                  width: double.infinity,
                  height: 52,
                  child: FilledButton.icon(
                    onPressed: saving ? null : onSave,
                    icon: saving
                        ? const SizedBox(
                            width: 18,
                            height: 18,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.save_outlined),
                    label: Text(saving ? 'A guardar...' : 'Guardar seleção'),
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
          ),
          const SizedBox(height: 22),
          _SignatureCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _CardTitle(
                  icon: Icons.settings_outlined,
                  title: 'Opções de Exibição',
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Row(
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Mostrar Logo da Empresa',
                              style: TextStyle(
                                color: Color(0xFF111827),
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            SizedBox(height: 6),
                            Text(
                              'Exibir logo Softinsa na assinatura',
                              style: TextStyle(
                                color: Color(0xFF667085),
                                fontSize: 13,
                                height: 1.3,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Switch(
                        value: showCompanyLogo,
                        onChanged: onLogoChanged,
                        activeThumbColor: Colors.white,
                        activeTrackColor: const Color(0xFF2563FF),
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

class _PreviewSignatureView extends StatelessWidget {
  const _PreviewSignatureView({
    required this.name,
    required this.role,
    required this.email,
    required this.phone,
    required this.website,
    required this.showCompanyLogo,
    required this.badges,
  });

  final String name;
  final String role;
  final String email;
  final String phone;
  final String website;
  final bool showCompanyLogo;
  final List<_SignatureBadge> badges;

  @override
  Widget build(BuildContext context) {
    return _SignatureScroll(
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFF6F8FF),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFB6D2FF)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _CardTitle(
                  icon: Icons.visibility_outlined,
                  title: 'Pré-visualização',
                ),
                const SizedBox(height: 22),
                const Text(
                  'Esta é a aparência da sua assinatura nos emails',
                  style: TextStyle(
                    color: Color(0xFF667085),
                    fontSize: 14,
                    height: 1.35,
                  ),
                ),
                const SizedBox(height: 22),
                Center(
                  child: _EmailPreviewCard(
                    name: name,
                    role: role,
                    email: email,
                    phone: phone,
                    website: website,
                    showCompanyLogo: showCompanyLogo,
                    badges: badges,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 26),
          const _TipCard(),
        ],
      ),
    );
  }
}

class _ExportSignatureView extends StatelessWidget {
  const _ExportSignatureView();

  @override
  Widget build(BuildContext context) {
    return _SignatureScroll(
      child: Column(
        children: [
          _SignatureCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const _CardTitle(
                  icon: Icons.code,
                  title: 'Exportar Assinatura',
                ),
                const SizedBox(height: 22),
                SizedBox(
                  width: double.infinity,
                  height: 58,
                  child: FilledButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.copy_outlined),
                    label: const Text('Copiar HTML'),
                    style: FilledButton.styleFrom(
                      backgroundColor: const Color(0xFF006DAA),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      textStyle: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  height: 58,
                  child: OutlinedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.download_outlined),
                    label: const Text('Download HTML'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF005DFF),
                      side: const BorderSide(color: Color(0xFF005DFF)),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      textStyle: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 26),
          _SignatureCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Como adicionar ao seu email',
                  style: TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 18),
                _InstructionBox(
                  iconText: 'O',
                  title: 'Outlook',
                  steps: [
                    'Clique em "Copiar HTML" acima',
                    'Abra Outlook → Ficheiro → Opções → Email → Assinaturas',
                    'Clique em "Novo" e dê um nome à assinatura',
                    'Cole o HTML copiado (Ctrl+V)',
                    'Clique em "OK" para guardar',
                  ],
                ),
                SizedBox(height: 16),
                _InstructionBox(
                  iconText: 'G',
                  title: 'Gmail',
                  iconColor: Color(0xFFE50914),
                  steps: [
                    'Clique em "Copiar HTML" acima',
                    'Abra Gmail → Configurações → Ver todas as definições',
                    'Vá para o separador "Geral"',
                    'Encontre a secção "Assinatura" e cole o HTML',
                    'Role até ao final e clique em "Guardar alterações"',
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 26),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(
              color: const Color(0xFFEAFBF0),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFF86E7A4)),
            ),
            child: const Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('✅', style: TextStyle(fontSize: 24)),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Pronto para usar!',
                        style: TextStyle(
                          color: Color(0xFF116329),
                          fontSize: 17,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      SizedBox(height: 12),
                      Text(
                        'A sua assinatura personalizada está pronta. Mostre as suas certificações e conquistas em todos os emails que enviar!',
                        style: TextStyle(
                          color: Color(0xFF087333),
                          fontSize: 14,
                          height: 1.4,
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

class _SignatureScroll extends StatelessWidget {
  const _SignatureScroll({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final horizontalPadding = constraints.maxWidth < 380 ? 16.0 : 24.0;

        return SingleChildScrollView(
          padding: EdgeInsets.fromLTRB(
            horizontalPadding,
            26,
            horizontalPadding,
            26,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: child,
            ),
          ),
        );
      },
    );
  }
}

class _SignatureTextField extends StatelessWidget {
  const _SignatureTextField({
    required this.label,
    required this.controller,
    this.keyboardType,
  });

  final String label;
  final TextEditingController controller;
  final TextInputType? keyboardType;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            color: Color(0xFF344054),
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 16,
              vertical: 16,
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFD0D5DD)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF005DFF)),
            ),
          ),
        ),
      ],
    );
  }
}

class _BadgeTile extends StatelessWidget {
  const _BadgeTile({required this.badge, required this.onTap});

  final _SignatureBadge badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: badge.selected ? const Color(0xFFEAF3FF) : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: badge.selected
                ? const Color(0xFF005DFF)
                : const Color(0xFFE0E5EE),
            width: badge.selected ? 1.4 : 1,
          ),
        ),
        child: Stack(
          children: [
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                _BadgeImage(badge: badge, size: 64),
                const SizedBox(height: 10),
                Text(
                  badge.title,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF344054),
                    fontSize: 12,
                    height: 1.2,
                  ),
                ),
              ],
            ),
            if (badge.selected)
              Positioned(
                top: 0,
                right: 0,
                child: Container(
                  width: 26,
                  height: 26,
                  decoration: const BoxDecoration(
                    color: Color(0xFF2F80ED),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, color: Colors.white, size: 18),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _BadgeImage extends StatelessWidget {
  const _BadgeImage({required this.badge, required this.size});

  final _SignatureBadge badge;
  final double size;

  @override
  Widget build(BuildContext context) {
    final imagePath = badge.imagePath.trim();
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.network(
          imagePath,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return _BadgeFallback(color: badge.color, size: size);
          },
        ),
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(12),
      child: Image.asset(
        imagePath.isNotEmpty ? imagePath : 'assets/images/badge_fallback.png',
        width: size,
        height: size,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) {
          return _BadgeFallback(color: badge.color, size: size);
        },
      ),
    );
  }
}

class _BadgeFallback extends StatelessWidget {
  const _BadgeFallback({required this.color, required this.size});

  final Color color;
  final double size;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      alignment: Alignment.center,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            color.withValues(alpha: 0.95),
            color.withValues(alpha: 0.55),
          ],
        ),
        borderRadius: BorderRadius.circular(12),
      ),
      child: const Icon(
        Icons.workspace_premium_outlined,
        color: Colors.white,
        size: 30,
      ),
    );
  }
}

class _EmailPreviewCard extends StatelessWidget {
  const _EmailPreviewCard({
    required this.name,
    required this.role,
    required this.email,
    required this.phone,
    required this.website,
    required this.showCompanyLogo,
    required this.badges,
  });

  final String name;
  final String role;
  final String email;
  final String phone;
  final String website;
  final bool showCompanyLogo;
  final List<_SignatureBadge> badges;

  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: const BoxConstraints(maxWidth: 300),
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [
          BoxShadow(
            color: Color(0x1F101828),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showCompanyLogo)
            const Text(
              'S',
              style: TextStyle(
                color: Color(0xFF3B82F6),
                fontSize: 70,
                fontWeight: FontWeight.w900,
              ),
            ),
          if (showCompanyLogo) ...[
            const SizedBox(width: 24),
            Container(width: 3, height: 150, color: const Color(0xFF2563FF)),
            const SizedBox(width: 24),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 17,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  role,
                  style: const TextStyle(
                    color: Color(0xFF667085),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  '✉ $email',
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF005DFF),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  '☎ $phone',
                  style: const TextStyle(
                    color: Color(0xFF475467),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 14),
                Text(
                  '🌐 $website',
                  style: const TextStyle(
                    color: Color(0xFF005DFF),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 14),
                const Divider(color: Color(0xFFE8EDF3)),
                const SizedBox(height: 8),
                const Text(
                  'CERTIFICAÇÕES',
                  style: TextStyle(
                    color: Color(0xFF98A2B3),
                    fontSize: 11,
                    letterSpacing: 0.4,
                  ),
                ),
                const SizedBox(height: 8),
                if (badges.isEmpty)
                  const Text(
                    'Sem badges selecionados',
                    style: TextStyle(color: Color(0xFF667085), fontSize: 12),
                  )
                else
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      for (final badge in badges.take(4))
                        _BadgeImage(badge: badge, size: 54),
                    ],
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TipCard extends StatelessWidget {
  const _TipCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFFFFFAEB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFFD666)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('💡', style: TextStyle(fontSize: 24)),
          SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Dica',
                  style: TextStyle(
                    color: Color(0xFF8A3B12),
                    fontSize: 16,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                SizedBox(height: 12),
                Text(
                  'A assinatura será exibida automaticamente no final de todos os seus emails. Certifique-se de que as informações estão corretas antes de exportar.',
                  style: TextStyle(
                    color: Color(0xFF9A3412),
                    fontSize: 14,
                    height: 1.45,
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

class _InstructionBox extends StatelessWidget {
  const _InstructionBox({
    required this.iconText,
    required this.title,
    required this.steps,
    this.iconColor = const Color(0xFF2563FF),
  });

  final String iconText;
  final String title;
  final List<String> steps;
  final Color iconColor;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFE0E5EE)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 34,
            height: 34,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: iconColor,
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              iconText,
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w800,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 12),
                for (final step in steps)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 7),
                    child: Text(
                      step,
                      style: const TextStyle(
                        color: Color(0xFF344054),
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

class _CardTitle extends StatelessWidget {
  const _CardTitle({required this.icon, required this.title});

  final IconData icon;
  final String title;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF005DFF), size: 22),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            title,
            style: const TextStyle(
              color: Color(0xFF111827),
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    );
  }
}

class _SignatureCard extends StatelessWidget {
  const _SignatureCard({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(
            color: Color(0x17101828),
            blurRadius: 20,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _SignatureTabItem {
  const _SignatureTabItem(this.icon, this.label);

  final IconData icon;
  final String label;
}

class _SignatureBadge {
  const _SignatureBadge({
    required this.id,
    required this.title,
    required this.imagePath,
    required this.publicToken,
    required this.color,
    this.selected = false,
  });

  final int id;
  final String title;
  final String imagePath;
  final String publicToken;
  final Color color;
  final bool selected;

  factory _SignatureBadge.fromApi(EmailSignatureBadge badge) {
    return _SignatureBadge(
      id: badge.id,
      title: badge.title,
      imagePath: badge.imagePath,
      publicToken: badge.publicToken,
      color: _colorFromId(badge.id),
      selected: badge.selected,
    );
  }

  _SignatureBadge copyWith({bool? selected}) {
    return _SignatureBadge(
      id: id,
      title: title,
      imagePath: imagePath,
      publicToken: publicToken,
      color: color,
      selected: selected ?? this.selected,
    );
  }
}

Color _colorFromId(int id) {
  const colors = [
    Color(0xFF244B7A),
    Color(0xFF2C5574),
    Color(0xFF3B2E7E),
    Color(0xFFD8A85A),
    Color(0xFF1D7D79),
  ];
  return colors[id.abs() % colors.length];
}
