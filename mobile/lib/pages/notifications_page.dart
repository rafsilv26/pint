import 'package:flutter/material.dart';

import '../l10n/app_language.dart';
import '../models/mobile_api_data.dart';
import '../repositories/mobile_api_repository.dart';
import '../widgets/app_bottom_navigation.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final MobileApiRepository repository = MobileApiRepository();
  late Future<List<AppNotification>> notificationsFuture;

  @override
  void initState() {
    super.initState();
    notificationsFuture = repository.getNotifications();
  }

  Future<void> reload() async {
    final future = repository.getNotifications();
    setState(() {
      notificationsFuture = future;
    });
    await future;
  }

  Future<void> markAllAsRead() async {
    try {
      await repository.markAllNotificationsAsRead();
      await reload();
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: AppText('Não foi possível atualizar as notificações.'),
        ),
      );
    }
  }

  Future<void> markAsRead(AppNotification notification) async {
    try {
      await repository.markNotificationAsRead(notification.id);
      await reload();
    } catch (_) {
      if (!mounted) {
        return;
      }
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: AppText('Não foi possível marcar a notificação como lida.'),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<List<AppNotification>>(
      future: notificationsFuture,
      builder: (context, snapshot) {
        final notifications = snapshot.data ?? const <AppNotification>[];
        final unreadCount = notifications.where((item) => item.unread).length;

        return Scaffold(
          backgroundColor: Colors.white,
          body: SafeArea(
            bottom: false,
            child: Column(
              children: [
                _NotificationsHeader(
                  unreadCount: unreadCount,
                  onBack: () => Navigator.of(context).pop(),
                  onMarkAll: notifications.isEmpty ? null : markAllAsRead,
                ),
                Expanded(
                  child: snapshot.connectionState == ConnectionState.waiting
                      ? const Center(child: CircularProgressIndicator())
                      : RefreshIndicator(
                          onRefresh: reload,
                          child: _NotificationsList(
                            notifications: notifications,
                            onMarkAsRead: markAsRead,
                          ),
                        ),
                ),
              ],
            ),
          ),
          bottomNavigationBar: AppBottomNavigation(
            currentDestination: AppBottomNavigationDestination.myBadges,
            onDestinationSelected: (destination) {
              AppNavigationController.open(context, destination);
            },
          ),
        );
      },
    );
  }
}

class _NotificationsList extends StatelessWidget {
  const _NotificationsList({
    required this.notifications,
    required this.onMarkAsRead,
  });

  final List<AppNotification> notifications;
  final ValueChanged<AppNotification> onMarkAsRead;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final horizontalPadding = constraints.maxWidth < 380 ? 16.0 : 24.0;

        return SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: EdgeInsets.fromLTRB(
            horizontalPadding,
            28,
            horizontalPadding,
            28,
          ),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 560),
              child: Column(
                children: [
                  if (notifications.isEmpty)
                    const _EmptyNotificationsCard()
                  else
                    for (final notification in notifications) ...[
                      _NotificationCard(
                        notification: notification,
                        onMarkAsRead: () => onMarkAsRead(notification),
                      ),
                      const SizedBox(height: 18),
                    ],
                  const _NotificationsTip(),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}

class _NotificationsHeader extends StatelessWidget {
  const _NotificationsHeader({
    required this.unreadCount,
    required this.onBack,
    required this.onMarkAll,
  });

  final int unreadCount;
  final VoidCallback onBack;
  final VoidCallback? onMarkAll;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
      color: const Color(0xFF006DAA),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          IconButton(
            onPressed: onBack,
            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AppText(
                  'Notificações',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 10),
                AppText(
                  '$unreadCount novas',
                  style: const TextStyle(
                    color: Color(0xFFE6F5FF),
                    fontSize: 22,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          FilledButton.icon(
            onPressed: onMarkAll,
            icon: const Icon(Icons.check, size: 22),
            label: const AppText('Marcar todas'),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF3D8DBA),
              foregroundColor: Colors.white,
              disabledBackgroundColor: const Color(0xFF6EA7C8),
              padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
              textStyle: const TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationCard extends StatelessWidget {
  const _NotificationCard({
    required this.notification,
    required this.onMarkAsRead,
  });

  final AppNotification notification;
  final VoidCallback onMarkAsRead;

  @override
  Widget build(BuildContext context) {
    final colors = _colorsFor(notification);
    final text = notification.message.isNotEmpty
        ? notification.message
        : notification.title;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: notification.unread
              ? const Color(0xFFB6D2FF)
              : const Color(0xFFE8EDF3),
          width: notification.unread ? 1.4 : 1,
        ),
        boxShadow: const [
          BoxShadow(
            color: Color(0x12101828),
            blurRadius: 14,
            offset: Offset(0, 6),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 58,
            height: 58,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: colors.background,
              shape: BoxShape.circle,
            ),
            child: Icon(colors.icon, color: colors.foreground, size: 28),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppText(
                  text,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 19,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 16),
                AppText(
                  _formatDate(notification.createdAt),
                  style: const TextStyle(
                    color: Color(0xFF667085),
                    fontSize: 16,
                    height: 1.35,
                  ),
                ),
              ],
            ),
          ),
          if (notification.unread) ...[
            const SizedBox(width: 10),
            TextButton.icon(
              onPressed: onMarkAsRead,
              icon: const Icon(Icons.check, size: 20),
              label: const AppText('Marcar como\nlida'),
              style: TextButton.styleFrom(
                foregroundColor: const Color(0xFF005DFF),
                textStyle: const TextStyle(fontSize: 16),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _EmptyNotificationsCard extends StatelessWidget {
  const _EmptyNotificationsCard();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 18),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE8EDF3)),
      ),
      child: const AppText(
        'Sem notificações sincronizadas.',
        style: TextStyle(color: Color(0xFF667085), fontSize: 16),
      ),
    );
  }
}

class _NotificationsTip extends StatelessWidget {
  const _NotificationsTip();

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFFEAF3FF),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFB6D2FF)),
      ),
      child: const Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.notifications_none, color: Color(0xFF005DFF), size: 30),
          SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                AppText(
                  'Dica',
                  style: TextStyle(
                    color: Color(0xFF174193),
                    fontSize: 20,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 12),
                AppText(
                  'Ative as notificações para receber alertas em tempo real sobre aprovações e badges a expirar.',
                  style: TextStyle(
                    color: Color(0xFF005DFF),
                    fontSize: 17,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _NotificationColors {
  const _NotificationColors({
    required this.background,
    required this.foreground,
    required this.icon,
  });

  final Color background;
  final Color foreground;
  final IconData icon;
}

_NotificationColors _colorsFor(AppNotification notification) {
  final source =
      '${notification.type} ${notification.title} '
              '${notification.message}'
          .toLowerCase();

  if (source.contains('aprov') || source.contains('success')) {
    return const _NotificationColors(
      background: Color(0xFFDDFBE7),
      foreground: Color(0xFF00A651),
      icon: Icons.check_circle_outline,
    );
  }
  if (source.contains('expir') || source.contains('warning')) {
    return const _NotificationColors(
      background: Color(0xFFFFF1C6),
      foreground: Color(0xFFE67800),
      icon: Icons.schedule,
    );
  }
  return const _NotificationColors(
    background: Color(0xFFFFDDE1),
    foreground: Color(0xFFE60012),
    icon: Icons.error_outline,
  );
}

String _formatDate(DateTime? date) {
  if (date == null) {
    return '';
  }

  final local = date.toLocal();
  final day = local.day.toString().padLeft(2, '0');
  final month = local.month.toString().padLeft(2, '0');
  return '$day/$month/${local.year}';
}
