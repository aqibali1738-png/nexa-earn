import {
  User,
  Wallet,
  Transaction,
  Deposit,
  Withdrawal,
  Task,
  SpinItem,
  NotificationItem,
  AppSettings,
  AdminStats,
  AuditLog,
} from '../types';

const TOKEN_KEY = 'nexa_auth_token';

class ApiClient {
  private token: string | null = null;

  constructor() {
    try {
      this.token = typeof window !== 'undefined'
        ? (sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY))
        : null;
    } catch {
      this.token = null;
    }
  }

  setToken(token: string | null) {
    this.token = token;
    try {
      if (token) {
        sessionStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        sessionStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch {
      // Ignore storage restrictions if blocked
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      defaultHeaders['Authorization'] = `Bearer ${this.token}`;
    }

    // If options.body is FormData, don't set Content-Type so browser sets boundary
    if (options.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(options.headers as Record<string, string>),
      },
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({ error: 'Invalid response from server' }));

    if (!response.ok) {
      if (response.status === 401) {
        this.setToken(null);
      }
      throw new Error(data.error || 'Network request failed');
    }

    return data;
  }

  // Auth
  async register(payload: {
    full_name: string;
    email: string;
    password: string;
    confirm_password: string;
    whatsapp_number: string;
    referral_code?: string;
  }): Promise<{ user: User; wallet: Wallet; token: string }> {
    const res = await this.request<{ user: User; wallet: Wallet; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async login(payload: {
    email: string;
    password: string;
  }): Promise<{ user: User; wallet: Wallet; token: string; role: string; user_type: string }> {
    const res = await this.request<{ user: User; wallet: Wallet; token: string; role: string; user_type: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async getTestCredentials(): Promise<{
    admin: { email: string; password: string };
    user: { email: string; password: string };
  }> {
    return this.request('/api/auth/test-credentials');
  }

  async getCurrentUser(): Promise<{ user: User; wallet: Wallet; unreadNotifications: number }> {
    return this.request('/api/auth/me');
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      return await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  // Wallet & Transactions
  async getWallet(): Promise<{ wallet: Wallet; transactions: Transaction[] }> {
    return this.request('/api/wallet');
  }

  // Spins
  async executeSpin(): Promise<{
    success: boolean;
    displayedReward: number;
    actualCreditedReward: number;
    wallet: Wallet;
    spinRecord: SpinItem;
  }> {
    return this.request('/api/spin', { method: 'POST' });
  }

  async getSpinHistory(): Promise<{ history: SpinItem[] }> {
    return this.request('/api/spins/history');
  }

  // Deposits
  async submitDeposit(payload: {
    method: 'easypaisa' | 'jazzcash';
    account_holder: string;
    account_number: string;
    trx_id: string;
    amount: number;
  }): Promise<{ success: boolean; deposit: Deposit }> {
    return this.request('/api/deposit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDeposits(): Promise<{ deposits: Deposit[] }> {
    return this.request('/api/deposits');
  }

  // Withdrawals
  async submitWithdrawal(payload: {
    amount: number;
    method: 'easypaisa' | 'jazzcash';
    account_name: string;
    account_number: string;
  }): Promise<{ success: boolean; withdrawal: Withdrawal; wallet: Wallet }> {
    return this.request('/api/withdraw', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getWithdrawals(): Promise<{ withdrawals: Withdrawal[] }> {
    return this.request('/api/withdrawals');
  }

  // Referrals
  async getReferrals(): Promise<{
    referralCode: string;
    totalCount: number;
    approvedCount: number;
    requiredForWithdrawal: number;
    list: Array<{
      id: string;
      uid: string;
      full_name: string;
      status: string;
      user_type: string;
      verification_status: string;
      created_at: string;
    }>;
  }> {
    return this.request('/api/referrals');
  }

  // Tasks
  async getTasks(): Promise<{ hasAccess: boolean; tasks: Task[]; approvedReferrals: number }> {
    return this.request('/api/tasks');
  }

  async executeTaskAction(taskId: string): Promise<{
    success: boolean;
    pointsGained: number;
    rewardEarned: number;
    currentPoints: number;
    currentLevel: number;
    levelUnlocked: boolean;
    completionBonusAwarded: boolean;
    wallet: Wallet;
  }> {
    return this.request(`/api/tasks/${taskId}/action`, { method: 'POST' });
  }

  // Verification
  async submitVerification(payload: {
    whatsapp_number: string;
    instagram_uid_sent: boolean;
  }): Promise<{ success: boolean; message: string; user: User }> {
    return this.request('/api/verification', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Profile
  async updateProfile(payload: { full_name?: string }): Promise<{ success: boolean; user: User }> {
    return this.request('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async uploadAvatar(formData: FormData): Promise<{ success: boolean; avatar_url: string; user: User }> {
    return this.request('/api/user/profile-picture', {
      method: 'POST',
      body: formData,
    });
  }

  // Notifications
  async getNotifications(): Promise<{ notifications: NotificationItem[] }> {
    return this.request('/api/notifications');
  }

  async markNotificationsRead(): Promise<{ success: boolean }> {
    return this.request('/api/notifications/read', { method: 'POST' });
  }

  // Settings
  async getSettings(): Promise<{ settings: AppSettings }> {
    return this.request('/api/settings');
  }

  // Admin APIs
  async getAdminStats(): Promise<AdminStats> {
    return this.request('/api/admin/stats');
  }

  async getAdminUsers(query?: string): Promise<{ users: Array<User & { wallet?: Wallet; referralCount: number; approvedReferralCount: number }> }> {
    return this.request(`/api/admin/users${query ? `?q=${encodeURIComponent(query)}` : ''}`);
  }

  async decideVerification(payload: {
    uid: string;
    decision: 'approved' | 'rejected';
    notes?: string;
  }): Promise<{ success: boolean; user: User }> {
    return this.request('/api/admin/verification/decide', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdminDeposits(): Promise<{ deposits: Deposit[] }> {
    return this.request('/api/admin/deposits');
  }

  async decideDeposit(payload: {
    deposit_id: string;
    decision: 'approved' | 'rejected';
    notes?: string;
  }): Promise<{ success: boolean; deposit: Deposit }> {
    return this.request('/api/admin/deposits/decide', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdminWithdrawals(): Promise<{ withdrawals: Withdrawal[] }> {
    return this.request('/api/admin/withdrawals');
  }

  async decideWithdrawal(payload: {
    withdrawal_id: string;
    decision: 'approved' | 'rejected';
    notes?: string;
  }): Promise<{ success: boolean; withdrawal: Withdrawal }> {
    return this.request('/api/admin/withdrawals/decide', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async creditWalletManual(payload: {
    uid: string;
    amount: number;
    reason: string;
  }): Promise<{ success: boolean; message: string; wallet: Wallet }> {
    return this.request('/api/admin/wallet-credit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async giveTaskPointsManual(payload: {
    uid: string;
    task_id: string;
    level: number;
    points: number;
    reason: string;
  }): Promise<{ success: boolean; message: string; progress: any }> {
    return this.request('/api/admin/task-points', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getAdminTasks(): Promise<{ tasks: Task[] }> {
    return this.request('/api/admin/tasks');
  }

  async saveAdminTask(task: Partial<Task>): Promise<{ success: boolean; task: Task }> {
    return this.request('/api/admin/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    });
  }

  async restartTaskTimer(taskId: string, timer_seconds?: number): Promise<{ success: boolean; task: Task }> {
    return this.request(`/api/admin/tasks/${taskId}/timer`, {
      method: 'POST',
      body: JSON.stringify({ restart: true, timer_seconds }),
    });
  }

  async getAdminSettings(): Promise<{ settings: AppSettings }> {
    return this.request('/api/admin/settings');
  }

  async updateAdminSettings(settings: Partial<AppSettings>): Promise<{ success: boolean; settings: AppSettings }> {
    return this.request('/api/admin/settings', {
      method: 'POST',
      body: JSON.stringify(settings),
    });
  }

  async getAdminAuditLogs(): Promise<{ logs: AuditLog[] }> {
    return this.request('/api/admin/audit-logs');
  }
}

export const api = new ApiClient();
