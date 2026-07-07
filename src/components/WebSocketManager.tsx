import { useEffect, useRef } from "react";
import { Client } from "@stomp/stompjs";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { addNotification, AppNotification } from "../redux/notifications/notificationSlice";

const WS_URL = "ws://ec2-3-217-173-234.compute-1.amazonaws.com:8080/ws";

const WebSocketManager = () => {
  const dispatch    = useAppDispatch();
  const user        = useAppSelector((state) => state.auth.user);
  const accessToken = useAppSelector((state) => state.auth.accessToken);
  const clientRef   = useRef<Client | null>(null);

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
