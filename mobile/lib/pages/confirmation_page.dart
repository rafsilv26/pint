import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../services/auth_service.dart';
import '../widgets/auth_header.dart';
import '../widgets/auth_widgets.dart';

class ConfirmationPage extends StatefulWidget {
  const ConfirmationPage({
    super.key,
    required this.email,
    required this.onAuthenticated,
  });

  final String email;
  final VoidCallback onAuthenticated;

  @override
  State<ConfirmationPage> createState() => _ConfirmationPageState();
}

class _ConfirmationPageState extends State<ConfirmationPage> {
  final AuthService authService = AuthService();
  final List<TextEditingController> codeControllers = List.generate(
    4,
    (_) => TextEditingController(),
  );
  final List<FocusNode> focusNodes = List.generate(4, (_) => FocusNode());

  Future<void> confirmCode() async {
    final code = codeControllers.map((controller) => controller.text).join();

    if (code.length != 4) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Insira o código de 4 dígitos.')),
      );
      return;
    }

    await authService.confirmAccount();

    if (!mounted) {
      return;
    }

    widget.onAuthenticated();
    Navigator.of(context).popUntil((route) => route.isFirst);
  }

  void resendCode() {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(const SnackBar(content: Text('Código enviado novamente.')));
  }

  @override
  void dispose() {
    for (final controller in codeControllers) {
      controller.dispose();
    }
    for (final focusNode in focusNodes) {
      focusNode.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.sizeOf(context).height;
    final headerHeight = screenHeight < 700 ? 116.0 : 150.0;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        top: false,
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              child: ConstrainedBox(
                constraints: BoxConstraints(minHeight: constraints.maxHeight),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    AuthHeader(height: headerHeight, compact: true),
                    AuthConstrainedContent(
                      padding: EdgeInsets.fromLTRB(
                        24,
                        screenHeight < 700 ? 50 : 110,
                        24,
                        24,
                      ),
                      child: Column(
                        children: [
                          const Text(
                            'Insira o código de confirmação',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Color(0xFF24272E),
                              fontSize: 23,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 14),
                          Text(
                            'Um código de 4 dígitos foi enviado para:\n${widget.email}',
                            textAlign: TextAlign.center,
                            style: const TextStyle(
                              color: Color(0xFF858A94),
                              fontSize: 16,
                              height: 1.3,
                            ),
                          ),
                          SizedBox(height: screenHeight < 700 ? 42 : 70),
                          LayoutBuilder(
                            builder: (context, codeConstraints) {
                              final boxSize =
                                  ((codeConstraints.maxWidth - 36) / 4).clamp(
                                    52.0,
                                    62.0,
                                  );

                              return Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  for (var index = 0; index < 4; index++) ...[
                                    _CodeBox(
                                      size: boxSize,
                                      controller: codeControllers[index],
                                      focusNode: focusNodes[index],
                                      onChanged: (value) {
                                        if (value.isNotEmpty && index < 3) {
                                          focusNodes[index + 1].requestFocus();
                                        }
                                      },
                                    ),
                                    if (index < 3) const SizedBox(width: 12),
                                  ],
                                ],
                              );
                            },
                          ),
                          SizedBox(height: screenHeight < 700 ? 56 : 132),
                          TextButton(
                            onPressed: resendCode,
                            child: const Text(
                              'Enviar novamente',
                              style: TextStyle(
                                color: Color(0xFF0076FF),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                          const SizedBox(height: 34),
                          PrimaryAuthButton(
                            text: 'Continuar',
                            onPressed: confirmCode,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

class _CodeBox extends StatelessWidget {
  const _CodeBox({
    required this.size,
    required this.controller,
    required this.focusNode,
    required this.onChanged,
  });

  final double size;
  final TextEditingController controller;
  final FocusNode focusNode;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: TextField(
        controller: controller,
        focusNode: focusNode,
        keyboardType: TextInputType.number,
        textAlign: TextAlign.center,
        maxLength: 1,
        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
        style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
        decoration: InputDecoration(
          counterText: '',
          contentPadding: EdgeInsets.zero,
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFFD0D5DD), width: 1.4),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: Color(0xFF0076FF), width: 1.8),
          ),
        ),
        onChanged: onChanged,
      ),
    );
  }
}
