---
name: state-machines
description: "Use when modelling UI or workflow logic as finite state machines and statecharts with XState v5 — setup() with typed context, events and input, guards, actions and assign, invoked actors (fromPromise, fromCallback), delayed transitions, parallel and nested states, createActor, persistence, @xstate/react hooks, the Stately inspector, and testing with provide()."
license: MIT
---

# State Machines and XState

Makes the agent replace tangles of booleans (`isLoading && !hasError && isRetrying`) with explicit
states and transitions, written in current XState v5 style: `setup()` first, typed events,
named guards and actions, async work as invoked actors, and tests that run without the UI.

## When to Use This Skill
- A component or service has flags that can combine into impossible states
- Multi-step flows: checkout, onboarding wizards, auth with MFA, file upload with retry and cancel
- Logic with timeouts, debounce, polling or retries that must be cancellable
- Sharing one workflow between React, a Node worker and tests
- Migrating XState v4 code (`createMachine(config, options)`, `interpret`, `services`, `cond`) to v5

Not every store needs a statechart: plain shared state fits `zustand` or `redux-toolkit`;
`@xstate/store` is a lighter event-driven store from the same team.

## Model First
1. List the **states** the user could describe ("editing", "submitting", "failed", "done").
   If two flags can both be true, they are probably parallel regions or separate states.
2. List the **events** as things that happened (`SUBMIT`, `RETRY`, `CANCEL`, `TIMEOUT`).
3. For each state, decide which events it accepts; anything not listed is ignored, which is the
   point (a second `SUBMIT` while submitting does nothing).
4. Put async work in `invoke` on the state that needs it; leaving the state cancels it.
5. Keep **context** for data (inputs, results, error, counters), not for which step you are in.
6. Use nested states for sub-steps and `type: 'parallel'` for independent regions (upload + form).

## Machine (XState 5)
```ts
import { setup, assign, fromPromise } from 'xstate';

type Ctx = { items: string[]; email: string; orderId: string | null; error: string | null; retries: number };
type Ev = { type: 'SUBMIT'; email: string } | { type: 'RETRY' } | { type: 'CANCEL' };

export const checkoutMachine = setup({
  types: {
    context: {} as Ctx,
    events: {} as Ev,
    input: {} as { items: string[] },
    output: {} as { orderId: string },
  },
  actors: {
    placeOrder: fromPromise<{ orderId: string }, { email: string; items: string[] }>(
      ({ input, signal }) => api.placeOrder(input, { signal }),   // signal aborts when the state exits
    ),
  },
  guards: {
    hasItems: ({ context }) => context.items.length > 0,
    canRetry: ({ context }) => context.retries < 3,
  },
  actions: {
    track: (_, params: { name: string }) => analytics.track(params.name),
  },
  delays: { submitTimeout: 10_000 },
}).createMachine({
  id: 'checkout',
  context: ({ input }) => ({ items: input.items, email: '', orderId: null, error: null, retries: 0 }),
  initial: 'editing',
  states: {
    editing: {
      on: {
        SUBMIT: { guard: 'hasItems', target: 'submitting',
                  actions: assign({ email: ({ event }) => event.email, error: null }) },
      },
    },
    submitting: {
      entry: { type: 'track', params: { name: 'checkout_submit' } },
      invoke: {
        src: 'placeOrder',
        input: ({ context }) => ({ email: context.email, items: context.items }),
        onDone: { target: 'done', actions: assign({ orderId: ({ event }) => event.output.orderId }) },
        onError: { target: 'failed', actions: assign({ error: ({ event }) => String(event.error) }) },
      },
      after: { submitTimeout: { target: 'failed', actions: assign({ error: 'timeout' }) } },
      on: { CANCEL: 'editing' },
    },
    failed: {
      on: { RETRY: { guard: 'canRetry', target: 'editing',
                     actions: assign({ retries: ({ context }) => context.retries + 1 }) } },
    },
    done: { type: 'final' },
  },
  output: ({ context }) => ({ orderId: context.orderId! }),
});
```

