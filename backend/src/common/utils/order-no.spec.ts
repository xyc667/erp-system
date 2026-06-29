import { generateOrderNo } from './order-no';

describe('generateOrderNo', () => {
  it('formats order number with prefix, date and sequence', async () => {
    const fixedDate = new Date('2026-06-26T10:00:00.000Z');
    jest.useFakeTimers().setSystemTime(fixedDate);

    const orderNo = await generateOrderNo('PO', async () => 5);

    expect(orderNo).toBe('PO-20260626-0006');

    jest.useRealTimers();
  });

  it('pads sequence to four digits', async () => {
    const orderNo = await generateOrderNo('SO', async () => 0);
    expect(orderNo).toMatch(/SO-\d{8}-0001$/);
  });
});
