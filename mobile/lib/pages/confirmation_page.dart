import 'package:flutter/material.dart';

import '../l10n/app_language.dart';
import '../services/auth_service.dart';
import '../widgets/auth_widgets.dart';

/// O backend envia um link seguro por email. A conta permanece bloqueada ate
/// esse link ser usado; a app nunca simula uma confirmacao local.
class ConfirmationPage extends StatefulWidget {
  const ConfirmationPage({super.key, required this.email});

  final String email;

  @override
  State<ConfirmationPage> createState() => _ConfirmationPageState();
}

class _ConfirmationPageState extends State<ConfirmationPage> {
  final AuthService authService = AuthService();
  bool resending = false;

  Future<void> resend() async {
    if (resending) return;
    setState(() => resending = true);
    try {
      await authService.resendConfirmation(widget.email);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: AppText('Email de confirmação reenviado.')),
        );
      }
    } on AuthException catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: AppText(error.message)));
      }
    } finally {
      if (mounted) setState(() => resending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(backgroundColor: Colors.white),
      body: AuthConstrainedContent(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 84,
              height: 84,
              decoration: const BoxDecoration(
                color: Color(0xFFEAF3FF),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.mark_email_unread_outlined,
                color: Color(0xFF006DAA),
                size: 42,
              ),
            ),
            const SizedBox(height: 28),
            const AppText(
              'Confirme o seu email',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 25, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 14),
            AppText(
              'Enviámos um link de confirmação para ${widget.email}. Abra o link antes de iniciar sessão.',
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: Color(0xFF667085),
                fontSize: 15,
                height: 1.45,
              ),
            ),
            const SizedBox(height: 34),
            PrimaryAuthButton(
              text: 'Voltar ao login',
              onPressed: () =>
                  Navigator.of(context).popUntil((route) => route.isFirst),
            ),
            const SizedBox(height: 14),
            TextButton(
              onPressed: resending ? null : resend,
              child: AppText(resending ? 'A reenviar...' : 'Reenviar email'),
            ),
          ],
        ),
      ),
    );
  }
}
