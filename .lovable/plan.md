

## Toast Duration Review

### Current State

The `<Sonner>` component in `src/components/ui/sonner.tsx` does **not** set a `duration` prop, so Sonner's built-in default of **4000ms (4 seconds)** applies to every toast.

Most toast calls across the codebase (~50+ calls) also do **not** specify a `duration`, inheriting that 4s default. The only file with explicit durations is `src/utils/metrics-feedback.ts`, which sets 2000-5000ms for specific processing toasts.

Error toasts (`toast.error(...)`) also use 4s by default -- Sonner does not differentiate.

### Proposed Change

Set a shorter global default on the `<Sonner>` component and add a longer default for error toasts so they remain visible:

| Toast Type | Current | Proposed |
|---|---|---|
| Regular/success | 4000ms | **2500ms** |
| Error | 4000ms | **4000ms** (keep) |

### File Modified

| File | Change |
|---|---|
| `src/components/ui/sonner.tsx` | Add `duration={2500}` prop to the `<Sonner>` component. Add `error` classNames styling for visibility. |

This is a one-line change. The explicit durations in `metrics-feedback.ts` will continue to override the default where needed. No other files need changes.

