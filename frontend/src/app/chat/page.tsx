"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getAllChats } from "@/api/chat/chatApi";
import { useUserStore } from "@/stores/userStore";
import { MessagesSquare } from "lucide-react";

interface ChatRoom {
  id: string;
  client: { id: string; username: string; avatar: string };
  provider: { id: string; username: string; avatar: string };
  messages: { content: string; createdAt: string }[];
  unseenCount: number;
}

const ChatList = () => {
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const { user } = useUserStore();
  const { data, isError, isLoading, error } = useQuery({
    queryKey: ["chats", user?.id],
    queryFn: async () => getAllChats(),
  });

  useEffect(() => {
    if (data) {
      setChats(data.allChats);
    }
  }, [data]);

  if (isLoading)
    return (
      <div className="flex justify-center items-center py-24">
        <div className="w-10 h-10 border-4 border-zinc-300 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );

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
      <div className="bg-red-100 text-red-700 p-4 rounded-xl max-w-md mx-auto my-12 shadow-md">
        <p className="font-semibold">Error: {errMsg}</p>
        <p className="text-sm mt-1">
          Something went wrong while fetching chats.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-zinc-700">Your Chats</h2>

      {chats.length === 0 ? (
        <div className="flex flex-col items-center justify-center mt-16 text-zinc-600 ">
          <MessagesSquare size={64} className="mb-4" />
          <p className="text-lg font-medium">You have no chats yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {chats.map((chat) => {
            const lastMessage = chat.messages[0]?.content ?? "No messages yet";
            const participant =
              chat.client.id !== user?.id ? chat.client : chat.provider;

            return (
              <Link
                href={`/chat/${chat.id}`}
                key={chat.id}
                className="flex items-center gap-4 bg-white/70 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 rounded-2xl shadow hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-all relative"
              >
                <div className="relative">
                  <img
                    src={participant.avatar}
                    alt={participant.username}
                    className="w-12 h-12 rounded-full object-cover border border-zinc-300 dark:border-zinc-600"
                  />
                  {chat.unseenCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full shadow-md">
                      {chat.unseenCount > 9 ? "9+" : chat.unseenCount}
                    </span>
                  )}
                </div>

                <div className="flex flex-col overflow-hidden">
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {participant.username}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate max-w-xs">
                    {lastMessage}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ChatList;
