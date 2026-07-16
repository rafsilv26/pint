import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:softinsa_badges_mobile/services/sync_preferences_service.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  test('guarda uma versao mobile independente por utilizador', () async {
    SharedPreferences.setMockInitialValues({});
    final service = SyncPreferencesService();

    await service.saveMobileDataVersion(userId: 22, version: 'v22');
    await service.saveMobileDataVersion(userId: 99, version: 'v99');

    expect(await service.getMobileDataVersion(userId: 22), 'v22');
    expect(await service.getMobileDataVersion(userId: 99), 'v99');
    final preferences = await SharedPreferences.getInstance();
    expect(
      preferences.getString('softinsa_mobile_data_version_user_22'),
      'v22',
    );
    expect(
      preferences.getString('softinsa_mobile_data_version_user_99'),
      'v99',
    );
  });

  test('nao atribui a chave global legada a nenhuma conta', () async {
    SharedPreferences.setMockInitialValues({
      'softinsa_mobile_data_version': 'versao-de-owner-desconhecido',
    });
    final service = SyncPreferencesService();

    expect(await service.getMobileDataVersion(userId: 22), isNull);
    final preferences = await SharedPreferences.getInstance();
    expect(preferences.containsKey('softinsa_mobile_data_version'), isFalse);

    await service.saveMobileDataVersion(userId: 22, version: 'v22');
    expect(await service.getMobileDataVersion(userId: 99), isNull);
    expect(await service.getMobileDataVersion(userId: 22), 'v22');
  });

  test('ignora owners e versoes invalidos', () async {
    SharedPreferences.setMockInitialValues({});
    final service = SyncPreferencesService();

    await service.saveMobileDataVersion(userId: 0, version: 'v0');
    await service.saveMobileDataVersion(userId: 22, version: '   ');

    expect(await service.getMobileDataVersion(userId: 0), isNull);
    final preferences = await SharedPreferences.getInstance();
    expect(preferences.getKeys(), isEmpty);
  });

  test('guarda ultima atualizacao do dashboard por utilizador', () async {
    SharedPreferences.setMockInitialValues({});
    final service = SyncPreferencesService();
    final date22 = DateTime.utc(2026, 7, 16, 10);
    final date99 = DateTime.utc(2026, 7, 16, 11);

    await service.saveLastDashboardUpdate(userId: 22, dateTime: date22);
    await service.saveLastDashboardUpdate(userId: 99, dateTime: date99);

    expect(await service.getLastDashboardUpdate(userId: 22), date22);
    expect(await service.getLastDashboardUpdate(userId: 99), date99);
  });

  test(
    'ativacao invalida apenas o estado de sync do utilizador alvo',
    () async {
      SharedPreferences.setMockInitialValues({});
      final service = SyncPreferencesService();
      final date = DateTime.utc(2026, 7, 16, 10);
      await service.saveMobileDataVersion(userId: 22, version: 'v22');
      await service.saveLastDashboardUpdate(userId: 22, dateTime: date);
      await service.saveMobileDataVersion(userId: 99, version: 'v99');
      await service.saveLastDashboardUpdate(userId: 99, dateTime: date);

      await service.invalidatePersonalSyncState(22);

      expect(await service.getMobileDataVersion(userId: 22), isNull);
      expect(await service.getLastDashboardUpdate(userId: 22), isNull);
      expect(await service.getMobileDataVersion(userId: 99), 'v99');
      expect(await service.getLastDashboardUpdate(userId: 99), date);
    },
  );
}
