export interface ConversationDto {
  id: string;
  otherParticipantId: string;
  otherDisplayName: string;
  otherIdentifierCode: string;
  otherProfileImg: string | null;
  lastMessagePreview: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  sentAt: string;
  readAt: string | null;
}

export interface MessageToast {
  toastId:        string;
  conversationId: string;
  senderName:     string;
  senderCode:     string;
  senderImg:      string | null;
  preview:        string;
}
