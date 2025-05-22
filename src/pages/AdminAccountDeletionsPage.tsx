
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import SteamLoader from '@/components/SteamLoader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { InfoIcon, HelpCircleIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from '@/components/ui/tooltip';
import AdminLayout from '@/layouts/AdminLayout';

type AccountDeletion = {
  id: string;
  user_id: string;
  deleted_at: string;
  username: string | null;
  feedback: string | null;
  reason: string | null;
  metadata: any;
};

const getReasonLabel = (reasonValue: string) => {
  const reasons: Record<string, string> = {
    'not_useful': 'Not useful',
    'too_complex': 'Too complex',
    'found_alternative': 'Found alternative',
    'privacy_concerns': 'Privacy concerns',
    'dont_use_enough': "Don't use enough",
    'bugs': 'Too many bugs',
    'other': 'Other reason'
  };
  
  return reasons[reasonValue] || reasonValue;
};

const AdminAccountDeletionsPage = () => {
  const { data: deletions, isLoading, error } = useQuery({
    queryKey: ['account-deletions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('account_deletions')
        .select('*')
        .order('deleted_at', { ascending: false });
      
      if (error) throw error;
      return data as AccountDeletion[];
    },
  });

  if (isLoading) {
    return (
      <AdminLayout requiredRole="admin">
        <div className="container mx-auto px-4 py-24 flex justify-center">
          <SteamLoader message="Loading account deletion data..." size="md" variant="secondary" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout requiredRole="admin">
        <div className="container mx-auto px-4 py-24 text-center">
          <h1 className="text-2xl font-bold mb-4 text-unplayed-red">Error</h1>
          <p className="text-gray-400">Failed to load account deletion data.</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout requiredRole="admin">
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Account Deletions</h1>
          <p className="text-gray-400">
            View feedback and analytics for users who have deleted their accounts.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Account Deletions</CardTitle>
            <CardDescription>
              {deletions?.length === 0
                ? "No account deletions recorded yet."
                : `${deletions?.length || 0} account deletion${deletions?.length !== 1 ? 's' : ''} recorded.`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {deletions && deletions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Feedback</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletions.map((deletion) => (
                    <TableRow key={deletion.id}>
                      <TableCell className="font-mono">
                        {format(new Date(deletion.deleted_at), 'yyyy-MM-dd HH:mm')}
                      </TableCell>
                      <TableCell>{deletion.username || 'Unknown'}</TableCell>
                      <TableCell>
                        {deletion.reason ? (
                          <Badge variant="outline">
                            {getReasonLabel(deletion.reason)}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">Not provided</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {deletion.feedback ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center cursor-help">
                                  <Badge variant="secondary" className="mr-2">View</Badge>
                                  <InfoIcon className="h-4 w-4 text-unplayed-mint" />
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-gray-800 text-white border border-gray-700">
                                <p className="text-sm">{deletion.feedback}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-gray-500">Not provided</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <HelpCircleIcon className="h-12 w-12 text-gray-500 mb-4" />
                <p className="text-gray-500 text-center">No account deletions have been recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAccountDeletionsPage;
