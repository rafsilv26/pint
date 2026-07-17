import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:softinsa_badges_mobile/l10n/app_language.dart';
import 'package:softinsa_badges_mobile/models/mobile_api_data.dart';
import 'package:softinsa_badges_mobile/pages/catalog_page.dart';

void main() {
  testWidgets('fecha o formulario e o detalhe depois da candidatura', (
    tester,
  ) async {
    var submitCalls = 0;

    await tester.pumpWidget(
      AppLanguageScope(
        controller: AppLanguageController(),
        child: MaterialApp(
          home: _NavigationHarness(
            onApply: (_) async {
              submitCalls++;
              return true;
            },
          ),
        ),
      ),
    );

    await tester.tap(find.byKey(const Key('open-badge-detail')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Candidatar a Badge'));
    await tester.tap(find.text('Candidatar a Badge'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Submeter candidatura'));
    await tester.tap(find.text('Submeter candidatura'));
    await tester.pumpAndSettle();

    expect(submitCalls, 1);
    expect(find.byKey(const Key('catalog-marker')), findsOneWidget);
    expect(find.text('Submeter candidatura'), findsNothing);
    expect(find.text('Candidatar a Badge'), findsNothing);
  });

  testWidgets('mantem o formulario aberto quando a API rejeita', (
    tester,
  ) async {
    await tester.pumpWidget(
      AppLanguageScope(
        controller: AppLanguageController(),
        child: MaterialApp(
          home: _NavigationHarness(onApply: (_) async => false),
        ),
      ),
    );

    await tester.tap(find.byKey(const Key('open-badge-detail')));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Candidatar a Badge'));
    await tester.tap(find.text('Candidatar a Badge'));
    await tester.pumpAndSettle();
    await tester.ensureVisible(find.text('Submeter candidatura'));
    await tester.tap(find.text('Submeter candidatura'));
    await tester.pumpAndSettle();

    expect(find.text('Submeter candidatura'), findsOneWidget);
    final button = tester.widget<FilledButton>(
      find.widgetWithText(FilledButton, 'Submeter candidatura'),
    );
    expect(button.onPressed, isNotNull);
  });
}

class _NavigationHarness extends StatelessWidget {
  const _NavigationHarness({required this.onApply});

  final Future<bool> Function(List<EvidenceAttachment>) onApply;

  static const badge = CatalogBadge(
    id: 42,
    title: 'Badge de teste',
    description: 'Descrição de teste',
    level: 'Intermédio',
    area: 'Mobile',
    points: 100,
    duration: '1 hora',
    type: 'Formação',
    provider: 'Softinsa',
    imagePath: '',
    requirements: [],
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: FilledButton(
          key: const Key('open-badge-detail'),
          onPressed: () {
            Navigator.of(context).push(
              MaterialPageRoute(
                builder: (_) => BadgeDetailPage(badge: badge, onApply: onApply),
              ),
            );
          },
          child: const Text('Abrir badge', key: Key('catalog-marker')),
        ),
      ),
    );
  }
}
