import { isFrozenAccount, validateInternalTransfer } from './transferValidation';

test('treats missing account records as not frozen and not valid for transfer', () => {
  expect(isFrozenAccount(null)).toBe(false);
  expect(isFrozenAccount(undefined)).toBe(false);

  const result = validateInternalTransfer({
    senderAccount: { balance: 1000, transfer_pin: '1234', status: 'Active' },
    receiverAccount: null,
    amount: 50,
    accountNumber: '1001',
    recipientAccountNumber: '2002',
    pin: '1234',
  });

  expect(result).toBe('Recipient account not found');
});

test('allows valid transfers when the account is active and the recipient exists', () => {
  const result = validateInternalTransfer({
    senderAccount: { balance: 1000, transfer_pin: '1234', status: 'Active' },
    receiverAccount: { balance: 500, status: 'Active' },
    amount: 50,
    accountNumber: '1001',
    recipientAccountNumber: '2002',
    pin: '1234',
  });

  expect(result).toBeNull();
});
