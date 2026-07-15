import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:softinsa_badges_mobile/l10n/app_language.dart';

void main() {
  test('traduz textos estáticos e compostos nos três idiomas', () {
    const portuguese = AppStrings(AppLanguage.portuguese);
    const english = AppStrings(AppLanguage.english);
    const spanish = AppStrings(AppLanguage.spanish);

    expect(portuguese.translate('Catálogo de Badges'), 'Catálogo de Badges');
    expect(english.translate('Catálogo de Badges'), 'Badge Catalog');
    expect(spanish.translate('Catálogo de Badges'), 'Catálogo de Badges');
    expect(english.translate('12 consultores'), '12 consultants');
    expect(spanish.translate('3 conquistas'), '3 logros');
    expect(english.translate('Desde 07/07/2026'), 'Since 07/07/2026');
    expect(
      spanish.translate('Desbloqueado em 07/07/2026'),
      'Desbloqueado el 07/07/2026',
    );
    expect(english.translate('Criar objetivo'), 'Create goal');
    expect(spanish.translate('Página pública'), 'Página pública');
    expect(
      english.translate(
        'Enviámos um link de confirmação para user@example.com. Abra o link antes de iniciar sessão.',
      ),
      'We sent a confirmation link to user@example.com. Open it before signing in.',
    );
    expect(
      spanish.translate(
        'Parabéns por conquistar 3 badges. Continue a evoluir!',
      ),
      '¡Enhorabuena por conseguir 3 badges. Sigue avanzando!',
    );
  });

  testWidgets('AppText reage imediatamente à mudança de idioma', (
    WidgetTester tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    final controller = AppLanguageController();

    await tester.pumpWidget(
      AppLanguageScope(
        controller: controller,
        child: const MaterialApp(
          home: Scaffold(body: AppText('Alterar Palavra-Passe')),
        ),
      ),
    );

    expect(find.text('Alterar Palavra-Passe'), findsOneWidget);

    await controller.setLanguage(AppLanguage.english);
    await tester.pump();
    expect(find.text('Change Password'), findsOneWidget);

    await controller.setLanguage(AppLanguage.spanish);
    await tester.pump();
    expect(find.text('Cambiar Contraseña'), findsOneWidget);
  });
}
