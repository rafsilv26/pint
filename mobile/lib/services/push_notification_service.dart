import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';

import 'app_sync_service.dart';
import 'badges_api_service.dart';

const _firebaseApiKey = String.fromEnvironment('FIREBASE_API_KEY');
const _firebaseAppId = String.fromEnvironment('FIREBASE_APP_ID');
const _firebaseIosAppId = String.fromEnvironment('FIREBASE_IOS_APP_ID');
const _firebaseSenderId = String.fromEnvironment(
  'FIREBASE_MESSAGING_SENDER_ID',
);
const _firebaseProjectId = String.fromEnvironment('FIREBASE_PROJECT_ID');
const _firebaseStorageBucket = String.fromEnvironment(
  'FIREBASE_STORAGE_BUCKET',
);

FirebaseOptions? get _firebaseOptions {
  final appId = defaultTargetPlatform == TargetPlatform.iOS
      ? (_firebaseIosAppId.isEmpty ? _firebaseAppId : _firebaseIosAppId)
      : _firebaseAppId;
  if ([
    _firebaseApiKey,
    appId,
    _firebaseSenderId,
    _firebaseProjectId,
  ].any((value) => value.isEmpty)) {
    return null;
  }
  return FirebaseOptions(
    apiKey: _firebaseApiKey,
    appId: appId,
    messagingSenderId: _firebaseSenderId,
    projectId: _firebaseProjectId,
    storageBucket: _firebaseStorageBucket.isEmpty
        ? null
        : _firebaseStorageBucket,
    iosBundleId: defaultTargetPlatform == TargetPlatform.iOS
        ? 'pt.softinsa.badges'
        : null,
  );
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  final options = _firebaseOptions;
  if (options == null) return;
  if (Firebase.apps.isEmpty) await Firebase.initializeApp(options: options);
  if (_requestsDataRefresh(message)) {
    await AppSyncService().synchronizeIfNeeded();
  }
}

bool _requestsDataRefresh(RemoteMessage message) {
  final action = message.data['action']?.toString().toLowerCase();
  final command = message.data['comando']?.toString().toLowerCase();
  return action == 'fetch_api' ||
      command == 'atualizar' ||
      message.notification != null;
}

class PushNotificationService {
  PushNotificationService._();
  static final PushNotificationService instance = PushNotificationService._();

  final BadgesApiService apiService = BadgesApiService();
  bool initialized = false;
  String? currentToken;

  Future<bool> initialize() async {
    if (kIsWeb) return false;
    final options = _firebaseOptions;
    if (options == null) return false;
    try {
      if (Firebase.apps.isEmpty) await Firebase.initializeApp(options: options);
      if (!initialized) {
        FirebaseMessaging.onBackgroundMessage(
          firebaseMessagingBackgroundHandler,
        );
        await FirebaseMessaging.instance.requestPermission(
          alert: true,
          badge: true,
          sound: true,
        );
        FirebaseMessaging.onMessage.listen(_handleMessage);
        FirebaseMessaging.onMessageOpenedApp.listen(_handleMessage);
        FirebaseMessaging.instance.onTokenRefresh.listen(_registerToken);
        final initialMessage = await FirebaseMessaging.instance
            .getInitialMessage();
        if (initialMessage != null) await _handleMessage(initialMessage);
        initialized = true;
      }
      final token = await FirebaseMessaging.instance.getToken();
      if (token != null) await _registerToken(token);
      return true;
    } catch (error) {
      debugPrint('Firebase PUSH indisponível: $error');
      return false;
    }
  }

  Future<void> _handleMessage(RemoteMessage message) async {
    if (_requestsDataRefresh(message)) {
      await AppSyncService().synchronizeIfNeeded();
    }
  }

  Future<void> _registerToken(String token) async {
    currentToken = token;
    try {
      await apiService.registerPushToken(token, defaultTargetPlatform.name);
    } catch (_) {
      // Sem sessão no arranque: AuthGate volta a chamar initialize após login.
    }
  }

  Future<void> unregister() async {
    final token = currentToken;
    if (token == null) return;
    try {
      await apiService.unregisterPushToken(token);
    } catch (_) {
      // O logout local não deve ficar bloqueado por falha de rede.
    }
  }
}
