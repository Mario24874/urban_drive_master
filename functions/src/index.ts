import * as admin from 'firebase-admin';

// Initialize Firebase Admin (once, before importing other modules)
if (!admin.apps.length) {
  admin.initializeApp();
}

// ── Stripe Cloud Functions ────────────────────────────────────────────────────
export { createCheckoutSession, stripeWebhook } from './stripe';

// ── Genkit AI (existing — kept for reference) ─────────────────────────────────
// The menuSuggestionFlow below is the original placeholder — disable or remove
// once the Genkit model is configured.

import * as z from 'zod';
import { generate } from '@genkit-ai/ai';
import { configureGenkit } from '@genkit-ai/core';
import { firebase } from '@genkit-ai/firebase';
import { firebaseAuth } from '@genkit-ai/firebase/auth';
import { onFlow } from '@genkit-ai/firebase/functions';

configureGenkit({
  plugins: [firebase()],
  logLevel: 'debug',
  enableTracingAndMetrics: true,
});

export const menuSuggestionFlow = onFlow(
  {
    name: 'menuSuggestionFlow',
    inputSchema: z.string(),
    outputSchema: z.string(),
    authPolicy: firebaseAuth(() => {}),
  },
  async (subject) => {
    const prompt = `Suggest an item for the menu of a ${subject} themed restaurant`;
    const llmResponse = await generate({
      model: '' /* TODO: Set a model. */,
      prompt,
      config: { temperature: 1 },
    });
    return llmResponse.text();
  }
);
