export async function load(fetchValue) {
  try { return await fetchValue(); }
  catch (error) {
    if (error.name === 'TypeError') return { retry: true };
    throw error;
  }
}