## Run It
```ts
import { createActor, waitFor } from 'xstate';

const actor = createActor(checkoutMachine, { input: { items: ['sku_1'] } });
actor.subscribe((snapshot) => console.log(snapshot.value, snapshot.context.error));
actor.start();
actor.send({ type: 'SUBMIT', email: 'a@example.com' });
const final = await waitFor(actor, (s) => s.status === 'done', { timeout: 15_000 });
console.log(final.output);                       // { orderId: ... }

// Persist and restore (e.g. a long-running workflow or a wizard across reloads)
const saved = actor.getPersistedSnapshot();
const restored = createActor(checkoutMachine, { input: { items: [] }, snapshot: saved }).start();
```
Other actor creators: `fromCallback` (subscriptions, websockets; return a cleanup function),
`fromObservable`, `fromTransition` (reducer-style), and child machines via `invoke` or `spawnChild`.

## React (@xstate/react 6)
```tsx
import { useMachine, createActorContext } from '@xstate/react';

export function Checkout({ items }: { items: string[] }) {
  const [snapshot, send] = useMachine(checkoutMachine, { input: { items } });
  if (snapshot.matches('done')) return <p>Order {snapshot.context.orderId}</p>;
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      send({ type: 'SUBMIT', email: String(new FormData(e.currentTarget).get('email')) });
    }}>
      <input name="email" type="email" required />
      {snapshot.matches('failed') && <p role="alert">{snapshot.context.error}</p>}
      <button disabled={!snapshot.can({ type: 'SUBMIT', email: '' })}>Pay</button>
    </form>
  );
}

// Shared across a subtree; components re-render only when their selected value changes.
export const CheckoutContext = createActorContext(checkoutMachine);
function PayingBadge() {
  const isBusy = CheckoutContext.useSelector((s) => s.matches('submitting'));
  return isBusy ? <span>Paying…</span> : null;
}
// <CheckoutContext.Provider options={{ input: { items } }}><PayingBadge /></CheckoutContext.Provider>
```
- `useMachine` re-renders on every snapshot; for large trees use `useActorRef` + `useSelector`.
- Inject component-scoped implementations with `useMachine(machine.provide({ actions: { … } }))`.
- Debug visually: `createActor(machine, { inspect: createBrowserInspector().inspect })` from `@statelyai/inspect`.

## v4 → v5 Cheatsheet
| v4 | v5 |
|----|----|
| `createMachine(config, { actions, services, guards })` | `setup({ actions, actors, guards }).createMachine(config)` |
| `interpret(machine)` | `createActor(machine)` |
| `cond: 'x'` | `guard: 'x'` |
| `services` / `invoke.src` as function | `actors` + `fromPromise` / `fromCallback` |
| `state.matches`, `state.can` | same, on `actor.getSnapshot()` |
| `send('EVENT')` | `send({ type: 'EVENT' })` (objects only) |
| `machine.withContext(...)` | `input` + `context: ({ input }) => …` |

## Rules
- Use `setup()` for every machine; declare types there and reference guards, actions, actors and delays by name.
- Events are past-tense or imperative facts; never send state names as events.
- Put side effects in actions or actors, never inside `assign` or guards; guards must be pure.
- Async work goes in `invoke` on the state that owns it, so leaving the state cancels it; pass `signal` to `fetch`.
- Keep machines framework-free in their own module; the UI only sends events and reads snapshots.
- Pin `xstate@5`; v6 is in alpha with breaking changes.

## Common Mistakes
- **Booleans in context to track the step** (`context.isSubmitting`): make it a state.
- **Creating the actor inside render without hooks**: a new actor every render. Use `useMachine`/`useActorRef`.
- **Promise started in an action** (fire-and-forget): cannot be cancelled or tracked. Use an invoked actor.
- **Huge single machine for the whole app**: split into child actors per feature and communicate with events.
- **`assign` with a mutation** (`context.items.push(x)`): return new values instead.
- **Untyped events**: forgetting `types.events` loses autocompletion and lets typos through.

## Verify
- Unit tests in Vitest/Jest without the DOM: create an actor, send events, assert `snapshot.value` and `context`.
- Mock async work with `machine.provide({ actors: { placeOrder: fromPromise(async () => ({ orderId: 't1' })) } })`.
- Assert impossible events are ignored: `expect(snapshot.can({ type: 'SUBMIT', email: 'x' })).toBe(false)` while submitting.
- Use fake timers to test `after` delays; for exhaustive coverage generate paths with `getShortestPaths` / `createTestModel` from `xstate/graph`.
- Run `tsc --noEmit`; v5 typing catches unknown event types and wrong guard names.
