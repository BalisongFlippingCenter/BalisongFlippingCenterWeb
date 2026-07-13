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
