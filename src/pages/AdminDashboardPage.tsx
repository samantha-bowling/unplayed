
import React from 'react';
import { Shield, Bug, Database } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';

const AdminDashboardPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.app_metadata?.roles?.includes('admin');

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
      title: 'Steam Data Management',
      description: 'View and manage Steam app data and processing.',
      icon: <Database className="h-8 w-8 text-unplayed-amber" />,
      path: '/admin/steam-data',
      color: 'bg-gradient-to-br from-amber-900/40 to-amber-700/20',
      borderColor: 'border-unplayed-amber/30',
    },
  ];

  // Redirect or show access denied for non-admins
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4 text-unplayed-red">Access Denied</h1>
        <p className="text-gray-400">You do not have permission to access this page.</p>
        <Link to="/" className="btn-primary mt-6 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
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
            <Card className={`h-full transition-all hover:scale-103 hover:shadow-lg ${tool.color} border ${tool.borderColor}`}>
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
  );
};

export default AdminDashboardPage;
