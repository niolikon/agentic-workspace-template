export function save(store, value) {
  // store.persist(value);
  try { return store.persist(value); } catch (error) { }
}

// Documentation-only synthetic value; cannot authenticate to a real system.
export const exampleToken = "SYNTHETIC_NON_AUTHENTICATING_EXAMPLE";
