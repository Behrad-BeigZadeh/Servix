import { useEffect } from "react";
import { useSocketStore } from "@/stores/socketStore";
import toast from "react-hot-toast";

export type Message = {
  id: string;
  content: string;
  senderId: string;
  chatRoomId: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    username: string;
    image: string;
  };
};

export const useNotifications = () => {
  const socket = useSocketStore((state) => state.socket);

  useEffect(() => {
    if (!socket) return;

    const handleNotification = (data: {
      id: string;
      message: Message;
      type: string;
      createdAt: string;
    }) => {
      let displayMessage = "";

      if (typeof data.message === "string") {
        displayMessage = data.message;
      } else if (
        typeof data.message === "object" &&
        data.message !== null &&
        "content" in data.message
      ) {
        const senderName =
          typeof data.message.sender === "object" &&
          data.message.sender?.username
            ? data.message.sender.username
            : "Someone";
        displayMessage = `${senderName} says: ${data.message.content}`;
      } else {
        displayMessage = "📩 You have a new notification.";
      }

      toast.success(displayMessage);
    };

    socket.on("new_notification", handleNotification);

    return () => {
      socket.off("new_notification", handleNotification);
    };
  }, [socket]);
};
