
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

/**
 * Represents a single statistic item to be displayed in the AdminStatsCard
 */
export interface StatItem {
  /** Unique key for the stat item */
  key: string;
  /** Label to display */
  label: string;
  /** Value of the statistic (string or number) */
  value: string | number;
}

/**
 * Props for the AdminStatsCard component
 */
interface AdminStatsCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Optional icon to display next to the title */
  icon?: React.ReactNode;
  /** Statistics to display in the card */
  stats: StatItem[];
  /** Handler for refreshing statistics */
  onRefresh?: () => void;
  /** Whether statistics are currently loading */
  isLoading?: boolean;
  /** Optional content to display in the footer instead of the refresh button */
  footerContent?: React.ReactNode;
}

/**
 * Reusable card component for displaying admin statistics
 * 
 * Displays a collection of statistics in a clean table format with optional
 * refresh functionality and loading state.
 */
const AdminStatsCard: React.FC<AdminStatsCardProps> = ({
  title,
  description,
  icon,
  stats,
  onRefresh,
  isLoading = false,
  footerContent,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary/70" />
            </div>
          ) : (
            <Table>
              <TableBody>
                {stats.map((stat) => (
                  <TableRow key={stat.key}>
                    <TableCell className="font-medium">{stat.label}</TableCell>
                    <TableCell className="text-right">{stat.value}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </CardContent>
      {(onRefresh || footerContent) && (
        <CardFooter>
          {onRefresh ? (
            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="w-full"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Statistics
            </Button>
          ) : footerContent}
        </CardFooter>
      )}
    </Card>
  );
};

export default AdminStatsCard;
