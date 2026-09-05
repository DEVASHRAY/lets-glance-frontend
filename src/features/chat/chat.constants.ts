enum ConversationInboxLoadOutcome {
  Failure = "failure",
  Success = "success",
  Unauthorized = "unauthorized",
}

enum MessageDeliveryStatus {
  Delivered = "DELIVERED",
  Read = "READ",
  Sent = "SENT",
}

enum MessageHistoryLoadOutcome {
  Failure = "failure",
  Missing = "missing",
  Success = "success",
  Unauthorized = "unauthorized",
}

enum SendMessageOutcome {
  Conflict = "conflict",
  Failure = "failure",
  Idle = "idle",
  Success = "success",
  Unauthorized = "unauthorized",
}

export const ChatConstantsCollection = {
  ConversationInboxLoadOutcome,
  MessageDeliveryStatus,
  MessageHistoryLoadOutcome,
  SendMessageOutcome,
};
