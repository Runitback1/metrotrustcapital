export const isFrozenAccount = (account) => {
  const status = String(account?.status || '').trim();
  return status.toLowerCase() === 'frozen';
};

export const validateInternalTransfer = ({
  senderAccount,
  receiverAccount,
  amount,
  accountNumber,
  recipientAccountNumber,
  pin,
}) => {
  if (!senderAccount) return 'Sender account not found';
  if (String(accountNumber || '').trim() === String(recipientAccountNumber || '').trim()) {
    return 'You cannot transfer to the same account';
  }
  if (!String(pin || '').match(/^\d{4}$/)) return 'Invalid PIN';
  if (String(senderAccount.transfer_pin || '') !== String(pin)) return 'Incorrect PIN';
  if (isFrozenAccount(senderAccount)) return 'Service is temporarily under maintenance. Please try again later or contact support.';
  if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) return 'Please fill in all required fields';
  if (Number(senderAccount.balance || 0) < Number(amount)) return 'Insufficient funds';
  if (!receiverAccount) return 'Recipient account not found';
  if (isFrozenAccount(receiverAccount)) return 'Service is temporarily under maintenance. Please try again later or contact support.';
  return null;
};
