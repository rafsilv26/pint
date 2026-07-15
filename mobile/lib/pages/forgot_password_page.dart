import 'package:flutter/material.dart';

import '../l10n/app_language.dart';
import '../services/auth_service.dart';
import '../widgets/auth_widgets.dart';

class ForgotPasswordPage extends StatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  State<ForgotPasswordPage> createState() => _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends State<ForgotPasswordPage> {
  final AuthService authService = AuthService();
  final emailController = TextEditingController();
  final tokenController = TextEditingController();
  final passwordController = TextEditingController();
  final confirmationController = TextEditingController();
  bool emailSent = false;
  bool loading = false;
  bool showErrors = false;

  @override
  void dispose() {
    emailController.dispose();
    tokenController.dispose();
    passwordController.dispose();
    confirmationController.dispose();
    super.dispose();
  }

  Future<void> requestEmail() async {
    setState(() => showErrors = true);
    if (!_validEmail(emailController.text.trim())) return;
    await _run(() async {
      final message = await authService.forgotPassword(
        emailController.text.trim(),
      );
      if (!mounted) return;
      setState(() {
        emailSent = true;
        showErrors = false;
      });
      _message(message);
    });
  }

  Future<void> reset() async {
    setState(() => showErrors = true);
    if (tokenController.text.trim().isEmpty ||
        passwordController.text.length < 8 ||
        passwordController.text != confirmationController.text) {
      return;
    }
    await _run(() async {
      await authService.resetPassword(
        token: tokenController.text.trim(),
        newPassword: passwordController.text,
      );
      if (!mounted) return;
      _message('A sua password foi redefinida com sucesso.');
      Navigator.of(context).pop();
    });
  }

  Future<void> _run(Future<void> Function() action) async {
    if (loading) return;
    setState(() => loading = true);
    try {
      await action();
    } on AuthException catch (error) {
      if (mounted) _message(error.message);
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void _message(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: AppText(message)));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const AppText('Recuperar palavra-passe')),
      body: AuthConstrainedContent(
        child: ListView(
          children: [
            const AppText(
              'Recuperar palavra-passe',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 12),
            const AppText(
              'Receba um link seguro no email. Também pode colar abaixo o token incluído no link.',
              style: TextStyle(color: Color(0xFF667085), height: 1.4),
            ),
            const SizedBox(height: 24),
            AuthTextField(
              controller: emailController,
              label: 'Email',
              hintText: 'name@email.com',
              keyboardType: TextInputType.emailAddress,
              errorText: showErrors && !_validEmail(emailController.text.trim())
                  ? 'Email inválido'
                  : null,
            ),
            const SizedBox(height: 16),
            PrimaryAuthButton(
              text: loading ? 'A enviar...' : 'Enviar email de recuperação',
              onPressed: requestEmail,
            ),
            if (emailSent) ...[
              const SizedBox(height: 30),
              const Divider(),
              const SizedBox(height: 20),
              AuthTextField(
                controller: tokenController,
                label: 'Token de recuperação',
                hintText: 'Cole o token recebido',
                errorText: showErrors && tokenController.text.trim().isEmpty
                    ? 'Campo obrigatório'
                    : null,
              ),
              const SizedBox(height: 16),
              AuthTextField(
                controller: passwordController,
                label: 'Nova palavra-passe',
                hintText: 'Nova palavra-passe',
                obscureText: true,
                errorText: showErrors && passwordController.text.length < 8
                    ? 'Mínimo de 8 caracteres'
                    : null,
              ),
              const SizedBox(height: 16),
              AuthTextField(
                controller: confirmationController,
                label: 'Confirmar palavra-passe',
                hintText: 'Confirmar palavra-passe',
                obscureText: true,
                errorText:
                    showErrors &&
                        passwordController.text != confirmationController.text
                    ? 'As palavras-passe não coincidem'
                    : null,
              ),
              const SizedBox(height: 20),
              PrimaryAuthButton(
                text: loading ? 'A redefinir...' : 'Redefinir palavra-passe',
                onPressed: reset,
              ),
            ],
            const SizedBox(height: 16),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const AppText('Cancelar'),
            ),
          ],
        ),
      ),
    );
  }
}

bool _validEmail(String value) =>
    RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(value);
