/**
 * Enhanced Sale Information Item structure with comprehensive token sale details
 * Based on documentation content and sales.json data
 */
export interface SaleInformationItem {
  // Basic Sale Information
  name: string;
  status: 'CREATED' | 'OPEN' | 'CLOSED' | 'CANCELLED';
  currency: string;
  
  // Token Quantities
  initialTokenQuantity: number;
  availableTokenQuantity: number;
  minimumTokenBuyPerUser: number;
  maximumTokenBuyPerUser: number | null;
  
  // Sale Timeline
  saleStartDate: string; // ISO 8601 date string
  saleClosingDate: string; // ISO 8601 date string
  
  // Token Details
  tokenName: string;
  tokenSymbol: string;
  tokenPricePerUnit: string;
  tokenTotalSupply: string;
  tokenContractAddress: string | null;
  tokenContractChainId: number | null;
  
  // Wallet Information
  toWalletsAddress: string;
  
  // Compliance & Legal
  saftCheckbox: boolean;
  requiresKYC?: boolean;
  
  // Financial Information (from documentation)
  raiseAmount: number; // Total raise amount in USD
  valuation: number; // Company valuation at this round
  allocationPercentage: number; // Percentage of total supply allocated
  
  // Vesting Schedule (from documentation)
  vestingSchedule: {
    cliff: string; // e.g., "3m", "1m", "0m"
    vesting: string; // e.g., "18m", "15m", "6m", "12m"
    description: string; // Human-readable description
  };
  
  // TGE (Token Generation Event) Information
  tgeUnlock: number; // Percentage unlocked at TGE (0-100)
  
  // Marketing & Description
  description: string; // Round description
  eligibility: string; // Who can participate
  benefits: string[]; // List of benefits for participants
  requirements: string[]; // List of requirements for participation
  
  // Optional Fields for Enhanced Information
  catchPhrase?: string;
  bannerId?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  
  // Additional Documentation Fields
  documentation?: {
    whitepaper?: string;
    pitchDeck?: string;
    legalDocuments?: string[];
    termsOfService?: string;
    privacyPolicy?: string;
  };
  
  // Token Utility Information (from documentation)
  tokenUtility?: {
    governanceRights: boolean;
    stakingRewards: boolean;
    premiumFeatures: boolean;
    nftMarketplace: boolean;
    revenueSharing: boolean;
  };
  
  // Security & Compliance (from documentation)
  security?: {
    multiSignatureWallets: boolean;
    timeLockedContracts: boolean;
    thirdPartyAudits: boolean;
    emergencyPauseMechanisms: boolean;
    kycAmlProcedures: boolean;
    transparentReporting: boolean;
    communityGovernance: boolean;
  };
  
  // Roadmap Information (from documentation)
  roadmap?: {
    phase: string; // e.g., "Q3 2025", "Q4 2025"
    milestones: string[];
    targetRevenue?: number;
    userAcquisitionTarget?: number;
  };
  
  // Contact & Support
  contact?: {
    email?: string;
    telegram?: string;
    discord?: string;
    twitter?: string;
    website?: string;
  };
}

/**
 * Vesting schedule types for better type safety
 */
export type VestingPeriod = '1m' | '3m' | '6m' | '12m' | '15m' | '18m' | '24m' | '36m';

/**
 * Sale status types
 */
export type SaleStatus = 'CREATED' | 'OPEN' | 'CLOSED' | 'CANCELLED';

/**
 * Round types for categorization
 */
export type SaleRound = 'Pre-Seed' | 'Seed' | 'Private' | 'KOL' | 'Public';

/**
 * Currency types
 */
export type Currency = 'USD' | 'EUR' | 'GBP' | 'ETH' | 'BTC';

/**
 * Enhanced sale information with additional metadata
 */
export interface EnhancedSaleInformation extends SaleInformationItem {
  // Additional metadata
  metadata: {
    roundType: SaleRound;
    isAccreditedInvestorOnly: boolean;
    hasVestingSchedule: boolean;
    requiresSAFT: boolean;
    isPublicRound: boolean;
    totalSupplyPercentage: number;
    marketCapAtValuation: number;
  };
  
  // Performance metrics
  performance?: {
    tokensSold: number;
    percentageSold: number;
    averageInvestment: number;
    numberOfInvestors: number;
    timeToCompletion?: string;
  };
  
  // Legal and compliance
  legal?: {
    jurisdiction: string;
    regulatoryCompliance: string[];
    taxImplications: string[];
    legalDocuments: string[];
  };
} 