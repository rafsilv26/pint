import 'package:flutter/material.dart';

class ChangePasswordPage extends StatefulWidget {
  const ChangePasswordPage({super.key});

  @override
  State<ChangePasswordPage> createState() => _ChangePasswordPageState();
}

class _ChangePasswordPageState extends State<ChangePasswordPage> {
  final currentPasswordController = TextEditingController();
  final newPasswordController = TextEditingController();
  final confirmPasswordController = TextEditingController();

  bool hideCurrent = true;
  bool hideNew = true;
  bool hideConfirm = true;

  bool get hasMinLength => newPasswordController.text.length >= 8;
  bool get hasUppercase =>
      RegExp(r'[A-Z]').hasMatch(newPasswordController.text);
  bool get hasLowercase =>
      RegExp(r'[a-z]').hasMatch(newPasswordController.text);
  bool get hasNumber => RegExp(r'\d').hasMatch(newPasswordController.text);
  bool get hasSpecial => RegExp(
    r'''[!@#$%^&*(),.?":{}|<>_\-+=]''',
  ).hasMatch(newPasswordController.text);
  bool get passwordsMatch =>
      newPasswordController.text.isNotEmpty &&
      newPasswordController.text == confirmPasswordController.text;
  bool get canSubmit =>
      currentPasswordController.text.isNotEmpty &&
      hasMinLength &&
      hasUppercase &&
      hasLowercase &&
      hasNumber &&
      hasSpecial &&
      passwordsMatch;

  @override
  void initState() {
    super.initState();
    currentPasswordController.addListener(refresh);
    newPasswordController.addListener(refresh);
    confirmPasswordController.addListener(refresh);
  }

  void refresh() {
    setState(() {});
  }

  @override
  void dispose() {
    currentPasswordController.dispose();
    newPasswordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  void submit() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Palavra-passe alterada com sucesso.')),
    );
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const _ChangePasswordHeader(),
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final horizontalPadding = constraints.maxWidth < 380
                      ? 16.0
                      : 24.0;

