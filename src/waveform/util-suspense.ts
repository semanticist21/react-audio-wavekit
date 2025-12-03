/**
 * Suspense utility for React 18/19 compatibility
 *
 * This implements the same Promise-throwing mechanism as React 19's use() hook.
 * Works in both React 18 and React 19 by directly throwing Promises for Suspense boundaries.
 */

interface PromiseWithCache<T> extends Promise<T> {
  _status?: "pending" | "fulfilled" | "rejected";
  _value?: T;
  _error?: Error;
}

/**
 * Unwraps a Promise for Suspense integration
 *
 * @param promise - Promise to unwrap
 * @returns The resolved value if ready, throws Promise if pending, throws error if rejected
 *
 * @example
 * ```tsx
 * <Suspense fallback={<Loading />}>
 *   <Component />
 * </Suspense>
 *
 * function Component() {
 *   const data = unwrapPromise(fetchData());
 *   return <div>{data}</div>;
 * }
 * ```
 */
export function unwrapPromise<T>(promise: Promise<T>): T {
  const cached = promise as PromiseWithCache<T>;

  // Initialize cache if first time
  if (!cached._status) {
    cached._status = "pending";
    cached._value = undefined;
    cached._error = undefined;

    cached.then(
      (value) => {
        cached._status = "fulfilled";
        cached._value = value;
      },
      (error) => {
        cached._status = "rejected";
        cached._error = error;
      }
    );
  }

  // Return value, throw error, or throw Promise for Suspense
  if (cached._status === "rejected") throw cached._error;
  if (cached._status === "pending") throw promise; // Suspense catches this
  return cached._value as T;
}
