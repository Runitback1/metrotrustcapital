export const getTransactionDescription = (description) => {
  if (String(description || "").trim().toLowerCase() === "admin initiated transfer") {
    return "Automated account debit";
  }

  return description;
};