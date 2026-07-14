import 'package:flutter/material.dart';

import '../l10n/app_language.dart';
import '../services/auth_service.dart';

class RgpdPolicyPage extends StatefulWidget {
  const RgpdPolicyPage({
    super.key,
    required this.policies,
    required this.onAccepted,
    required this.onLogout,
  });

  final List<PendingPolicy> policies;
  final VoidCallback onAccepted;
  final VoidCallback onLogout;

  @override
  State<RgpdPolicyPage> createState() => _RgpdPolicyPageState();
}

class _RgpdPolicyPageState extends State<RgpdPolicyPage> {
  final AuthService authService = AuthService();
  int index = 0;
  bool confirmed = false;
  bool loading = false;

  Future<void> accept() async {
    if (!confirmed || loading) return;
    setState(() => loading = true);
    try {
      await authService.acceptPolicy(widget.policies[index].id);
      if (!mounted) return;
      if (index + 1 >= widget.policies.length) {
        widget.onAccepted();
      } else {
        setState(() {
          index++;
          confirmed = false;
          loading = false;
        });
      }
    } on AuthException catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: AppText(error.message)));
      setState(() => loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final policy = widget.policies[index];
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7FB),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 580),
            child: Padding(
              padding: const EdgeInsets.all(22),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(22),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.privacy_tip_outlined,
                            color: Color(0xFF006DAA),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: AppText(
                              policy.title,
                              style: const TextStyle(
                                fontSize: 21,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (policy.version.isNotEmpty) ...[
                        const SizedBox(height: 6),
                        AppText(
                          'Versão ${policy.version}',
                          style: const TextStyle(color: Color(0xFF667085)),
                        ),
                      ],
                      const SizedBox(height: 18),
                      Expanded(
                        child: SingleChildScrollView(
                          child: AppText(
                            policy.description,
                            style: const TextStyle(fontSize: 15, height: 1.5),
                          ),
                        ),
                      ),
                      CheckboxListTile(
                        contentPadding: EdgeInsets.zero,
                        value: confirmed,
                        onChanged: (value) =>
                            setState(() => confirmed = value ?? false),
                        title: const AppText(
                          'Confirmo que li e aceito esta política RGPD.',
                        ),
                        controlAffinity: ListTileControlAffinity.leading,
                      ),
                      const SizedBox(height: 10),
                      SizedBox(
                        width: double.infinity,
                        child: FilledButton(
                          onPressed: confirmed && !loading ? accept : null,
                          child: AppText(
                            loading ? 'A aceitar...' : 'Aceitar e continuar',
                          ),
                        ),
                      ),
                      Center(
                        child: TextButton(
                          onPressed: loading ? null : widget.onLogout,
                          child: const AppText('Terminar sessão'),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
