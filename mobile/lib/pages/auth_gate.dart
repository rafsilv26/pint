import 'dart:async';

import 'package:flutter/material.dart';

import '../services/app_sync_service.dart';
import '../services/app_sync_trigger_service.dart';
import '../services/auth_service.dart';
import '../services/candidatura_outbox_service.dart';
import '../services/push_notification_service.dart';
import 'change_password_page.dart';
import 'home_page.dart';
import 'login_page.dart';
import 'rgpd_policy_page.dart';

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
      // O registo PUSH e auxiliar: permissões, Firebase ou a rede nunca devem
      // impedir o utilizador de entrar e trabalhar com os dados locais.
      unawaited(PushNotificationService.instance.initialize());
      unawaited(_synchronizeSession());
      final mustChangePassword = await authService.mustChangePassword();
      final pendingPolicies = await authService.getPendingPolicies();
      return _AuthState(
        loggedIn: true,
        mustChangePassword: mustChangePassword,
        pendingPolicies: pendingPolicies,
      );
    }

    return const _AuthState.loggedOut();
  }

  Future<void> _synchronizeSession() async {
    try {
      final synchronized = await AppSyncService().synchronizeIfNeeded();
      if (!synchronized && await CandidaturaOutboxService().hasPendingWork()) {
        AppSyncTriggerService.instance.requestSync();
      }
    } catch (_) {
      // A app abre sempre com SQLite; o lifecycle volta a tentar mais tarde.
    }
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

        if (authState.loggedIn && authState.pendingPolicies.isNotEmpty) {
          return RgpdPolicyPage(
            policies: authState.pendingPolicies,
            onAccepted: showHome,
            onLogout: () async {
              await authService.logout();
              showLogin();
            },
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
  const _AuthState({
    required this.loggedIn,
    required this.mustChangePassword,
    this.pendingPolicies = const [],
  });

  const _AuthState.loggedOut()
    : loggedIn = false,
      mustChangePassword = false,
      pendingPolicies = const [];

  final bool loggedIn;
  final bool mustChangePassword;
  final List<PendingPolicy> pendingPolicies;
}
