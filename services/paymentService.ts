import { apiClient } from './apiClient';
import { Transaction } from '../types';

const mapTransaction = (t: any): Transaction => ({
  id: t.id,
  userId: t.user_id,
  userEmail: t.user_email,
  userName: t.user_name,
  totalAmount: Number(t.total_amount),
  status: t.status,
  proofUrl: t.proof_url,
  createdAt: t.created_at,
  items: (t.items || []).map((ti: any) => ({
    id: ti.id,
    itemId: ti.item_id,
    itemType: ti.item_type,
    title: ti.title,
    price: Number(ti.price),
  })),
});

export const paymentService = {
  async createTransaction(
    _userId: string,
    items: { id: string; type: 'course' | 'bundle'; title: string; price: number }[],
    totalAmount: number,
    proofFile: File,
  ): Promise<Transaction> {
    // 1. Upload proof image first via asset upload
    const proofForm = new FormData();
    proofForm.append('file', proofFile);
    const uploaded = await apiClient.upload<{ asset: any }>('/assets/upload', proofForm);
    const proofUrl = uploaded.asset?.file_url;

    // 2. Create transaction
    const data = await apiClient.post<{ transaction: any }>('/payments', {
      totalAmount,
      proofUrl,
      items: items.map(i => ({
        itemId: i.id,
        itemType: i.type,
        title: i.title,
        price: i.price,
      })),
    });
    return mapTransaction(data.transaction);
  },

  async getPendingTransactions(): Promise<Transaction[]> {
    const data = await apiClient.get<{ transactions: any[] }>('/payments?status=pending');
    return (data.transactions || []).map(mapTransaction);
  },

  async getUserTransactions(_userId: string): Promise<Transaction[]> {
    const data = await apiClient.get<{ transactions: any[] }>('/payments/my');
    return (data.transactions || []).map(mapTransaction);
  },

  async getVerifiedTransactions(): Promise<Transaction[]> {
    const data = await apiClient.get<{ transactions: any[] }>('/payments?status=verified');
    return (data.transactions || []).map(mapTransaction);
  },

  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      const data = await apiClient.get<{ transaction: any }>(`/payments/${transactionId}`);
      return data.transaction ? mapTransaction(data.transaction) : null;
    } catch {
      return null;
    }
  },

  async verifyTransaction(transactionId: string, status: 'verified' | 'rejected'): Promise<void> {
    await apiClient.patch(`/payments/${transactionId}/verify`, { status });
  },
};
