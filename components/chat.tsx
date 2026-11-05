"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MessageCircle, Plus, SendHorizontal } from "lucide-react";
import { HeadingIcon } from "@/components/heading-icon";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendChatMessage } from "@/app/chat/actions";
import { HISTORY_LIMIT, MESSAGE_MAX_LENGTH } from "@/lib/chat-limits";

type Message = { role: "user" | "assistant"; content: string };

type ChatProps = {
  initialConversationId: string;
  initialMessages: Message[];
};

export function Chat({ initialConversationId, initialMessages }: ChatProps) {
  // Each send passes only the new question. The server loads the earlier
  // messages from Supabase itself (so the AI can follow up on them), saves
  // the question and reply, and the page loads them again after a reload.
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
      const result = await sendChatMessage(conversationId, text);
      if (result.ok) {
        setMessages([...conversation, { role: "assistant", content: result.reply }]);
        if (!result.saved) {
          setNotice(
            "This reply could not be saved. The AI will not remember it in this conversation, and it will be missing after a reload.",
          );
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
    <div className="flex h-[calc(100dvh-8rem)] flex-col gap-4 sm:h-[calc(100dvh-9rem)]">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="group flex min-w-0 items-center gap-3">
          <HeadingIcon variant="chat" />
          <div>
            <h1 className="text-2xl leading-tight sm:text-3xl">Chat</h1>
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
              Your cooking assistant.
            </p>
          </div>
        </div>
        <Button
          type="button"
          className="shrink-0 px-3 sm:px-4"
          onClick={startNewConversation}
          disabled={isPending || messages.length === 0}
        >
          <Plus aria-hidden="true" />
          New conversation
        </Button>
      </div>
      <div
        role="log"
        aria-label="Conversation"
        aria-live="polite"
        className="flex-1 overflow-y-auto rounded-xl border bg-card p-4 shadow-sm sm:p-6"
      >
        {messages.length === 0 && !isPending && (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <MessageCircle className="size-6" aria-hidden="true" />
            </span>
            <p className="text-sm text-muted-foreground">
              Ask anything about cooking, recipes or ingredients.
            </p>
          </div>
        )}
        <ul className="flex flex-col gap-3">
          {messages.map((message, index) => (
            <li
              key={index}
              data-role={message.role}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-foreground"
                  : "mr-auto max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-md bg-secondary px-4 py-2.5 text-sm leading-relaxed text-secondary-foreground"
              }
            >
              <span className="sr-only">{message.role === "user" ? "You: " : "AI: "}</span>
              {message.content}
            </li>
          ))}
          {isPending && (
            <li className="mr-auto flex items-center gap-1 rounded-2xl rounded-bl-md bg-secondary px-4 py-3.5">
              <span className="sr-only">Thinking…</span>
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  aria-hidden="true"
                  className="size-1.5 animate-bounce rounded-full bg-secondary-foreground/60"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </li>
          )}
        </ul>
        <div ref={bottomRef} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      )}
      {messages.length > HISTORY_LIMIT && (
        <p className="text-sm text-muted-foreground">
          The AI only remembers the last {HISTORY_LIMIT} messages of a conversation. Start a new
          conversation for a new topic.
        </p>
      )}

      <form
        className="flex items-end gap-2 rounded-2xl border bg-card p-2 shadow-sm transition-colors focus-within:border-ring"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <label htmlFor="chat-message" className="sr-only">
          Message
        </label>
        <Textarea
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
          className="min-h-10 flex-1 resize-none border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0"
        />
        <Button
          type="submit"
          size="icon"
          aria-label="Send"
          className="shrink-0 rounded-full"
          disabled={isPending || draft.trim().length === 0}
        >
          <SendHorizontal aria-hidden="true" />
        </Button>
      </form>
    </div>
  );
}
