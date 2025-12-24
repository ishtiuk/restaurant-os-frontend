import { apiClient } from "@/lib/api";

export interface FinanceSummaryResponse {
  total_income: number;
  total_expense: number;
  net_profit: number;
  cash_on_hand: number;
  bank_balance: number;
  mfs_balance: number;
  pending_transfers: number;
  pending_mfs_transfers: number;
  period_start: string;
  period_end: string;
}

export interface TransactionResponse {
  id: string;
  type: "income" | "expense";
  source_type: string;
  source_id: string;
  description: string;
  amount: number;
  payment_method: string;
  status: string;
  date: string;
  created_at: string;
}

export interface BankAccountResponse {
  id: string;
  name: string;
  account_number: string;
  account_type: string;
  branch: string | null;
  opening_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BankBalanceResponse {
  balance: number;
}

export interface BankTransactionResponse {
  id: string;
  bank_account_id: string;
  type: "deposit" | "withdrawal";
  amount: number;
  description: string | null;
  reference_no: string | null;
  balance_after: number;
  date: string;
  created_at: string;
  created_by: string | null;
}

export interface ExpenseResponse {
  id: string;
  category: string;
  amount: number;
  description: string | null;
  payment_method: string;
  bank_account_id: string | null;
  mfs_account_id: string | null;
  date: string;
  created_at: string;
  created_by: string | null;
}

export interface CashTransferResponse {
  id: string;
  to_bank_id: string;
  amount: number;
  reference: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export interface ExpenseCreate {
  category: string;
  amount: number;
  description?: string;
  payment_method: string;
  bank_account_id?: string;
  mfs_account_id?: string;
  date?: string;
}

export interface CashTransferCreate {
  to_bank_id: string;
  amount: number;
  reference?: string;
  notes?: string;
}

export interface BankAccountCreate {
  name: string;
  account_number: string;
  account_type: "current" | "savings";
  branch?: string;
  opening_balance?: number;
}

export interface BankAccountUpdate {
  name?: string;
  account_number?: string;
  account_type?: "current" | "savings";
  branch?: string;
  is_active?: boolean;
}

export interface CashTransferUpdate {
  status?: "pending" | "completed" | "cancelled";
}

export interface MfsAccountResponse {
  id: string;
  provider: "bkash" | "nagad" | "rocket";
  account_number: string;
  account_name: string | null;
  opening_balance: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface MfsBalanceResponse {
  balance: number;
}

export interface MfsTransactionResponse {
  id: string;
  mfs_account_id: string;
  type: "deposit" | "withdrawal" | "transfer_out";
  amount: number;
  description: string | null;
  reference_no: string | null;
  balance_after: number;
  date: string;
  created_at: string;
  created_by: string | null;
}

export interface MfsTransferResponse {
  id: string;
  from_mfs_id: string;
  to_bank_id: string;
  amount: number;
  reference: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  completed_at: string | null;
  created_by: string | null;
}

export interface MfsAccountCreate {
  provider: "bkash" | "nagad" | "rocket";
  account_number: string;
  account_name?: string;
  opening_balance?: number;
}

export interface MfsAccountUpdate {
  account_number?: string;
  account_name?: string;
  is_active?: boolean;
}

export interface MfsTransferCreate {
  from_mfs_id: string;
  to_bank_id: string;
  amount: number;
  reference?: string;
  notes?: string;
}

export interface MfsTransferUpdate {
  status?: "pending" | "completed" | "cancelled";
}

export const financeApi = {
  // Finance Summary
  getSummary(startDate?: string, endDate?: string): Promise<FinanceSummaryResponse> {
    const params = new URLSearchParams();
    if (startDate) params.append("start_date", startDate);
    if (endDate) params.append("end_date", endDate);
    const query = params.toString();
    return apiClient.get<FinanceSummaryResponse>(`/finance/summary${query ? `?${query}` : ""}`);
  },

  // Unified Transactions
  getTransactions(params?: {
    start_date?: string;
    end_date?: string;
    transaction_type?: "income" | "expense";
    payment_method?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<TransactionResponse[]> {
    const searchParams = new URLSearchParams();
    if (params?.start_date) searchParams.append("start_date", params.start_date);
    if (params?.end_date) searchParams.append("end_date", params.end_date);
    if (params?.transaction_type) searchParams.append("transaction_type", params.transaction_type);
    if (params?.payment_method) searchParams.append("payment_method", params.payment_method);
    if (params?.status) searchParams.append("status", params.status);
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));
    const query = searchParams.toString();
    return apiClient.get<TransactionResponse[]>(`/finance/transactions${query ? `?${query}` : ""}`);
  },

  // Bank Accounts
  createBankAccount(data: BankAccountCreate): Promise<BankAccountResponse> {
    return apiClient.post<BankAccountResponse>("/finance/banks", data);
  },

  listBankAccounts(isActive?: boolean): Promise<BankAccountResponse[]> {
    const params = new URLSearchParams();
    if (isActive !== undefined) params.append("is_active", String(isActive));
    const query = params.toString();
    return apiClient.get<BankAccountResponse[]>(`/finance/banks${query ? `?${query}` : ""}`);
  },

  getBankAccount(bankId: string): Promise<BankAccountResponse> {
    return apiClient.get<BankAccountResponse>(`/finance/banks/${bankId}`);
  },

  getBankBalance(bankId: string): Promise<BankBalanceResponse> {
    return apiClient.get<BankBalanceResponse>(`/finance/banks/${bankId}/balance`);
  },

  getBankTransactions(bankId: string, limit?: number, offset?: number): Promise<BankTransactionResponse[]> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", String(limit));
    if (offset) params.append("offset", String(offset));
    const query = params.toString();
    return apiClient.get<BankTransactionResponse[]>(`/finance/banks/${bankId}/transactions${query ? `?${query}` : ""}`);
  },

