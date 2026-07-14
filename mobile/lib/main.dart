import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

import 'l10n/app_language.dart';
import 'pages/auth_gate.dart';
import 'services/app_sync_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AppSyncService().synchronizeIfNeeded();
  final languageController = AppLanguageController.instance;
  await languageController.load();
  runApp(SoftinsaBadgesApp(languageController: languageController));
}

class SoftinsaBadgesApp extends StatelessWidget {
  SoftinsaBadgesApp({super.key, AppLanguageController? languageController})
    : languageController = languageController ?? AppLanguageController.instance;

  final AppLanguageController languageController;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: languageController,
      builder: (context, _) {
        return AppLanguageScope(
          controller: languageController,
          child: MaterialApp(
            title: AppStrings(languageController.language).appTitle,
            debugShowCheckedModeBanner: false,
            locale: languageController.locale,
            supportedLocales: const [Locale('pt'), Locale('en'), Locale('es')],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
            ],
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(
                seedColor: const Color(0xFF006DAA),
              ),
              scaffoldBackgroundColor: Colors.white,
              fontFamily: 'Roboto',
              useMaterial3: true,
            ),
            home: const AuthGate(),
          ),
        );
      },
    );
  }
}
