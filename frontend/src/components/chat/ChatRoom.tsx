"use client";
import { useEffect, useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  getChatRoomMessages,
  markMessagesAsSeen,
  sendMessage,
} from "@/api/chat/chatApi";
import { useUserStore } from "@/stores/userStore";
import toast from "react-hot-toast";
import { AxiosError } from "axios";
import dayjs from "dayjs";
import { useSocketStore } from "@/stores/socketStore";
import { Check, CheckCheck } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    username: string;
    avatar: string;
  };
}

const ChatRoom = ({ chatRoomId }: { chatRoomId: string }) => {
  const { user } = useUserStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useSocketStore((state) => state.socket);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["messages", chatRoomId],
    queryFn: () => getChatRoomMessages(chatRoomId as string),
  });
  const markSeenMutation = useMutation({
    mutationFn: (messageId: string) => markMessagesAsSeen(messageId),
    onError: (error: AxiosError<{ error: string }>) => {
      const errorMessage = error.response?.data?.error;
      toast.error(
        typeof errorMessage === "string" ? errorMessage : "Something went wrong"
      );
    },
  });

  useEffect(() => {
    if (!messages.length || !user) return;

    const unseenMessages = messages.filter(
      (msg) => msg.sender.id !== user.id && !msg.read
    );

    unseenMessages.forEach((msg) => {
      markSeenMutation.mutate(msg.id);
    });
  }, [messages, user]);

  const sendMessageMutation = useMutation({
    mutationFn: ({
      chatRoomId,
      content,
    }: {
      chatRoomId: string;
      content: string;
    }) => sendMessage(chatRoomId, content),
    onSuccess: (newMessage) => {
      console.log("Fetched data:", data);
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    },

    onError: (error: AxiosError<{ error: string }>) => {
      if (error.response?.data?.error) {
        const errors = error.response.data.error;

        if (typeof errors === "string") {
          toast.error(errors);
        } else {
          toast.error("Something went wrong");
        }
      } else {
        toast.error("Failed to start chat");
      }
    },
  });

  // Initial load
  useEffect(() => {
    if (data) {
      console.log("Fetched messages:", data.messages);
      setMessages(data.messages);
    }
  }, [data]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time incoming messages
  useEffect(() => {
    if (!socket || !chatRoomId) return;

    const handleIncomingMessage = (
      message: Message & { chatRoomId: string }
    ) => {
      if (message.chatRoomId !== chatRoomId) return;

      setMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.id === message.id) return prev; // avoid duplicate
        return [...prev, message];
      });
    };

    socket.on("new_message", handleIncomingMessage);

    return () => {
      socket.off("new_message", handleIncomingMessage);
    };
  }, [socket, chatRoomId]);

  useEffect(() => {
    if (!socket || !chatRoomId) return;

    const tryJoinRoom = () => {
      if (socket.connected) {
        socket.emit("join_room", chatRoomId);
      } else {
        socket.once("connect", () => {
          socket.emit("join_room", chatRoomId);
        });
      }
    };

    tryJoinRoom();

    return () => {
      socket.emit("leave_room", chatRoomId);
    };
  }, [socket, chatRoomId]);

  const handleSend = () => {
    if (!newMsg.trim()) return;
    sendMessageMutation.mutate({
      chatRoomId: chatRoomId as string,
      content: newMsg,
    });
    setNewMsg("");
  };

  const otherUser =
    messages.find((msg) => msg.sender?.id && msg.sender.id !== user?.id)
      ?.sender ??
    (data?.otherUser?.id && data?.otherUser?.username ? data.otherUser : null);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="w-10 h-10 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isError) {
    let errMsg = "Something went wrong.";
    if (
      error &&
      typeof error === "object" &&
      "response" in error &&
      typeof error.response === "object" &&
      error.response &&
      "data" in error.response &&
      typeof error.response.data === "object" &&
      error.response.data &&
      "error" in error.response.data &&
      typeof error.response.data.error === "string"
    ) {
      errMsg = error.response.data.error;
    }

    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg max-w-md mx-auto mb-6 mt-10">
        <p className="font-semibold">Error: {errMsg}</p>
        <p className="text-sm mt-1">Something Went Wrong</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-3xl mt-5 mx-auto bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-gray-50">
        {otherUser ? (
          <>
            <img
              src={otherUser.avatar}
              alt={otherUser.username}
              className="w-10 h-10 rounded-full object-cover border"
            />
            <div>
              <p className="text-base font-semibold">{otherUser.username}</p>
            </div>
          </>
        ) : (
          <p className="text-base font-semibold text-gray-500">Chat</p>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 bg-gradient-to-b from-gray-50 to-gray-100">
        {messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-gray-400">
            <p className="text-sm italic">
              No messages yet. Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            if (!msg.sender || !msg.sender.id) return null;
            const isOwn = msg.sender.id === user?.id;
            return (
              <div
                key={msg.id}
                className={`flex ${
                  isOwn ? "justify-end" : "justify-start"
                } mb-4`}
              >
                <div
                  className={`flex ${
                    isOwn ? "flex-row-reverse" : ""
                  } items-end gap-2 max-w-[80%]`}
                >
                  {!isOwn && (
                    <img
                      src={msg.sender.avatar}
                      alt={msg.sender.username}
                      className="rounded-full border w-7 h-7"
                    />
                  )}
                  <div className="flex flex-col">
                    <div
                      title={dayjs(msg.createdAt).format("HH:mm")}
                      className={`px-2 sm:px-4 py-2 text-sm rounded-2xl shadow-md break-words whitespace-pre-wrap ${
                        isOwn
                          ? "bg-blue-600 text-white rounded-br-none"
                          : "bg-white text-gray-900 border rounded-bl-none"
                      }`}
                      style={{ wordBreak: "break-word" }}
                    >
                      {msg.content}
                    </div>

                    <div
                      className={`flex items-center gap-1 mt-1 ${
                        isOwn ? "justify-end" : ""
                      }`}
                    >
                      <span className="text-xs text-gray-400">
                        {dayjs(msg.createdAt).format("HH:mm")}
                      </span>
                      {isOwn && (
                        <>
                          {msg.read ? (
                            <CheckCheck size={16} className="text-blue-500" />
                          ) : (
                            <Check size={16} className="text-gray-400" />
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white flex items-center gap-3">
        <input
          value={newMsg}
          onChange={(e) => setNewMsg(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-[60%]"
          placeholder="Type a message..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-600 text-white px-5 py-2 rounded-full text-sm hover:bg-blue-700 transition"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