                  return SingleChildScrollView(
                    padding: EdgeInsets.fromLTRB(
                      horizontalPadding,
                      28,
                      horizontalPadding,
                      28,
                    ),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: const BoxConstraints(maxWidth: 560),
                        child: Column(
                          children: [
                            _PasswordSection(
                              icon: Icons.shield_outlined,
                              title: 'Palavra-Passe Atual',
                              child: _PasswordField(
                                controller: currentPasswordController,
                                hintText: 'Insira a palavra-passe atual',
                                obscureText: hideCurrent,
                                onToggle: () {
                                  setState(() {
                                    hideCurrent = !hideCurrent;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(height: 22),
                            _PasswordSection(
                              icon: Icons.lock_outline,
                              title: 'Nova Palavra-Passe',
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _PasswordField(
                                    controller: newPasswordController,
                                    hintText: 'Insira a nova palavra-passe',
                                    obscureText: hideNew,
                                    onToggle: () {
                                      setState(() {
                                        hideNew = !hideNew;
                                      });
                                    },
                                  ),
                                  const SizedBox(height: 22),
                                  const Text(
                                    'Requisitos da palavra-passe:',
                                    style: TextStyle(
                                      color: Color(0xFF344054),
                                      fontSize: 16,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                  _RequirementRow(
                                    text: 'Mínimo de 8 caracteres',
                                    checked: hasMinLength,
                                  ),
                                  _RequirementRow(
                                    text: 'Pelo menos uma letra maiúscula',
                                    checked: hasUppercase,
                                  ),
                                  _RequirementRow(
                                    text: 'Pelo menos uma letra minúscula',
                                    checked: hasLowercase,
                                  ),
                                  _RequirementRow(
                                    text: 'Pelo menos um número',
                                    checked: hasNumber,
                                  ),
                                  _RequirementRow(
                                    text:
                                        "Pelo menos um caractere especial (!@#\$%^&*)",
                                    checked: hasSpecial,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 22),
                            _PasswordSection(
                              icon: Icons.lock_outline,
                              title: 'Confirmar Nova Palavra-Passe',
                              child: _PasswordField(
                                controller: confirmPasswordController,
                                hintText: 'Confirme a nova palavra-passe',
                                obscureText: hideConfirm,
                                onToggle: () {
                                  setState(() {
                                    hideConfirm = !hideConfirm;
                                  });
                                },
                              ),
                            ),
                            const SizedBox(height: 26),
                            const _SecurityTips(),
                            const SizedBox(height: 26),
                            SizedBox(
                              width: double.infinity,
                              height: 58,
                              child: FilledButton.icon(
                                onPressed: canSubmit ? submit : null,
                                icon: const Icon(Icons.lock_outline),
                                label: const Text('Alterar Palavra-Passe'),
                                style: FilledButton.styleFrom(
                                  backgroundColor: const Color(0xFF006DAA),
                                  disabledBackgroundColor: const Color(
                                    0xFFD0D5DD,
                                  ),
                                  disabledForegroundColor: const Color(
                                    0xFF667085,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(16),
                                  ),
                                  textStyle: const TextStyle(
                                    fontSize: 17,
                                    fontWeight: FontWeight.w800,
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(height: 26),
                            const Text(
                              'Após alterar, será necessário fazer login novamente em alguns dispositivos',
                              textAlign: TextAlign.center,
                              style: TextStyle(
                                color: Color(0xFF667085),
                                fontSize: 16,
                                height: 1.4,
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
          ],
        ),
      ),
    );
  }
}

class _ChangePasswordHeader extends StatelessWidget {
  const _ChangePasswordHeader();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(22, 12, 22, 28),
      color: const Color(0xFF006DAA),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextButton.icon(
            onPressed: () => Navigator.of(context).pop(),
            style: TextButton.styleFrom(
              foregroundColor: Colors.white,
              padding: EdgeInsets.zero,
              minimumSize: const Size(0, 34),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
            icon: const Icon(Icons.arrow_back, size: 22),
            label: const Text(
              'Voltar',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w500),
            ),
          ),
          const SizedBox(height: 26),
          Row(
            children: [
              Container(
                width: 70,
                height: 70,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.22),
                  borderRadius: BorderRadius.circular(18),
                ),
                child: const Icon(
                  Icons.lock_outline,
                  color: Colors.white,
                  size: 42,
                ),
              ),
              const SizedBox(width: 20),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Alterar Palavra-Passe',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 25,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    SizedBox(height: 12),
                    Text(
                      'Mantenha a sua conta segura',
                      style: TextStyle(color: Color(0xFFE6F5FF), fontSize: 17),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _PasswordSection extends StatelessWidget {
  const _PasswordSection({
    required this.icon,
    required this.title,
    required this.child,
  });

  final IconData icon;
  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
            color: Color(0x17101828),
            blurRadius: 22,
            offset: Offset(0, 12),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: const Color(0xFF005DFF), size: 28),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          child,
        ],
      ),
    );
  }
}

class _PasswordField extends StatelessWidget {
  const _PasswordField({
    required this.controller,
    required this.hintText,
    required this.obscureText,
    required this.onToggle,
  });

  final TextEditingController controller;
  final String hintText;
  final bool obscureText;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: controller,
      obscureText: obscureText,
      style: const TextStyle(fontSize: 17),
      decoration: InputDecoration(
        hintText: hintText,
        hintStyle: const TextStyle(color: Color(0xFF98A2B3)),
        suffixIcon: IconButton(
          onPressed: onToggle,
          icon: Icon(
            obscureText
                ? Icons.visibility_outlined
                : Icons.visibility_off_outlined,
            color: const Color(0xFF98A2B3),
          ),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 18,
          vertical: 17,
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xFFD0D5DD), width: 1.4),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(15),
          borderSide: const BorderSide(color: Color(0xFF005DFF), width: 1.6),
        ),
      ),
    );
  }
}

class _RequirementRow extends StatelessWidget {
  const _RequirementRow({required this.text, required this.checked});

  final String text;
  final bool checked;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 11),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: checked
                  ? const Color(0xFFDDFBE7)
                  : const Color(0xFFF2F4F7),
              shape: BoxShape.circle,
            ),
            child: Icon(
              checked ? Icons.check : Icons.close,
              color: checked
                  ? const Color(0xFF00A651)
                  : const Color(0xFF98A2B3),
              size: 17,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                color: checked
                    ? const Color(0xFF344054)
                    : const Color(0xFF667085),
                fontSize: 16,
                height: 1.25,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _SecurityTips extends StatelessWidget {
  const _SecurityTips();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF3FF),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFB6D2FF)),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.shield_outlined, color: Color(0xFF174193), size: 30),
              SizedBox(width: 12),
              Text(
                'Dicas de Segurança',
                style: TextStyle(
                  color: Color(0xFF174193),
                  fontSize: 20,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
          SizedBox(height: 18),
          _TipLine('Use uma combinação única de letras, números e símbolos'),
          _TipLine('Evite usar informações pessoais óbvias'),
          _TipLine('Não reutilize palavras-passe de outras contas'),
          _TipLine('Altere a sua palavra-passe regularmente'),
        ],
      ),
    );
  }
}

class _TipLine extends StatelessWidget {
  const _TipLine(this.text);

  final String text;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '•',
            style: TextStyle(color: Color(0xFF005DFF), fontSize: 18),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                color: Color(0xFF005DFF),
                fontSize: 16,
                height: 1.35,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
