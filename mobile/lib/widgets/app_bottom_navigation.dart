import 'package:flutter/material.dart';

import '../repositories/mobile_api_repository.dart';

enum AppBottomNavigationDestination {
  home,
  catalog,
  myBadges,
  ranking,
  profile,
}

class AppNavigationController {
  AppNavigationController._();

  static final ValueNotifier<AppBottomNavigationDestination> destination =
      ValueNotifier<AppBottomNavigationDestination>(
        AppBottomNavigationDestination.home,
      );

  static void select(AppBottomNavigationDestination nextDestination) {
    destination.value = nextDestination;
  }

  static void open(
    BuildContext context,
    AppBottomNavigationDestination nextDestination,
  ) {
    select(nextDestination);
    Navigator.of(context).popUntil((route) => route.isFirst);
  }
}

class AppBottomNavigation extends StatelessWidget {
  const AppBottomNavigation({
    super.key,
    required this.currentDestination,
    required this.onDestinationSelected,
  });

  final AppBottomNavigationDestination currentDestination;
  final ValueChanged<AppBottomNavigationDestination> onDestinationSelected;

  @override
  Widget build(BuildContext context) {
    return BottomNavigationBar(
      currentIndex: currentDestination.index,
      type: BottomNavigationBarType.fixed,
      backgroundColor: Colors.white,
      elevation: 12,
      selectedItemColor: const Color(0xFF006DAA),
      unselectedItemColor: const Color(0xFF5E6878),
      selectedFontSize: 11,
      unselectedFontSize: 11,
      onTap: (index) {
        onDestinationSelected(AppBottomNavigationDestination.values[index]);
      },
      items: const [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          activeIcon: Icon(Icons.home),
          label: 'Início',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.workspace_premium_outlined),
          activeIcon: Icon(Icons.workspace_premium),
          label: 'Catálogo',
        ),
        BottomNavigationBarItem(
          icon: AppBadgeNavigationIcon(),
          activeIcon: AppBadgeNavigationIcon(),
          label: 'Meus\nBadges',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.emoji_events_outlined),
          activeIcon: Icon(Icons.emoji_events),
          label: 'Ranking',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          activeIcon: Icon(Icons.person),
          label: 'Perfil',
        ),
      ],
    );
  }
}

class AppBadgeNavigationIcon extends StatefulWidget {
  const AppBadgeNavigationIcon({super.key});

  @override
  State<AppBadgeNavigationIcon> createState() => _AppBadgeNavigationIconState();
}

class _AppBadgeNavigationIconState extends State<AppBadgeNavigationIcon> {
  final MobileApiRepository repository = MobileApiRepository();
  late Future<int> inProgressFuture;

  @override
  void initState() {
    super.initState();
    inProgressFuture = _loadInProgressCount();
  }

  Future<int> _loadInProgressCount() async {
    final applications = await repository.getMyBadgeApplications();
    return applications
        .where((item) => !item.isApproved && !item.isRejected)
        .length;
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<int>(
      future: inProgressFuture,
      builder: (context, snapshot) {
        final count = snapshot.data ?? 0;

        return Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(Icons.workspace_premium_outlined),
            if (count > 0)
              Positioned(
                top: -7,
                right: -8,
                child: Container(
                  width: 16,
                  height: 16,
                  alignment: Alignment.center,
                  decoration: const BoxDecoration(
                    color: Color(0xFFFF3B48),
                    shape: BoxShape.circle,
                  ),
                  child: Text(
                    count > 9 ? '9+' : '$count',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
