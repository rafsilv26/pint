import 'package:flutter/material.dart';

import '../l10n/app_language.dart';
import '../services/auth_service.dart';
import '../widgets/auth_header.dart';
import '../widgets/auth_widgets.dart';
import 'register_page.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key, required this.onAuthenticated});

  final VoidCallback onAuthenticated;

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final AuthService authService = AuthService();
  final TextEditingController emailController = TextEditingController();
  final TextEditingController passwordController = TextEditingController();

  bool hidePassword = true;
  bool rememberLogin = false;
  bool isSubmitting = false;

  @override
  void initState() {
    super.initState();
    loadSavedEmail();
  }

  Future<void> loadSavedEmail() async {
    final savedEmail = await authService.getSavedEmail();

    if (!mounted || savedEmail == null) {
      return;
    }

    setState(() {
      emailController.text = savedEmail;
      rememberLogin = true;
    });
  }

  Future<void> login() async {
    if (isSubmitting) {
      return;
    }

    if (emailController.text.trim().isEmpty ||
        passwordController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: AppText('Preencha o email e a palavra-passe.')),
      );
      return;
    }

    setState(() {
      isSubmitting = true;
    });

    try {
      await authService.login(
        email: emailController.text.trim(),
        password: passwordController.text,
        rememberLogin: rememberLogin,
      );

      if (mounted) {
        widget.onAuthenticated();
      }
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

  void openRegister() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) =>
            RegisterPage(onAuthenticated: widget.onAuthenticated),
      ),
    );
  }

  @override
  void dispose() {
    emailController.dispose();
    passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final screenHeight = MediaQuery.sizeOf(context).height;
    final headerHeight = screenHeight < 700 ? 220.0 : 300.0;

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
                    AuthHeader(height: headerHeight),
                    AuthConstrainedContent(
                      padding: const EdgeInsets.fromLTRB(24, 36, 24, 24),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const AppText(
                            'Entrar',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 30,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          const SizedBox(height: 30),
                          AuthTextField(
                            controller: emailController,
                            hintText: 'Email',
                            keyboardType: TextInputType.emailAddress,
                          ),
                          const SizedBox(height: 16),
                          AuthTextField(
                            controller: passwordController,
                            hintText: 'Palavra-passe',
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
                          const SizedBox(height: 18),
                          TextButton(
                            onPressed: () {},
                            style: TextButton.styleFrom(
                              foregroundColor: const Color(0xFF0076FF),
                              padding: EdgeInsets.zero,
                              textStyle: const TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            child: const AppText(
                              'Esqueceste-te da palavra-passe?',
                            ),
                          ),
                          const SizedBox(height: 18),
                          Row(
                            children: [
                              SizedBox(
                                width: 26,
                                height: 26,
                                child: Checkbox(
                                  value: rememberLogin,
                                  onChanged: (value) {
                                    setState(() {
                                      rememberLogin = value ?? false;
                                    });
                                  },
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              const AppText(
                                'Guardar dados login',
                                style: TextStyle(
                                  color: Color(0xFF767C86),
                                  fontSize: 15,
                                ),
                              ),
                            ],
                          ),
                          SizedBox(height: screenHeight < 700 ? 42 : 88),
                          PrimaryAuthButton(
                            text: isSubmitting ? 'A entrar...' : 'Login',
                            onPressed: login,
                          ),
                          const SizedBox(height: 16),
                          Center(
                            child: TextButton(
                              onPressed: openRegister,
                              child: const AppText('Criar conta'),
                            ),
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
