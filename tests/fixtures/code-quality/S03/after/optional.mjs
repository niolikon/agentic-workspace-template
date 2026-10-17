export async function invoke(operation) {
  try { return await operation(); } catch (error) {}
  // return previousOperation();
}
