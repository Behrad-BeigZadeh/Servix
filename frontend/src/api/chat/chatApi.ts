import api from "@/lib/axios";

export const getAllChats = async () => {
  try {
    const res = await api.get("/api/chat");
    return res.data;
  } catch (error) {
    console.log("Error fetching chats:", error);
    throw error;
  }
};

export const getTotalUnseenMessages = async () => {
  try {
    const res = await api.get("/api/chat/unseen-total");
    return res.data;
  } catch (error) {
    console.log("Error fetching total unseen messages:", error);
    throw error;
  }
};

export const getChatRoomMessages = async (chatRoomId: string) => {
  try {
    const res = await api.get(`/api/chat/${chatRoomId}/messages`);
    return res.data;
  } catch (error) {
    console.log("Error fetching messages:", error);
    throw error;
  }
};

export const startOrGetChatRoom = async (receiverId: string) => {
  try {
    const res = await api.post("/api/chat", { receiverId });
    return res.data;
  } catch (error) {
    console.log("Error starting chat:", error);
    throw error;
  }
};

export const sendMessage = async (chatRoomId: string, content: string) => {
  try {
    const res = await api.post(
      `/api/chat/${chatRoomId}/messages`,
      { content },
      {
        validateStatus: (status) => status >= 200 && status < 300,
      }
    );

    return res.data.message;
  } catch (error) {
    console.log("sendMessage error:", error);
    throw error;
  }
};

export const markMessagesAsSeen = async (messageId: string) => {
  try {
    const res = await api.patch(`/api/chat/${messageId}/seen`, {});
    return res.data;
  } catch (error) {
    console.log("Error marking messages as seen:", error);
    throw error;
  }
};
