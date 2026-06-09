import 'package:flutter/material.dart';

import '../repositories/dashboard_repository.dart';
import '../services/auth_service.dart';
import 'home_page.dart';
import 'login_page.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  final AuthService authService = AuthService();
  late Future<bool> loggedInFuture;

  @override
  void initState() {
    super.initState();
    loggedInFuture = _checkSessionAndSync();
  }

  void showHome() {
    setState(() {
      loggedInFuture = _checkSessionAndSync();
    });
  }

  void showLogin() {
    setState(() {
      loggedInFuture = Future.value(false);
    });
  }

  Future<bool> _checkSessionAndSync() async {
    final isLoggedIn = await authService.isLoggedIn();
    if (isLoggedIn) {
      await DashboardRepository().prepareLocalData();
    }

    return isLoggedIn;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: loggedInFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (snapshot.data == true) {
          return HomePage(onLoggedOut: showLogin);
        }

        return LoginPage(onAuthenticated: showHome);
      },
    );
  }
}
