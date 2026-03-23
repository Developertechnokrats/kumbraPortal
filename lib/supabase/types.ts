export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'OPS' | 'ADVISOR' | 'CLIENT' | 'AUDITOR';
export type AccountType = 'INDIVIDUAL' | 'JOINT' | 'CORPORATE';
export type KycStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type AssetClass = 'FIXED_INCOME' | 'MANAGED_FUND' | 'GOLD_CONTRACT';
export type PaymentFrequency = 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL';
export type HoldingStatus = 'ACTIVE' | 'MATURED' | 'SOLD' | 'CLOSED';
export type CashflowType = 'COUPON' | 'DIVIDEND' | 'MATURITY' | 'CAPITAL_RETURN';
export type TransactionType = 'DEPOSIT' | 'WITHDRAWAL' | 'COUPON' | 'DIVIDEND' | 'FEE' | 'FX_CONVERSION' | 'TRADE_EXECUTION' | 'CORPORATE_ACTION' | 'MATURITY';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
export type DocumentType = 'AGREEMENT' | 'CONTRACT_NOTE' | 'STATEMENT' | 'KYC' | 'OTHER';
export type DocumentStatus = 'AVAILABLE' | 'NEEDS_SIGNATURE' | 'SIGNED' | 'REJECTED';
export type ApplicationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type NotificationType = 'KYC_APPROVED' | 'KYC_REJECTED' | 'DOC_SIGNED' | 'DEPOSIT_CREDITED' | 'COUPON_UPCOMING' | 'MATURITY_UPCOMING' | 'WITHDRAWAL_PAID' | 'WITHDRAWAL_REJECTED';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          name: string;
          phone: string | null;
          country: string | null;
          locale: string;
          is_demo: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          role?: UserRole;
          name: string;
          phone?: string | null;
          country?: string | null;
          locale?: string;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          role?: UserRole;
          name?: string;
          phone?: string | null;
          country?: string | null;
          locale?: string;
          is_demo?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      clients: {
        Row: {
          id: string;
          user_id: string;
          advisor_id: string | null;
          account_type: AccountType;
          base_currency: string;
          risk_score: number | null;
          knowledge_json: Json;
          kyc_status: KycStatus;
          kyc_rejection_reason: string | null;
          kyc_documents_approved: boolean | null;
          bank_verified: boolean;
          country_of_residence: string | null;
          tax_residency: string | null;
          risk_profile: string | null;
          payment_reference_code: string | null;
          member_since: string | null;
          assigned_advisor_name: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          postcode: string | null;
          date_of_birth: string | null;
          date_of_birth_holder2: string | null;
          company_incorporation_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          advisor_id?: string | null;
          account_type?: AccountType;
          base_currency?: string;
          risk_score?: number | null;
          knowledge_json?: Json;
          kyc_status?: KycStatus;
          kyc_rejection_reason?: string | null;
          kyc_documents_approved?: boolean | null;
          bank_verified?: boolean;
          country_of_residence?: string | null;
          tax_residency?: string | null;
          risk_profile?: string | null;
          payment_reference_code?: string | null;
          member_since?: string | null;
          assigned_advisor_name?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postcode?: string | null;
          date_of_birth?: string | null;
          date_of_birth_holder2?: string | null;
          company_incorporation_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          advisor_id?: string | null;
          account_type?: AccountType;
          base_currency?: string;
          risk_score?: number | null;
          knowledge_json?: Json;
          kyc_status?: KycStatus;
          kyc_rejection_reason?: string | null;
          kyc_documents_approved?: boolean | null;
          bank_verified?: boolean;
          country_of_residence?: string | null;
          tax_residency?: string | null;
          risk_profile?: string | null;
          payment_reference_code?: string | null;
          member_since?: string | null;
          assigned_advisor_name?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          postcode?: string | null;
          date_of_birth?: string | null;
          date_of_birth_holder2?: string | null;
          company_incorporation_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      cash_balances: {
        Row: {
          id: string;
          client_id: string;
          currency: string;
          balance: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          currency: string;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          currency?: string;
          balance?: number;
          updated_at?: string;
        };
      };
      instruments: {
        Row: {
          id: string;
          asset_class: AssetClass;
          issuer_name: string;
          issuer_domain: string | null;
          symbol: string | null;
          isin: string | null;
          currency: string;
          metadata_json: Json;
          coupon_schedule_json: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          asset_class: AssetClass;
          issuer_name: string;
          issuer_domain?: string | null;
          symbol?: string | null;
          isin?: string | null;
          currency: string;
          metadata_json?: Json;
          coupon_schedule_json?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          asset_class?: AssetClass;
          issuer_name?: string;
          issuer_domain?: string | null;
          symbol?: string | null;
          isin?: string | null;
          currency?: string;
          metadata_json?: Json;
          coupon_schedule_json?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      holdings: {
        Row: {
          id: string;
          client_id: string;
          instrument_id: string;
          currency: string;
          face_or_units: number;
          price: number;
          cost_basis: number;
          current_value: number;
          accrued_interest: number;
          unrealised_pl: number;
          start_date: string;
          term_months: number;
          maturity_date: string | null;
          payment_frequency: PaymentFrequency | null;
          status: HoldingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          instrument_id: string;
          currency: string;
          face_or_units: number;
          price: number;
          cost_basis: number;
          current_value: number;
          accrued_interest?: number;
          unrealised_pl?: number;
          start_date: string;
          term_months: number;
          maturity_date?: string | null;
          payment_frequency?: PaymentFrequency | null;
          status?: HoldingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          instrument_id?: string;
          currency?: string;
          face_or_units?: number;
          price?: number;
          cost_basis?: number;
          current_value?: number;
          accrued_interest?: number;
          unrealised_pl?: number;
          start_date?: string;
          term_months?: number;
          maturity_date?: string | null;
          payment_frequency?: PaymentFrequency | null;
          status?: HoldingStatus;
          created_at?: string;
          updated_at?: string;
        };
      };
      cashflows: {
        Row: {
          id: string;
          holding_id: string;
          client_id: string;
          date: string;
          type: CashflowType;
          expected_amount: number;
          actual_amount: number | null;
          currency: string;
          paid: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          holding_id: string;
          client_id: string;
          date: string;
          type: CashflowType;
          expected_amount: number;
          actual_amount?: number | null;
          currency: string;
          paid?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          holding_id?: string;
          client_id?: string;
          date?: string;
          type?: CashflowType;
          expected_amount?: number;
          actual_amount?: number | null;
          currency?: string;
          paid?: boolean;
          created_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          client_id: string;
          holding_id: string | null;
          type: TransactionType;
          currency: string;
          amount: number;
          fx_rate: number | null;
          status: TransactionStatus;
          created_by: string | null;
          metadata_json: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          holding_id?: string | null;
          type: TransactionType;
          currency: string;
          amount: number;
          fx_rate?: number | null;
          status?: TransactionStatus;
          created_by?: string | null;
          metadata_json?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          holding_id?: string | null;
          type?: TransactionType;
          currency?: string;
          amount?: number;
          fx_rate?: number | null;
          status?: TransactionStatus;
          created_by?: string | null;
          metadata_json?: Json;
          created_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          type: DocumentType;
          title: string;
          file_url: string;
          file_size: number | null;
          status: DocumentStatus;
          requires_signature: boolean;
          esign_envelope_id: string | null;
          uploaded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          type: DocumentType;
          title: string;
          file_url: string;
          file_size?: number | null;
          status?: DocumentStatus;
          requires_signature?: boolean;
          esign_envelope_id?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          type?: DocumentType;
          title?: string;
          file_url?: string;
          file_size?: number | null;
          status?: DocumentStatus;
          requires_signature?: boolean;
          esign_envelope_id?: string | null;
          uploaded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      message_threads: {
        Row: {
          id: string;
          client_id: string;
          participants: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          participants: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          participants?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          thread_id: string;
          sender_id: string;
          body: string;
          attachments: Json[];
          read_by: string[];
          created_at: string;
        };
        Insert: {
          id?: string;
          thread_id: string;
          sender_id: string;
          body: string;
          attachments?: Json[];
          read_by?: string[];
          created_at?: string;
        };
        Update: {
          id?: string;
          thread_id?: string;
          sender_id?: string;
          body?: string;
          attachments?: Json[];
          read_by?: string[];
          created_at?: string;
        };
      };
      notifications: {
        Row: {
          id: string;
          type: NotificationType;
          client_id: string;
          data_json: Json;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: NotificationType;
          client_id: string;
          data_json?: Json;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: NotificationType;
          client_id?: string;
          data_json?: Json;
          read?: boolean;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      user_role: UserRole;
      account_type: AccountType;
      kyc_status: KycStatus;
      asset_class: AssetClass;
      payment_frequency: PaymentFrequency;
      holding_status: HoldingStatus;
      cashflow_type: CashflowType;
      transaction_type: TransactionType;
      transaction_status: TransactionStatus;
      document_type: DocumentType;
      document_status: DocumentStatus;
      application_status: ApplicationStatus;
      notification_type: NotificationType;
    };
  };
}
