import 'package:flutter/material.dart';

import '../services/app_sync_service.dart';
import '../services/auth_service.dart';
import 'change_password_page.dart';
import 'home_page.dart';
import 'login_page.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final AuthService authService = AuthService();
  late Future<_AuthState> authStateFuture;

  @override
  void initState() {
    super.initState();
    authStateFuture = _checkSessionAndSync();
  }

  void showHome() {
    setState(() {
      authStateFuture = _checkSessionAndSync();
    });
  }

  void showLogin() {
    setState(() {
      authStateFuture = Future.value(const _AuthState.loggedOut());
    });
  }

  Future<_AuthState> _checkSessionAndSync() async {
    final isLoggedIn = await authService.isLoggedIn();
    if (isLoggedIn) {
      await AppSyncService().synchronizeIfNeeded();
      final mustChangePassword = await authService.mustChangePassword();
      return _AuthState(loggedIn: true, mustChangePassword: mustChangePassword);
    }

    return const _AuthState.loggedOut();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<_AuthState>(
      future: authStateFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final authState = snapshot.data ?? const _AuthState.loggedOut();
        if (authState.loggedIn && authState.mustChangePassword) {
          return ChangePasswordPage(
            forceChange: true,
            onPasswordChanged: showHome,
          );
        }

        if (authState.loggedIn) {
          return HomePage(onLoggedOut: showLogin);
        }

        return LoginPage(onAuthenticated: showHome);
      },
    );
  }
}

class _AuthState {
  const _AuthState({required this.loggedIn, required this.mustChangePassword});

  const _AuthState.loggedOut() : loggedIn = false, mustChangePassword = false;

  final bool loggedIn;
  final bool mustChangePassword;
}
