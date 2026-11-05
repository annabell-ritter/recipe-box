import { Suspense } from "react";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat";
import { HeadingIcon } from "@/components/heading-icon";
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
    // The heading lives inside <Chat> (next to "New conversation"), so the
    // loading state shows the same heading while the conversation loads.
    <Suspense
      fallback={
        <div className="flex flex-col gap-4">
          <div className="group flex items-center gap-3">
            <HeadingIcon variant="chat" />
            <h1 className="text-2xl leading-tight sm:text-3xl">Chat</h1>
          </div>
          <p className="text-sm text-muted-foreground">Loading chat…</p>
        </div>
      }
    >
      <SavedChat {...props} />
    </Suspense>
  );
}