  updateBankAccount(bankId: string, data: BankAccountUpdate): Promise<BankAccountResponse> {
    return apiClient.patch<BankAccountResponse>(`/finance/banks/${bankId}`, data);
  },

  deleteBankAccount(bankId: string): Promise<void> {
    return apiClient.delete<void>(`/finance/banks/${bankId}`);
  },

  // Expenses
  createExpense(data: ExpenseCreate): Promise<ExpenseResponse> {
    return apiClient.post<ExpenseResponse>("/finance/expenses", data);
  },

  listExpenses(params?: {
    category?: string;
    payment_method?: string;
    limit?: number;
    offset?: number;
  }): Promise<ExpenseResponse[]> {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.append("category", params.category);
    if (params?.payment_method) searchParams.append("payment_method", params.payment_method);
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));
    const query = searchParams.toString();
    return apiClient.get<ExpenseResponse[]>(`/finance/expenses${query ? `?${query}` : ""}`);
  },

  getExpense(expenseId: string): Promise<ExpenseResponse> {
    return apiClient.get<ExpenseResponse>(`/finance/expenses/${expenseId}`);
  },

  updateExpense(expenseId: string, data: Partial<ExpenseCreate>): Promise<ExpenseResponse> {
    return apiClient.patch<ExpenseResponse>(`/finance/expenses/${expenseId}`, data);
  },

  deleteExpense(expenseId: string): Promise<void> {
    return apiClient.delete<void>(`/finance/expenses/${expenseId}`);
  },

  // Cash Transfers
  createCashTransfer(data: CashTransferCreate): Promise<CashTransferResponse> {
    return apiClient.post<CashTransferResponse>("/finance/transfers", data);
  },

  listCashTransfers(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<CashTransferResponse[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));
    const query = searchParams.toString();
    return apiClient.get<CashTransferResponse[]>(`/finance/transfers${query ? `?${query}` : ""}`);
  },

  getCashTransfer(transferId: string): Promise<CashTransferResponse> {
    return apiClient.get<CashTransferResponse>(`/finance/transfers/${transferId}`);
  },

  updateCashTransfer(transferId: string, data: CashTransferUpdate): Promise<CashTransferResponse> {
    return apiClient.patch<CashTransferResponse>(`/finance/transfers/${transferId}`, data);
  },

  // MFS Accounts
  createMfsAccount(data: MfsAccountCreate): Promise<MfsAccountResponse> {
    return apiClient.post<MfsAccountResponse>("/finance/mfs", data);
  },

  listMfsAccounts(provider?: string, isActive?: boolean): Promise<MfsAccountResponse[]> {
    const params = new URLSearchParams();
    if (provider) params.append("provider", provider);
    if (isActive !== undefined) params.append("is_active", String(isActive));
    const query = params.toString();
    return apiClient.get<MfsAccountResponse[]>(`/finance/mfs${query ? `?${query}` : ""}`);
  },

  getMfsAccount(mfsId: string): Promise<MfsAccountResponse> {
    return apiClient.get<MfsAccountResponse>(`/finance/mfs/${mfsId}`);
  },

  getMfsBalance(mfsId: string): Promise<MfsBalanceResponse> {
    return apiClient.get<MfsBalanceResponse>(`/finance/mfs/${mfsId}/balance`);
  },

  getMfsTransactions(mfsId: string, limit?: number, offset?: number): Promise<MfsTransactionResponse[]> {
    const params = new URLSearchParams();
    if (limit) params.append("limit", String(limit));
    if (offset) params.append("offset", String(offset));
    const query = params.toString();
    return apiClient.get<MfsTransactionResponse[]>(`/finance/mfs/${mfsId}/transactions${query ? `?${query}` : ""}`);
  },

  updateMfsAccount(mfsId: string, data: MfsAccountUpdate): Promise<MfsAccountResponse> {
    return apiClient.patch<MfsAccountResponse>(`/finance/mfs/${mfsId}`, data);
  },

  deleteMfsAccount(mfsId: string): Promise<void> {
    return apiClient.delete<void>(`/finance/mfs/${mfsId}`);
  },

  // MFS Transfers
  createMfsTransfer(data: MfsTransferCreate): Promise<MfsTransferResponse> {
    return apiClient.post<MfsTransferResponse>("/finance/mfs-transfers", data);
  },

  listMfsTransfers(params?: {
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<MfsTransferResponse[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.append("status", params.status);
    if (params?.limit) searchParams.append("limit", String(params.limit));
    if (params?.offset) searchParams.append("offset", String(params.offset));
    const query = searchParams.toString();
    return apiClient.get<MfsTransferResponse[]>(`/finance/mfs-transfers${query ? `?${query}` : ""}`);
  },

  getMfsTransfer(transferId: string): Promise<MfsTransferResponse> {
    return apiClient.get<MfsTransferResponse>(`/finance/mfs-transfers/${transferId}`);
  },

  updateMfsTransfer(transferId: string, data: MfsTransferUpdate): Promise<MfsTransferResponse> {
    return apiClient.patch<MfsTransferResponse>(`/finance/mfs-transfers/${transferId}`, data);
  },
};

