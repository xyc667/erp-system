export async function generateOrderNo(
  prefix: string,
  countFn: () => Promise<number>,
): Promise<string> {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await countFn();
  return `${prefix}-${date}-${String(count + 1).padStart(4, '0')}`;
}
