import 'package:flutter/material.dart';

import 'pages/auth_gate.dart';

void main() {
  runApp(const SoftinsaBadgesApp());
}

class SoftinsaBadgesApp extends StatelessWidget {
  const SoftinsaBadgesApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Softinsa Badges',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF006DAA)),
        scaffoldBackgroundColor: Colors.white,
        fontFamily: 'Roboto',
        useMaterial3: true,
      ),
      home: const AuthGate(),
    );
  }
}
