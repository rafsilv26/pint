import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';

import '../l10n/app_language.dart';
import '../services/auth_service.dart';
import '../widgets/auth_widgets.dart';
import 'confirmation_page.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key, required this.onAuthenticated});

  final VoidCallback onAuthenticated;

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final AuthService authService = AuthService();
  final TextEditingController nameController = TextEditingController();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController companyPasswordController =
      TextEditingController();
  final TextEditingController passwordController = TextEditingController();
  final TextEditingController confirmPasswordController =
      TextEditingController();

  bool hidePassword = true;
  bool hideConfirmPassword = true;
  bool acceptedTerms = false;
  bool isSubmitting = false;

  Future<void> continueToConfirmation() async {
    if (isSubmitting) {
      return;
    }

    if (nameController.text.trim().isEmpty ||
        emailController.text.trim().isEmpty ||
        companyPasswordController.text.trim().isEmpty ||
        passwordController.text.trim().isEmpty ||
        confirmPasswordController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: AppText('Preencha todos os campos.')),
      );
      return;
    }

    if (passwordController.text != confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: AppText('As palavras-passe não coincidem.')),
      );
      return;
    }

    if (!acceptedTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: AppText('Aceite os termos para continuar.')),
      );
      return;
    }

    setState(() {
      isSubmitting = true;
    });

    try {
      await authService.createAccount(
        name: nameController.text.trim(),
        email: emailController.text.trim(),
        password: passwordController.text,
      );

      if (!mounted) {
        return;
      }

      Navigator.of(context).push(
        MaterialPageRoute(
          builder: (context) => ConfirmationPage(
            email: emailController.text.trim(),
            onAuthenticated: widget.onAuthenticated,
          ),
        ),
      );
    } on AuthException catch (error) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: AppText(error.message)));
    } catch (_) {
      if (!mounted) {
        return;
      }

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: AppText('Nao foi possivel comunicar com a API.'),
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          isSubmitting = false;
        });
      }
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    emailController.dispose();
    companyPasswordController.dispose();
    passwordController.dispose();
    confirmPasswordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1F2937),
        elevation: 0,
      ),
      body: SafeArea(
        top: false,
        child: AuthConstrainedContent(
          padding: const EdgeInsets.fromLTRB(24, 14, 24, 24),
          child: SingleChildScrollView(
            keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AppText(
                  'Criar conta',
                  style: TextStyle(
                    color: Color(0xFF24272E),
                    fontSize: 28,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 12),
                const AppText(
                  'Crie uma conta para iniciar.',
                  style: TextStyle(color: Color(0xFF858A94), fontSize: 16),
                ),
                const SizedBox(height: 4),
                AuthTextField(
                  controller: nameController,
                  label: 'Nome',
                  hintText: 'Nome',
                  keyboardType: TextInputType.name,
                ),
                const SizedBox(height: 20),
                AuthTextField(
                  controller: emailController,
                  label: 'Endereço email',
                  hintText: 'name@email.com',
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 20),
                AuthTextField(
                  controller: companyPasswordController,
                  label: 'Palavra-passe da empresa',
                  hintText: 'password',
                  obscureText: true,
                ),
                const SizedBox(height: 20),
                AuthTextField(
                  controller: passwordController,
                  label: 'Nova palavra-passe',
                  hintText: 'Criar palavra-passe',
                  obscureText: hidePassword,
                  suffixIcon: IconButton(
                    onPressed: () {
                      setState(() {
                        hidePassword = !hidePassword;
                      });
                    },
                    icon: Icon(
                      hidePassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: const Color(0xFF8A8F99),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                AuthTextField(
                  controller: confirmPasswordController,
                  hintText: 'Confirmar palavra-passe',
                  obscureText: hideConfirmPassword,
                  suffixIcon: IconButton(
                    onPressed: () {
                      setState(() {
                        hideConfirmPassword = !hideConfirmPassword;
                      });
                    },
                    icon: Icon(
                      hideConfirmPassword
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                      color: const Color(0xFF8A8F99),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                _TermsRow(
                  accepted: acceptedTerms,
                  onChanged: (value) {
                    setState(() {
                      acceptedTerms = value;
                    });
                  },
                ),
                const SizedBox(height: 32),
                PrimaryAuthButton(
                  text: isSubmitting ? 'A criar conta...' : 'Continuar',
                  onPressed: continueToConfirmation,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _TermsRow extends StatelessWidget {
  const _TermsRow({required this.accepted, required this.onChanged});

  final bool accepted;
  final ValueChanged<bool> onChanged;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 28,
          height: 28,
          child: Checkbox(
            value: accepted,
            onChanged: (value) => onChanged(value ?? false),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(6),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Text.rich(
              TextSpan(
                text: context.tr("I've read and agree with the "),
                style: const TextStyle(
                  color: Color(0xFF6B7280),
                  fontSize: 14,
                  height: 1.25,
                ),
                children: [
                  _LinkText(context.tr('Terms and Conditions')),
                  TextSpan(text: context.tr(' and the ')),
                  _LinkText(context.tr('Privacy Policy')),
                  const TextSpan(text: '.'),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _LinkText extends TextSpan {
  _LinkText(String text)
    : super(
        text: text,
        style: const TextStyle(
          color: Color(0xFF0076FF),
          fontWeight: FontWeight.w700,
        ),
        recognizer: TapGestureRecognizer()..onTap = () {},
      );
}
