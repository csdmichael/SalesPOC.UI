export interface DealStrategyContext {
  customerId: number;
  region: string;
  repId: string;
  userRole: string;
}

export interface DealStrategyResult {
  riskCard: string;
  crossSellCard: string;
  recommendedActions: string[];
  executiveSummary: string;
  rawReply: string;
}
