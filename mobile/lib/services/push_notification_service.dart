import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

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
const _androidNotificationChannel = AndroidNotificationChannel(
  'badge_updates',
  'Atualizações de badges',
  description: 'Aprovações, rejeições e alterações das candidaturas.',
  importance: Importance.max,
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

Future<void> _ensureFirebaseInitialized() async {
  if (Firebase.apps.isNotEmpty) return;
  final options = _firebaseOptions;
  if (options == null) {
    await Firebase.initializeApp();
  } else {
    await Firebase.initializeApp(options: options);
  }
}

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await _ensureFirebaseInitialized();
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
  final FlutterLocalNotificationsPlugin localNotifications =
      FlutterLocalNotificationsPlugin();
  bool initialized = false;
  bool localNotificationsInitialized = false;
  String? currentToken;

  Future<bool> initialize() async {
    if (kIsWeb) return false;
    try {
      await _ensureFirebaseInitialized();
      if (!initialized) {
        await _initializeLocalNotifications();
        FirebaseMessaging.onBackgroundMessage(
          firebaseMessagingBackgroundHandler,
        );
        await FirebaseMessaging.instance.requestPermission(
          alert: true,
          badge: true,
          sound: true,
        );
        await FirebaseMessaging.instance
            .setForegroundNotificationPresentationOptions(
              alert: true,
              badge: true,
              sound: true,
            );
        FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
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

  Future<void> _initializeLocalNotifications() async {
    if (localNotificationsInitialized ||
        defaultTargetPlatform != TargetPlatform.android) {
      return;
    }

    await localNotifications.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
      ),
    );
    await localNotifications
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >()
        ?.createNotificationChannel(_androidNotificationChannel);
    localNotificationsInitialized = true;
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    await _showForegroundNotification(message);
    await _handleMessage(message);
  }

  Future<void> _showForegroundNotification(RemoteMessage message) async {
    if (defaultTargetPlatform != TargetPlatform.android) return;

    final title = message.notification?.title?.trim().isNotEmpty == true
        ? message.notification!.title!.trim()
        : (message.data['title']?.toString().trim().isNotEmpty == true
              ? message.data['title'].toString().trim()
              : 'Softinsa Badges');
    final body = message.notification?.body?.trim().isNotEmpty == true
        ? message.notification!.body!.trim()
        : message.data['body']?.toString().trim();

    await localNotifications.show(
      id: _notificationId(message),
      title: title,
      body: body,
      notificationDetails: const NotificationDetails(
        android: AndroidNotificationDetails(
          'badge_updates',
          'Atualizações de badges',
          channelDescription:
              'Aprovações, rejeições e alterações das candidaturas.',
          importance: Importance.max,
          priority: Priority.high,
          icon: '@mipmap/ic_launcher',
        ),
      ),
      payload: message.data['action']?.toString(),
    );
  }

  int _notificationId(RemoteMessage message) {
    final source =
        message.messageId ??
        '${message.sentTime?.millisecondsSinceEpoch ?? DateTime.now().millisecondsSinceEpoch}'
            '-${message.notification?.title ?? ''}'
            '-${message.notification?.body ?? ''}';
    return source.hashCode & 0x7fffffff;
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
    } catch (error) {
      // Sem sessão no arranque: AuthGate volta a chamar initialize após login.
      debugPrint('Não foi possível registar o token PUSH: $error');
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
