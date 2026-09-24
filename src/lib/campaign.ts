// Time-boxed sales campaign config, shared by the Campaign tab tracker
// (PlanTracker) and the Today cockpit's stat strip.
export interface CampaignConfig {
  label: string;
  targetBottles: number;
  /** Optional recruitment goal; omit to hide the Field Team row/target. */
  targetFieldTeam?: number;
  start: string; // YYYY-MM-DD — orders from this date count toward the target
  end: string; // YYYY-MM-DD
}

// No campaign is running right now. To run one, replace null with a config, e.g.:
//   { label: "Summer campaign", targetBottles: 150, targetFieldTeam: 10,
//     start: "2026-12-01", end: "2027-01-31" }
// The Campaign tab tracker and the Today cockpit tile reappear automatically.
export const ACTIVE_CAMPAIGN: CampaignConfig | null = null;
