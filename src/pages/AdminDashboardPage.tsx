
import React from 'react';
import { Shield, Bug, UserMinus, ActivitySquare, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuthPermission } from '@/hooks/use-auth-permission';
import AdminLayout from '@/layouts/AdminLayout';

const AdminDashboardPage = () => {
  const { isAdmin } = useAuthPermission();

  // Admin tools configuration
  const adminTools = [
    {
      title: 'Authentication Debug',
      description: 'Debug authentication issues and session management.',
      icon: <Bug className="h-8 w-8 text-unplayed-mint" />,
      path: '/auth-debug',
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
    },
    {
      title: 'Game Queue Manager',
      description: 'Advanced tools for managing the Steam game processing queue.',
      icon: <ActivitySquare className="h-8 w-8 text-blue-400" />,
      path: '/admin/queue-manager',
      color: 'bg-gradient-to-br from-blue-900/40 to-blue-700/20',
      borderColor: 'border-blue-400/30',
      highlight: true,
    },
  ];

  return (
    <AdminLayout requiredRole="admin">
      <div className="container mx-auto px-4 py-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">
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
                  <CardDescription>
                    {tool.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-16 flex items-center justify-center">
                    {/* Placeholder for potential stats or status indicators */}
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-gray-800">
                  <span className="text-sm text-gray-400 hover:text-white transition-colors">
                    Access Tool →
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboardPage;
