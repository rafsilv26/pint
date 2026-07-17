import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:softinsa_badges_mobile/main.dart';
import 'package:softinsa_badges_mobile/l10n/app_language.dart';

void main() {
  Map<String, Object> loggedSession() {
    return {
      'softinsa_user_logged_in': true,
      'softinsa_auth_token': fakeValidToken(),
    };
  }

  testWidgets('mostra login quando o utilizador nao tem sessao', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    expect(find.text('Entrar'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
    expect(find.text('Criar conta'), findsOneWidget);
  });

  testWidgets('nao entra se existir apenas flag antiga sem token', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues({'softinsa_user_logged_in': true});

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    expect(find.text('Entrar'), findsOneWidget);
    expect(find.text('Login'), findsOneWidget);
  });

  testWidgets('mostra a pagina inicial quando o utilizador tem sessao', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    expect(find.text('Rafael Silva'), findsOneWidget);
    expect(find.text('Total de Pontos'), findsOneWidget);
    expect(find.text('Recomendado para Si'), findsOneWidget);
    expect(find.text('OutSystems Advanced'), findsOneWidget);
  });

  testWidgets('forca alterar password no primeiro login empresarial', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      ...loggedSession(),
      'softinsa_user_must_change_password': true,
    });

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    expect(find.text('Alterar Palavra-Passe'), findsWidgets);
    expect(
      find.textContaining('palavra-passe fornecida pela empresa'),
      findsWidgets,
    );
    expect(find.text('Total de Pontos'), findsNothing);
  });

  testWidgets('abre a pagina de perfil pelo menu inferior', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Perfil'));
    await tester.pumpAndSettle();

    expect(find.text('Gestão de conta e preferências'), findsOneWidget);
    expect(find.text('Diretório de\nConsultores'), findsOneWidget);
    expect(find.text('Privacidade e RGPD'), findsOneWidget);
  });

  testWidgets('abre a gestao de assinatura atraves do perfil', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Perfil'));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Configurar Assinatura'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Configurar Assinatura'));
    await tester.pumpAndSettle();

    expect(find.text('Assinatura de Email'), findsOneWidget);
    expect(find.text('Informações Pessoais'), findsOneWidget);

    await tester.tap(find.text('Pré-visualizar'));
    await tester.pumpAndSettle();
    expect(find.text('Pré-visualização'), findsOneWidget);

    await tester.tap(find.text('Exportar'));
    await tester.pumpAndSettle();
    expect(find.text('Exportar Assinatura'), findsOneWidget);
  });

  testWidgets('abre diretorio e detalhes de consultor pelo perfil', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Perfil'));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Diretório de\nConsultores'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Diretório de\nConsultores'));
    await tester.pumpAndSettle();

    expect(find.text('Consultores'), findsWidgets);
    expect(find.text('10 consultores'), findsOneWidget);
    expect(find.text('Maria Santos'), findsOneWidget);

    await tester.tap(find.text('João Silva'));
    await tester.pumpAndSettle();

    expect(find.text('Badges Conquistados'), findsOneWidget);

    await tester.tap(find.text('Conquistas'));
    await tester.pumpAndSettle();
    expect(find.text('Conquistas Especiais'), findsOneWidget);

    await tester.tap(find.text('Stats'));
    await tester.pumpAndSettle();
    expect(find.text('Taxa de Conclusão'), findsOneWidget);
  });

  testWidgets('menu inferior navega a partir do detalhe de consultor', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Perfil'));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Diretório de\nConsultores'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Diretório de\nConsultores'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('João Silva'));
    await tester.pumpAndSettle();

    final rankingMenuItem = find.descendant(
      of: find.byType(BottomNavigationBar),
      matching: find.text('Ranking'),
    );
    await tester.tap(rankingMenuItem);
    await tester.pumpAndSettle();

    expect(find.text('Gamification'), findsOneWidget);
  });

  testWidgets('abre gamification pelo menu de ranking', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Ranking').last);
    await tester.pumpAndSettle();

    expect(find.text('Gamification'), findsOneWidget);
    expect(find.text('Top Consultores - Hybrid Cloud'), findsOneWidget);
    expect(find.text('Evolução Profissional'), findsOneWidget);
  });

  testWidgets('abre catalogo pelo menu inferior', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Catálogo'));
    await tester.pumpAndSettle();

    expect(find.text('Catálogo de Badges'), findsOneWidget);
    expect(find.text('Todos'), findsOneWidget);
    expect(find.text('OutSystems Advanced'), findsOneWidget);
  });

  testWidgets('abre meus badges pelo menu inferior', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Meus\nBadges'));
    await tester.pumpAndSettle();

    expect(find.text('Meus Badges'), findsOneWidget);
    expect(find.text('Azure Fundamentals'), findsOneWidget);
    expect(find.text('Aprovada'), findsOneWidget);
  });

  testWidgets('abre conquistas especiais pelo card da home', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Conquistas especiais'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Conquistas especiais'));
    await tester.pumpAndSettle();

    expect(find.text('Primeiro Passo'), findsOneWidget);
    expect(find.text('Trio de Sucesso'), findsOneWidget);
    expect(find.text('Especialista Multi-Cloud'), findsOneWidget);
  });

  testWidgets('abre notificacoes pelo sino da home', (
    WidgetTester tester,
  ) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.notifications_none).first);
    await tester.pumpAndSettle();

    expect(find.text('Notificações'), findsOneWidget);
    expect(find.text('2 novas'), findsOneWidget);
    expect(find.text('Marcar todas'), findsOneWidget);
    expect(find.text('Marcar como lida'), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('abre alterar password atraves do perfil', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());

    await tester.pumpWidget(SoftinsaBadgesApp());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Perfil'));
    await tester.pumpAndSettle();

    await tester.ensureVisible(find.text('Alterar Password'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Alterar Password'));
    await tester.pumpAndSettle();

    expect(find.text('Alterar Palavra-Passe'), findsWidgets);
    expect(find.text('Palavra-Passe Atual'), findsOneWidget);
    expect(find.text('Dicas de Segurança'), findsOneWidget);
  });

  testWidgets('inglês mantém a tradução ao navegar pelas páginas principais', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());
    final languageController = AppLanguageController(
      initialLanguage: AppLanguage.english,
    );

    await tester.pumpWidget(
      SoftinsaBadgesApp(languageController: languageController),
    );
    await tester.pumpAndSettle();

    expect(find.text('Total Points'), findsOneWidget);
    expect(find.text('Recommended for You'), findsOneWidget);

    await tester.tap(find.text('Catalog'));
    await tester.pumpAndSettle();
    expect(find.text('Badge Catalog'), findsOneWidget);
    expect(find.text('Available'), findsOneWidget);

    await tester.tap(find.text('My\nBadges'));
    await tester.pumpAndSettle();
    expect(find.text('My Badges'), findsOneWidget);
    expect(find.text('In progress'), findsWidgets);

    await tester.tap(find.text('Ranking').last);
    await tester.pumpAndSettle();
    expect(find.text('Ranking and Achievements'), findsOneWidget);
    expect(find.text('Professional Development'), findsOneWidget);

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    expect(find.text('Account and preferences management'), findsOneWidget);
    expect(find.text('Privacy and GDPR'), findsOneWidget);
  });

  testWidgets('espanhol é aplicado ao login e à navegação', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final languageController = AppLanguageController(
      initialLanguage: AppLanguage.spanish,
    );

    await tester.pumpWidget(
      SoftinsaBadgesApp(languageController: languageController),
    );
    await tester.pumpAndSettle();

    expect(find.text('Contraseña'), findsOneWidget);
    expect(find.text('¿Olvidaste tu contraseña?'), findsOneWidget);
    expect(find.text('Crear cuenta'), findsOneWidget);
  });

  testWidgets('seletor do perfil muda e guarda o idioma da aplicação', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues(loggedSession());
    final languageController = AppLanguageController();

    await tester.pumpWidget(
      SoftinsaBadgesApp(languageController: languageController),
    );
    await tester.pumpAndSettle();

    await tester.tap(find.text('Perfil'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('🇬🇧 Inglês'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('🇬🇧 Inglês'));
    await tester.pumpAndSettle();

    expect(find.text('Language'), findsOneWidget);
    expect(find.text('🇪🇸 Spanish'), findsOneWidget);

    await tester.ensureVisible(find.text('🇪🇸 Spanish'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('🇪🇸 Spanish'));
    await tester.pumpAndSettle();
    expect(find.text('Idioma'), findsOneWidget);
    expect(find.text('🇬🇧 Inglés'), findsOneWidget);

    final preferences = await SharedPreferences.getInstance();
    expect(preferences.getString('softinsa_language_code'), 'es');
  });
}

String fakeValidToken() {
  String encodePart(Map<String, Object> value) {
    return base64Url.encode(utf8.encode(jsonEncode(value))).replaceAll('=', '');
  }

  final header = encodePart({'alg': 'HS256', 'typ': 'JWT'});
  final payload = encodePart({'exp': 4102444800});
  return '$header.$payload.signature';
}
