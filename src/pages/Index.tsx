
import React from 'react';
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UnplayedCounter from "@/components/UnplayedCounter";
import SpendingEstimate from "@/components/SpendingEstimate";
import LibraryPreview from "@/components/LibraryPreview";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col bg-unplayed-ink">
      <Header />
      
      {/* Hero Section */}
      <section className="navbar-offset pb-8">
        <div className="max-w-7xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-space mb-6 text-unplayed-mint">
            Your Gaming Backlog,<br />
            <span className="text-unplayed-pink">Demystified</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Stop wondering what to play next. Get insights into your Steam library,
            track your unplayed games, and discover your next great adventure.
          </p>
        </div>
      </section>

      {/* Dashboard Grid */}
      <section className="flex-grow px-4 pb-12">
        <div className="max-w-7xl mx-auto dashboard-grid">
          <UnplayedCounter />
          <SpendingEstimate />
          <LibraryPreview />
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
