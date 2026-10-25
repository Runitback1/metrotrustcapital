import { fireEvent, render, screen } from "@testing-library/react";
import ThemeProvider from "../context/ThemeContext";
import Transactions from "./Transactions";

const currentAccount = "ACC-SENDER-1234";

beforeEach(() => {
  jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  jest.spyOn(window, "requestAnimationFrame").mockImplementation(() => 0);
});

afterEach(() => {
  jest.restoreAllMocks();
});

const renderTransactionReceipt = (transaction) => {
  render(
    <ThemeProvider>
      <Transactions
        transactions={[transaction]}
        userExternalTransfers={[]}
        accountNumber={currentAccount}
        isMobile={false}
      />
    </ThemeProvider>
  );

  fireEvent.click(screen.getByRole("button", { name: "View receipt for Alex Morgan" }));
};

test("shows the recipient account number on receipts for sent transactions", () => {
  renderTransactionReceipt({
    id: "sent-transaction",
    sender_account: currentAccount,
    sender_name: "Taylor Morgan",
    receiver_account: "ACC-RECIPIENT-5678",
    receiver_name: "Alex Morgan",
    amount: 125,
    description: "Internal Transfer",
    status: "Completed",
    created_at: "2026-01-15T14:30:00.000Z",
  });

  expect(screen.getByText("Account number: ACC-RECIPIENT-5678")).toBeInTheDocument();
});

test("shows the sender account number on receipts for received historical transactions", () => {
  renderTransactionReceipt({
    id: "received-transaction",
    sender_account: "ACC-SENDER-9876",
    sender_name: "Alex Morgan",
    receiver_account: currentAccount,
    receiver_name: "Taylor Morgan",
    amount: 75,
    description: "Internal Transfer",
    status: "Completed",
    created_at: "2024-06-10T09:15:00.000Z",
  });

  expect(screen.getByText("Account number: ACC-SENDER-9876")).toBeInTheDocument();
});
