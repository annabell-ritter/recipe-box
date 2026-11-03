"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { sendChatMessage } from "@/app/chat/actions";

// Mirrors the server-side limit in app/chat/actions.ts (convenience only).
const MESSAGE_MAX_LENGTH = 4_000;

type Message = { role: "user" | "assistant"; content: string };

type ChatProps = {
  initialConversationId: string;
  initialMessages: Message[];
};

export function Chat({ initialConversationId, initialMessages }: ChatProps) {
  // Every send passes the whole conversation to the server, so the AI can
  // follow up on earlier messages. The server also saves each question and
  // reply to Supabase, and the page loads them again after a reload.
  const [conversationId, setConversationId] = useState(initialConversationId);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isPending]);

  function send() {
    const text = draft.trim();
    if (!text || isPending) return;

    const conversation: Message[] = [...messages, { role: "user", content: text }];
    setMessages(conversation);
    setDraft("");
    setError(null);
    setNotice(null);

    startTransition(async () => {
      const result = await sendChatMessage(conversationId, conversation);
      if (result.ok) {
        setMessages([...conversation, { role: "assistant", content: result.reply }]);
        if (!result.saved) {
          setNotice("This reply could not be saved, so it may be missing after a reload.");
        }
      } else {
        // Undo the unanswered message and give the text back for a retry.
        setMessages(messages);
        setDraft(text);
        setError(result.error);
      }
    });
  }

  function startNewConversation() {
    if (isPending) return;
    const id = crypto.randomUUID();
    setConversationId(id);
    setMessages([]);
    setDraft("");
    setError(null);
    setNotice(null);
    // Remember the new (still empty) conversation in the URL, so a reload
    // keeps showing it instead of reopening the previous one.
    window.history.replaceState(null, "", `/chat?c=${id}`);
  }

  return (
    <div className="flex h-[calc(100dvh-11rem)] flex-col gap-3">
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={startNewConversation}
          disabled={isPending || messages.length === 0}
        >
          New conversation
        </Button>
      </div>
      <div
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        className="flex-1 overflow-y-auto rounded-md border p-4"
      >
        {messages.length === 0 && !isPending && (
          <p className="text-center text-sm text-muted-foreground">
            Ask anything about cooking, recipes or ingredients.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <li
              key={index}
              data-role={message.role}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground"
                  : "mr-auto max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm"
              }
            >
              <span className="sr-only">{message.role === "user" ? "You: " : "AI: "}</span>
              {message.content}
            </li>
          ))}
          {isPending && (
            <li className="mr-auto rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm text-muted-foreground">
              Thinking…
            </li>
          )}
        </ul>
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}

      <form
        className="flex items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="chat-message" className="sr-only">
          Message
        </label>
        <textarea
          id="chat-message"
          rows={2}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends; Shift+Enter adds a new line.
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              send();
            }
          }}
          maxLength={MESSAGE_MAX_LENGTH}
          placeholder="Type a message…"
          className="flex min-h-10 w-full flex-1 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring md:text-sm"
        />
        <Button type="submit" disabled={isPending || draft.trim().length === 0}>
          Send
        </Button>
      </form>
    </div>
  );
}
