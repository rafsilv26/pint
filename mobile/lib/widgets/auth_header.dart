import 'package:flutter/material.dart';

class AuthHeader extends StatelessWidget {
  const AuthHeader({super.key, required this.height, this.compact = false});

  final double height;
  final bool compact;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: height,
      width: double.infinity,
      child: Stack(
        fit: StackFit.expand,
        children: [
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Color(0xFF09233F),
                  Color(0xFF0B4775),
                  Color(0xFF0A7EAE),
                ],
              ),
            ),
          ),
          CustomPaint(painter: _BridgePainter()),
          DecoratedBox(
            decoration: BoxDecoration(
              color: Colors.black.withValues(alpha: compact ? 0.08 : 0.18),
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(
              compact ? 20 : 28,
              compact ? 18 : 30,
              compact ? 20 : 28,
              compact ? 18 : 30,
            ),
            child: Column(
              mainAxisAlignment: compact
                  ? MainAxisAlignment.start
                  : MainAxisAlignment.center,
              crossAxisAlignment: compact
                  ? CrossAxisAlignment.end
                  : CrossAxisAlignment.center,
              children: [
                if (compact)
                  const Text(
                    'INSPIRING\nTHE FUTURE\nWITH YOU!',
                    textAlign: TextAlign.right,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.w800,
                      height: 0.95,
                    ),
                  )
                else
                  const Text(
                    'SOFTINSA',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 40,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1,
                    ),
                  ),
                if (compact) ...[
                  const SizedBox(height: 4),
                  const Text(
                    'SOFTINSA',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _BridgePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.14)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;

    final baseY = size.height * 0.74;
    canvas.drawLine(Offset(0, baseY), Offset(size.width, baseY - 34), paint);
    canvas.drawLine(
      Offset(0, baseY + 34),
      Offset(size.width, baseY - 2),
      paint,
    );

    for (var i = 0; i < 7; i++) {
      final x = size.width * (0.08 + i * 0.14);
      canvas.drawLine(Offset(x, baseY - 42), Offset(x + 18, baseY + 36), paint);
    }

    final circlePaint = Paint()
      ..color = Colors.white.withValues(alpha: 0.07)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 12;

    canvas.drawCircle(
      Offset(size.width * 0.92, size.height * 0.64),
      size.width * 0.23,
      circlePaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
