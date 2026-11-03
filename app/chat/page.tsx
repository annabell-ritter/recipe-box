import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { getConversation } from "@/lib/chats";
import { NotSignedInError } from "@/lib/recipes";

type ChatPageProps = {
  // ?c=<conversation id> opens that conversation. Without it, the user's
  // most recent conversation opens.
  searchParams: Promise<{ c?: string | string[] }>;
};

async function SavedChat({ searchParams }: ChatPageProps) {
  const { c } = await searchParams;

  let conversation;
  try {
    conversation = await getConversation(typeof c === "string" ? c : undefined);
  } catch (error) {
    if (error instanceof NotSignedInError) redirect("/auth/login");
    throw error;
  }

  return (
    <Chat
      // A new key resets the chat state when another conversation loads.
      key={conversation.conversationId}
      initialConversationId={conversation.conversationId}
      initialMessages={conversation.messages}
    />
  );
}

export default function ChatPage(props: ChatPageProps) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-2xl font-bold">Chat</h1>
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading chat…</p>}>
        <SavedChat {...props} />
      </Suspense>
    </div>
  );
}
