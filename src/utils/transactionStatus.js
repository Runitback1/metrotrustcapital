export const getReceiptStatus = (status) => {
  const normalizedStatus = String(status || "completed").trim().toLowerCase();

  if (normalizedStatus.includes("reject")) return "Rejected";
  if (normalizedStatus.includes("pending")) return "Pending";
  return "Completed";
};