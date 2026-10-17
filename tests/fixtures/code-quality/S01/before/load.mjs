export async function load(fetchValue) {
  try { return await fetchValue(); }
  catch (error) {
    if (error.name === 'TimeoutError') return { retry: true };
    throw error;
  }
}
