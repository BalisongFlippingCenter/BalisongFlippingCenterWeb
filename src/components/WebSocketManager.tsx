import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { useLocation } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { addNotification, AppNotification } from "../redux/notifications/notificationSlice";
import { addMessage, receiveIncomingMessage, upsertConversation } from "../redux/messages/messagesSlice";
import { ConversationDto, MessageDto } from "../modals/Message";

const WS_URL = import.meta.env.VITE_WS_URL;

const WebSocketManager = () => {
  const dispatch    = useAppDispatch();
  const user        = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const clientRef   = useRef<Client | null>(null);
  const location    = useLocation();
  const locationRef = useRef(location);
  useEffect(() => { locationRef.current = location; }, [location]);

  useEffect(() => {
    if (!user || !accessToken) {
      if (clientRef.current?.active) {
        clientRef.current.deactivate();
        clientRef.current = null;
      }
      return;
    }

    const client = new Client({
      brokerURL:      WS_URL,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log("[WS] Connected");
        client.subscribe("/user/queue/notifications", (message) => {
          try {
            const notification: AppNotification = JSON.parse(message.body);
            dispatch(addNotification(notification));
          } catch {
            console.warn("[WS] Failed to parse notification:", message.body);
          }
        });

        client.subscribe("/user/me/queue/messages", (frame) => {
          try {
            const msg: MessageDto = JSON.parse(frame.body);
            const isViewingConv = locationRef.current.pathname.includes(msg.conversationId);
            if (msg.senderId === user?.id || isViewingConv) {
              // Sent by me (HTTP response already added it) or actively viewing — just add silently
              dispatch(addMessage(msg));
            } else {
              // Incoming from someone else while away — bump unread + show toast
              dispatch(receiveIncomingMessage(msg));
            }
          } catch {
            console.warn("[WS] Failed to parse message:", frame.body);
          }
        });

        client.subscribe("/user/me/queue/conversations", (frame) => {
          try {
            const conv: ConversationDto = JSON.parse(frame.body);
            dispatch(upsertConversation(conv));
          } catch {
            console.warn("[WS] Failed to parse conversation update:", frame.body);
          }
        });
      },
      onDisconnect: () => {
        console.log("[WS] Disconnected");
      },
      onStompError: (frame) => {
        console.warn("[WS] STOMP error:", frame.headers["message"]);
      },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [user, accessToken]);

  return null;
};

export default WebSocketManager;
