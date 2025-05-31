
import { toast } from "@/hooks/use-toast";

export const showMetricsCalculationFeedback = (gameCount: number) => {
  if (gameCount >= 500) {
    toast({
      title: "Processing Large Library",
      description: `Calculating enhanced dust scores for ${gameCount} games. This may take a moment...`,
      duration: 5000,
    });
  } else if (gameCount >= 100) {
    toast({
      title: "Calculating Dust Scores",
      description: `Processing ${gameCount} games with enhanced scoring...`,
      duration: 3000,
    });
  } else {
    toast({
      title: "Calculating Dust Scores",
      description: "Updating your library with enhanced scoring...",
      duration: 2000,
    });
  }
};

export const showMetricsCompleteFeedback = (gameCount: number, dustBreakdowns: number) => {
  toast({
    title: "Enhanced Scoring Complete!",
    description: `Processed ${gameCount} games with new 5-factor dust scoring. ${dustBreakdowns} detailed breakdowns created.`,
    duration: 4000,
  });
};
