import 'package:flutter/material.dart';

import '../l10n/app_language.dart';
import '../models/mobile_api_data.dart';
import '../repositories/mobile_api_repository.dart';
import '../services/app_sync_service.dart';
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
    await AppSyncService().synchronizeIfNeeded();
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
      padding: const EdgeInsets.fromLTRB(16, 18, 20, 24),
      color: const Color(0xFF006DAA),
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 600),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  IconButton(
                    tooltip: context.tr('Voltar'),
                    onPressed: onBack,
                    icon: const Icon(
                      Icons.arrow_back_ios_new,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: AppText(
                      'Notificações',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 30,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.only(left: 56, top: 12),
                child: Row(
                  children: [
                    Expanded(
                      child: AppText(
                        unreadCount == 1 ? '1 nova' : '$unreadCount novas',
                        style: const TextStyle(
                          color: Color(0xFFE6F5FF),
                          fontSize: 20,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    FilledButton.icon(
                      onPressed: onMarkAll,
                      icon: const Icon(Icons.done_all, size: 20),
                      label: const AppText('Marcar todas'),
                      style: FilledButton.styleFrom(
                        backgroundColor: const Color(0xFF3D8DBA),
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: const Color(0xFF6EA7C8),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 13,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                        textStyle: const TextStyle(fontSize: 15),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
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
    final hasTitle = notification.title.trim().isNotEmpty;
    final hasMessage = notification.message.trim().isNotEmpty;
    final showSeparateMessage =
        hasTitle &&
        hasMessage &&
        notification.title.trim() != notification.message.trim();
    final primaryText = hasTitle
        ? notification.title.trim()
        : notification.message.trim();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: notification.unread ? const Color(0xFFFCFDFF) : Colors.white,
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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 52,
                height: 52,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: colors.background,
                  shape: BoxShape.circle,
                ),
                child: Icon(colors.icon, color: colors.foreground, size: 26),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    AppText(
                      primaryText,
                      style: TextStyle(
                        color: const Color(0xFF111827),
                        fontSize: 17,
                        height: 1.35,
                        fontWeight: showSeparateMessage
                            ? FontWeight.w700
                            : FontWeight.w500,
                      ),
                    ),
                    if (showSeparateMessage) ...[
                      const SizedBox(height: 6),
                      AppText(
                        notification.message.trim(),
                        style: const TextStyle(
                          color: Color(0xFF344054),
                          fontSize: 15,
                          height: 1.4,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: AppText(
                  _formatDate(notification.createdAt),
                  style: const TextStyle(
                    color: Color(0xFF667085),
                    fontSize: 14,
                  ),
                ),
              ),
              if (notification.unread)
                TextButton.icon(
                  onPressed: onMarkAsRead,
                  icon: const Icon(Icons.check, size: 18),
                  label: const AppText('Marcar como lida'),
                  style: TextButton.styleFrom(
                    foregroundColor: const Color(0xFF005DFF),
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 8,
                    ),
                    visualDensity: VisualDensity.compact,
                    textStyle: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
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
