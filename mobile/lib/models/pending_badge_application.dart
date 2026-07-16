class PendingBadgeEvidence {
  const PendingBadgeEvidence({
    required this.id,
    required this.requirementId,
    required this.storedPath,
    required this.originalName,
  });

  final int id;
  final int requirementId;
  final String storedPath;
  final String originalName;
}

class PendingBadgeApplication {
  const PendingBadgeApplication({
    required this.localId,
    required this.clientRequestId,
    required this.ownerUserId,
    required this.badgeId,
    required this.state,
    required this.attemptCount,
    required this.createdAt,
    required this.updatedAt,
    required this.evidences,
    this.description,
    this.lastError,
    this.lastHttpStatus,
    this.serverApplicationId,
  });

  final int localId;
  final String clientRequestId;
  final int ownerUserId;
  final int badgeId;
  final String? description;
  final String state;
  final int attemptCount;
  final String? lastError;
  final int? lastHttpStatus;
  final int? serverApplicationId;
  final DateTime createdAt;
  final DateTime updatedAt;
  final List<PendingBadgeEvidence> evidences;

  bool get isQueued => state == 'queued';
  bool get isSentAwaitingRefresh => state == 'sent';
  bool get hasFailed => state == 'failed';

  PendingBadgeApplication copyWith({
    String? state,
    int? attemptCount,
    String? lastError,
    bool clearLastError = false,
    int? lastHttpStatus,
    bool clearLastHttpStatus = false,
    int? serverApplicationId,
    DateTime? updatedAt,
  }) {
    return PendingBadgeApplication(
      localId: localId,
      clientRequestId: clientRequestId,
      ownerUserId: ownerUserId,
      badgeId: badgeId,
      description: description,
      state: state ?? this.state,
      attemptCount: attemptCount ?? this.attemptCount,
      lastError: clearLastError ? null : (lastError ?? this.lastError),
      lastHttpStatus: clearLastHttpStatus
          ? null
          : (lastHttpStatus ?? this.lastHttpStatus),
      serverApplicationId: serverApplicationId ?? this.serverApplicationId,
      createdAt: createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      evidences: evidences,
    );
  }
}

enum BadgeApplicationDelivery { sent, queued }

class BadgeApplicationSubmissionResult {
  const BadgeApplicationSubmissionResult({
    required this.delivery,
    required this.message,
  });

  final BadgeApplicationDelivery delivery;
  final String message;

  bool get isQueued => delivery == BadgeApplicationDelivery.queued;
}
