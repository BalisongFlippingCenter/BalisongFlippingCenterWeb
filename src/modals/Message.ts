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
  mediaUrl: string | null;
  isVideo: boolean;
  replyToId: string | null;
  replyPreviewBody: string | null;
  replyPreviewSenderName: string | null;
  editedAt: string | null;
  isDeleted: boolean;
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
