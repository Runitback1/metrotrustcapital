import { getReceiptStatus } from './transactionStatus';

test('keeps pending transaction receipts pending', () => {
  expect(getReceiptStatus('Pending')).toBe('Pending');
  expect(getReceiptStatus('pending approval')).toBe('Pending');
});

test('maps rejected and completed receipt statuses safely', () => {
  expect(getReceiptStatus('Rejected')).toBe('Rejected');
  expect(getReceiptStatus('Approved')).toBe('Completed');
  expect(getReceiptStatus()).toBe('Completed');
});
