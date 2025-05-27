
import React, { useEffect } from 'react';
import GameCard from './GameCard';
import GameCardSkeleton from './GameCardSkeleton';
import { LibraryGame } from '@/hooks/use-library-data';
import { Loader2 } from 'lucide-react';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ScrollArea } from '@/components/ui/scroll-area';

interface PaginatedGameGridProps {
  games: LibraryGame[];
  isLoading: boolean;
  onMarkAsPlayed: (userGameId: string) => void;
  onToggleHidden: (userGameId: string, hidden: boolean) => void;
  onSaveNote: (userGameId: string, note: string) => void;
  focusedGameId?: number | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  goToPage: (page: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  setPageSize: (size: number) => void;
}

const PaginatedGameGrid: React.FC<PaginatedGameGridProps> = ({
  games,
  isLoading,
  onMarkAsPlayed,
  onToggleHidden,
  onSaveNote,
  focusedGameId = null,
  pagination,
  goToPage,
  nextPage,
  previousPage,
  setPageSize
}) => {
  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [pagination.currentPage]);
  
  // Display loading state
  if (isLoading) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-unplayed-mint mr-2" />
          <p className="text-gray-400">Loading your game collection...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: pagination.pageSize }).map((_, index) => (
            <div key={`skeleton-${index}`} className="animate-pulse opacity-70">
              <GameCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Display empty state
  if (!games || games.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-unplayed-mint/10 p-6 rounded-full mb-4">
          <span className="text-4xl">🎮</span>
        </div>
        <h3 className="text-xl font-medium mb-2">No games found</h3>
        <p className="text-gray-400 max-w-md">
          No games match your current filters, or your collection is empty.
          Try adjusting your search filters or adding games to your library.
        </p>
      </div>
    );
  }
  
  // Generate pagination links
  const renderPaginationLinks = () => {
    const { currentPage, totalPages } = pagination;
    const items = [];
    
    // Function to add page number
    const addPageNumber = (pageNum: number) => {
      items.push(
        <PaginationItem key={`page-${pageNum}`}>
          <PaginationLink
            onClick={() => goToPage(pageNum)}
            isActive={pageNum === currentPage}
          >
            {pageNum}
          </PaginationLink>
        </PaginationItem>
      );
    };
    
    // Always show first page
    addPageNumber(1);
    
    // Add ellipsis if needed
    if (currentPage > 3) {
      items.push(
        <PaginationItem key="ellipsis-1">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Show current page and neighbors
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      addPageNumber(i);
    }
    
    // Add ellipsis if needed
    if (currentPage < totalPages - 2) {
      items.push(
        <PaginationItem key="ellipsis-2">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }
    
    // Always show last page if there is more than one page
    if (totalPages > 1) {
      addPageNumber(totalPages);
    }
    
    return items;
  };

  return (
    <div className="space-y-6">
      <ScrollArea className="max-h-[80vh] w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-2">
          {games.map((game) => (
            <div 
              key={game.userGame.id} 
              id={`game-${game.id}`}
              className={`transition-all duration-300 ${focusedGameId === game.id ? 'scale-105 ring-2 ring-unplayed-mint rounded-lg shadow-lg shadow-unplayed-mint/25' : ''}`}
            >
              <GameCard
                id={game.userGame.id}
                gameId={game.id}
                title={game.name}
                imageUrl={game.image_url || game.header_image}
                dustScore={game.userGame.dust_score}
                playtimeMinutes={game.userGame.playtime_minutes}
                isHidden={game.userGame.hidden}
                notes={game.userGame.notes}
                onMarkAsPlayed={() => onMarkAsPlayed(game.userGame.id)}
                onToggleHidden={() => onToggleHidden(game.userGame.id, !(game.userGame.hidden))}
                onSaveNote={(note) => onSaveNote(game.userGame.id, note)}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Pagination controls */}
      {pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">
              Showing {games.length} of {pagination.totalItems} games
            </span>
            <Select
              value={pagination.pageSize.toString()}
              onValueChange={(value) => setPageSize(parseInt(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Per page" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12">12 per page</SelectItem>
                <SelectItem value="24">24 per page</SelectItem>
                <SelectItem value="48">48 per page</SelectItem>
                <SelectItem value="96">96 per page</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Pagination>
            <PaginationContent>
              {pagination.hasPreviousPage && (
                <PaginationItem>
                  <PaginationPrevious onClick={previousPage} />
                </PaginationItem>
              )}
              
              {renderPaginationLinks()}
              
              {pagination.hasNextPage && (
                <PaginationItem>
                  <PaginationNext onClick={nextPage} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default PaginatedGameGrid;
