import { test, expect, type Page } from '@playwright/test';
import { hasTestUser, logIn, missingTestUserMessage } from './helpers';
import {
  deleteTestConversations,
  newTestConversationId,
  useFixedAiReplies,
} from './chat-helpers';

// The chat tests never call OpenRouter: the server answers with fixed test
// replies (see lib/ai-test-substitute.ts). Each test uses its own new
// conversations and deletes only those afterwards.

function chat(page: Page) {
  const log = page.getByRole('log', { name: 'Conversation' });
  return {
    log,
    box: page.getByLabel('Message'),
    sendButton: page.getByRole('button', { name: 'Send' }),
    newButton: page.getByRole('button', { name: 'New conversation' }),
    messages: log.locator('li[data-role]'),
    aiMessages: log.locator('li[data-role="assistant"]'),
  };
}

/** Every message in the log, in screen order, as "role: text". */
async function transcript(page: Page) {
  return chat(page).messages.evaluateAll((items) =>
    items.map((li) => {
      const text = (li.textContent ?? '').replace(/^(You|AI): /, '').trim();
      return `${li.getAttribute('data-role')}: ${text}`;
    }),
  );
}

function conversationIdFromUrl(page: Page) {
  return new URL(page.url()).searchParams.get('c');
}

test('signed-out visitors are sent from /chat to the login page', async ({ page }) => {
  await page.goto('/chat');
  await expect(page).toHaveURL(/\/auth\/login$/);
});

test.describe('chat with fixed test replies', () => {
  let testConversations: string[] = [];

  test.beforeEach(async ({ page, context }) => {
    test.skip(!hasTestUser, missingTestUserMessage);
    testConversations = [];
    await useFixedAiReplies(context);
    await logIn(page);
  });

  test.afterEach(async () => {
    if (!hasTestUser) return;
    const removed = await deleteTestConversations(testConversations);
    test.info().annotations.push({ type: 'cleanup', description: `removed ${removed} test messages` });
  });

  test('send, follow up, reload, and start a new conversation', async ({ page }) => {
    const conversationId = newTestConversationId();
    testConversations.push(conversationId);
    await page.goto(`/chat?c=${conversationId}`);
    const { box, sendButton, newButton, messages, aiMessages } = chat(page);
    await expect(messages).toHaveCount(0);

    const first = 'What can I cook with leeks?';
    const followUp = 'Tell me more about that.';
    const firstReply = `Test reply 1 (received 1 message): ${first}`;
    // 3 messages = first question, first reply, follow-up: the whole
    // conversation reached the server, which is what gives the AI its memory.
    const followUpReply = `Test reply 2 (received 3 messages): ${followUp}`;

    await test.step('send a message and a reply appears', async () => {
      await box.fill(first);
      await sendButton.click();
      await expect(aiMessages).toHaveCount(1);
      await expect(aiMessages.first()).toHaveText(`AI: ${firstReply}`);
    });

    await test.step('send a follow-up and the conversation continues', async () => {
      await box.fill(followUp);
      await box.press('Enter');
      await expect(aiMessages).toHaveCount(2);
      expect(await transcript(page)).toEqual([
        `user: ${first}`,
        `assistant: ${firstReply}`,
        `user: ${followUp}`,
        `assistant: ${followUpReply}`,
      ]);
    });

    await test.step('after a reload the messages and replies are still there, in order', async () => {
      await page.reload();
      await expect(messages).toHaveCount(4);
      expect(await transcript(page)).toEqual([
        `user: ${first}`,
        `assistant: ${firstReply}`,
        `user: ${followUp}`,
        `assistant: ${followUpReply}`,
      ]);
    });

    await test.step('a new conversation is empty', async () => {
      await newButton.click();
      await expect(messages).toHaveCount(0);
      const newId = conversationIdFromUrl(page);
      expect(newId).toBeTruthy();
      expect(newId).not.toBe(conversationId);
      testConversations.push(newId!);

      // It stays empty after a reload.
      await page.reload();
      await expect(chat(page).log).toBeVisible();
      await expect(messages).toHaveCount(0);
    });
  });
});
