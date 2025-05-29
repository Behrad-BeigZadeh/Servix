import ChatRoom from "@/components/chat/ChatRoom";

export default async function ChatRoomPage({
  params,
}: {
  params: Promise<{ chatRoomId: string }>;
}) {
  const chatRoomId = (await params).chatRoomId;
  return <ChatRoom chatRoomId={chatRoomId} />;
}
