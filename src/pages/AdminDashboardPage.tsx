
import React, { useState } from 'react';
import { Shield, Bug, UserMinus, ActivitySquare, Database, ChevronDown, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuthPermission } from '@/hooks/use-auth-permission';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AdminLayout from '@/layouts/AdminLayout';
import { DatabaseCleanupCard } from '@/components/admin/DatabaseCleanupCard';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';

const AdminDashboardPage = () => {
  const { isAdmin } = useAuthPermission();
  const [utilitiesOpen, setUtilitiesOpen] = useState(false);

  // Lightweight live stats
  const { data: queuePending } = useQuery({
    queryKey: ['admin-dash-queue-pending'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('get-queue-stats-by-status');
      const pending = data?.find?.((s: any) => s.status === 'pending');
      return pending?.count ?? 0;
    },
    staleTime: 60_000,
    enabled: isAdmin,
  });

  const { data: deletionCount } = useQuery({
    queryKey: ['admin-dash-deletion-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('account_deletions')
        .select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
    staleTime: 60_000,
    enabled: isAdmin,
  });

  const adminTools = [
    {
      title: 'Queue Manager',
      description: 'Steam game processing queue, batch tools, and data pipeline.',
      icon: <ActivitySquare className="h-8 w-8 text-blue-400" />,
      path: '/admin/queue-manager',
      color: 'bg-gradient-to-br from-blue-900/40 to-blue-700/20',
      borderColor: 'border-blue-400/30',
      highlight: true,
      stat: queuePending != null ? `${queuePending} pending` : undefined,
    },
    {
      title: 'Authentication Debug',
      description: 'Debug authentication issues and session management.',
      icon: <Bug className="h-8 w-8 text-unplayed-mint" />,
      path: '/admin/auth-debug',
      color: 'bg-gradient-to-br from-emerald-900/40 to-emerald-700/20',
      borderColor: 'border-unplayed-mint/30',
    },
    {
      title: 'Admin Support',
      description: 'Manage support requests and user assistance.',
      icon: <Shield className="h-8 w-8 text-unplayed-pink" />,
      path: '/admin/support',
      color: 'bg-gradient-to-br from-pink-900/40 to-pink-700/20',
      borderColor: 'border-unplayed-pink/30',
    },
    {
      title: 'Account Deletions',
      description: 'View analytics and feedback from deleted accounts.',
      icon: <UserMinus className="h-8 w-8 text-unplayed-red" />,
      path: '/admin/account-deletions',
      color: 'bg-gradient-to-br from-red-900/40 to-red-700/20',
      borderColor: 'border-unplayed-red/30',
      stat: deletionCount != null ? `${deletionCount} total` : undefined,
    },
  ];

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Central hub for all administrative tools and controls.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {adminTools.map((tool) => (
            <Link to={tool.path} key={tool.title} className="block">
              <Card className={`h-full transition-all hover:scale-103 hover:shadow-lg ${tool.color} border ${tool.borderColor} ${tool.highlight ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-transparent' : ''}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl">{tool.title}</CardTitle>
                    <div className="p-2 rounded-md bg-black/20">{tool.icon}</div>
                  </div>
                  <CardDescription>{tool.description}</CardDescription>
                </CardHeader>
                {tool.stat && (
                  <CardContent className="pt-0">
                    <Badge variant="secondary" className="text-xs">{tool.stat}</Badge>
                  </CardContent>
                )}
                <CardFooter className="pt-2 border-t border-border/50">
                  <span className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Access Tool →
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>

        {/* Quick Utilities Section - Collapsible */}
        <div className="mt-12">
          <Collapsible open={utilitiesOpen} onOpenChange={setUtilitiesOpen}>
            <Card className="bg-gradient-to-br from-gray-900/40 to-gray-700/10 border border-border">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer select-none hover:bg-white/5 transition-colors rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center">
                      <Database className="mr-2 h-5 w-5" />
                      Quick Utilities
                    </CardTitle>
                    <ChevronDown
                      className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${utilitiesOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                  <CardDescription>One-off maintenance tools for data cleanup.</CardDescription>
                  {!utilitiesOpen && (
                    <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>Use when orphaned or stale data needs to be cleaned up.</span>
                    </div>
                  )}
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent>
                  <DatabaseCleanupCard />
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
