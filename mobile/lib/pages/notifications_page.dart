import 'package:flutter/material.dart';

class NotificationsPage extends StatefulWidget {
  const NotificationsPage({super.key});

  @override
  State<NotificationsPage> createState() => _NotificationsPageState();
}

class _NotificationsPageState extends State<NotificationsPage> {
  final List<_NotificationItem> notifications = [
    const _NotificationItem(
      title: 'O seu badge Nível Júnior - OutSystems foi aprovado!',
      date: '4 de dezembro de 2025',
      type: _NotificationType.success,
      unread: true,
    ),
    const _NotificationItem(
      title: 'O badge AWS Cloud Practitioner expira em 30 dias',
      date: '3 de dezembro de 2025',
      type: _NotificationType.warning,
      unread: true,
    ),
    const _NotificationItem(
      title: 'Feedback necessário para o badge Azure Fundamentals',
      date: '2 de dezembro de 2025',
      type: _NotificationType.alert,
    ),
  ];

  int get unreadCount => notifications.where((item) => item.unread).length;

  void markAllAsRead() {
    setState(() {
      for (var index = 0; index < notifications.length; index++) {
        notifications[index] = notifications[index].copyWith(unread: false);
      }
    });
  }

  void markAsRead(int index) {
    setState(() {
      notifications[index] = notifications[index].copyWith(unread: false);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            _NotificationsHeader(
              unreadCount: unreadCount,
              onBack: () => Navigator.of(context).pop(),
              onMarkAll: markAllAsRead,
            ),
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final horizontalPadding = constraints.maxWidth < 380
                      ? 16.0
                      : 24.0;

                  return SingleChildScrollView(
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
                            for (
                              var index = 0;
                              index < notifications.length;
                              index++
                            ) ...[
                              _NotificationCard(
                                notification: notifications[index],
                                onMarkAsRead: () => markAsRead(index),
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
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: const _NotificationsBottomNavigation(),
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
  final VoidCallback onMarkAll;

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
                const Text(
                  'Notificações',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 32,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
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
            label: const Text('Marcar todas'),
            style: FilledButton.styleFrom(
              backgroundColor: const Color(0xFF3D8DBA),
              foregroundColor: Colors.white,
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

  final _NotificationItem notification;
  final VoidCallback onMarkAsRead;

  @override
  Widget build(BuildContext context) {
    final colors = notification.colors;

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
                Text(
                  notification.title,
                  style: const TextStyle(
                    color: Color(0xFF111827),
                    fontSize: 19,
                    height: 1.45,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  notification.date,
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
              label: const Text('Marcar como\nlida'),
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
                Text(
                  'Dica',
                  style: TextStyle(
                    color: Color(0xFF174193),
                    fontSize: 20,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                SizedBox(height: 12),
                Text(
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

class _NotificationsBottomNavigation extends StatelessWidget {
  const _NotificationsBottomNavigation();

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: 2,
      type: BottomNavigationBarType.fixed,
      backgroundColor: Colors.white,
      elevation: 12,
      selectedItemColor: const Color(0xFF006DAA),
      unselectedItemColor: const Color(0xFF667085),
      selectedFontSize: 12,
      unselectedFontSize: 12,
      onTap: (index) {
        if (index == 0 || index == 4) {
          Navigator.of(context).pop();
        }
      },
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          label: 'Início',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.workspace_premium_outlined),
          label: 'Catálogo',
        ),
        BottomNavigationBarItem(
          icon: _BadgeNavigationIcon(),
          label: 'Meus\nBadges',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.emoji_events_outlined),
          label: 'Ranking',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          label: 'Perfil',
        ),
      ],
    );
  }
}

class _BadgeNavigationIcon extends StatelessWidget {
  const _BadgeNavigationIcon();

  @override
  Widget build(BuildContext context) {
    return Stack(
      clipBehavior: Clip.none,
      children: [
        const Icon(Icons.notifications_none),
        Positioned(
          top: -7,
          right: -8,
          child: Container(
            width: 18,
            height: 18,
            alignment: Alignment.center,
            decoration: const BoxDecoration(
              color: Color(0xFFFF3B48),
              shape: BoxShape.circle,
            ),
            child: const Text(
              '2',
              style: TextStyle(
                color: Colors.white,
                fontSize: 10,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ),
      ],
    );
  }
}

enum _NotificationType { success, warning, alert }

class _NotificationItem {
  const _NotificationItem({
    required this.title,
    required this.date,
    required this.type,
    this.unread = false,
  });

  final String title;
  final String date;
  final _NotificationType type;
  final bool unread;

  _NotificationItem copyWith({bool? unread}) {
    return _NotificationItem(
      title: title,
      date: date,
      type: type,
      unread: unread ?? this.unread,
    );
  }

  _NotificationColors get colors {
    return switch (type) {
      _NotificationType.success => const _NotificationColors(
        background: Color(0xFFDDFBE7),
        foreground: Color(0xFF00A651),
        icon: Icons.check_circle_outline,
      ),
      _NotificationType.warning => const _NotificationColors(
        background: Color(0xFFFFF1C6),
        foreground: Color(0xFFE67800),
        icon: Icons.schedule,
      ),
      _NotificationType.alert => const _NotificationColors(
        background: Color(0xFFFFDDE1),
        foreground: Color(0xFFE60012),
        icon: Icons.error_outline,
      ),
    };
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
