
import React from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LibraryTabbedSection from "@/components/LibraryTabbedSection";
import LibraryHeroSection from "@/components/LibraryHeroSection";
import LibraryOverview from "@/components/LibraryOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LibraryPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow w-full navbar-offset py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <LibraryHeroSection />
          
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 bg-black/40 border border-unplayed-mint/20">
              <TabsTrigger 
                value="overview"
                className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="games"
                className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
              >
                Games
              </TabsTrigger>
              <TabsTrigger 
                value="insights"
                className="data-[state=active]:bg-unplayed-mint data-[state=active]:text-black"
              >
                Insights
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <LibraryOverview />
            </TabsContent>
            
            <TabsContent value="games" className="space-y-4">
              <LibraryTabbedSection />
            </TabsContent>
            
            <TabsContent value="insights" className="space-y-4">
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-white mb-2">Advanced Insights</h3>
                <p className="text-gray-400">Coming soon: Advanced analytics and personalized recommendations</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default LibraryPage;
