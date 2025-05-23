
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export interface StatItem {
  label: string;
  value: string | number;
  key: string;
}

interface AdminStatsCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  stats: StatItem[];
  onRefresh?: () => void;
  isLoading?: boolean;
  showProgressBar?: boolean;
  progressValue?: number;
  footerContent?: React.ReactNode;
}

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
