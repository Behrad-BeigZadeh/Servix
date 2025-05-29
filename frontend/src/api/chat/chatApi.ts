import axios from "axios";

export const getAllChats = async (accessToken: string | null) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    return res.data;
  } catch (error) {
    console.log("Error fetching chats:", error);
    throw error;
  }
};

export const getTotalUnseenMessages = async (accessToken: string | null) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/unseen-total`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log("Error fetching total unseen messages:", error);
    throw error;
  }
};

export const getChatRoomMessages = async (
  chatRoomId: string,
  accessToken: string | null
) => {
  try {
    const res = await axios.get(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/${chatRoomId}/messages`,
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log("Error fetching messages:", error);
    throw error;
  }
};

export const startOrGetChatRoom = async (
  receiverId: string,
  accessToken: string | null
) => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat`,
      { receiverId },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log("Error starting chat:", error);
    throw error;
  }
};

export const sendMessage = async (
  chatRoomId: string,
  content: string,
  accessToken: string | null
) => {
  try {
    const res = await axios.post(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/${chatRoomId}/messages`,
      { content },
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        validateStatus: (status) => status >= 200 && status < 300,
      }
    );

    console.log("✅ sendMessage success:");
    console.log("Status:", res.status);
    console.log("Data:", res.data);

    return res.data.message;
  } catch (error) {
    console.log("❌ sendMessage error:");

    throw error;
  }
};

export const markMessagesAsSeen = async (
  messageId: string,
  accessToken: string | null
) => {
  try {
    const res = await axios.patch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/chat/${messageId}/seen`,
      {},
      {
        withCredentials: true,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return res.data;
  } catch (error) {
    console.log("Error marking messages as seen:", error);
    throw error;
  }
};
