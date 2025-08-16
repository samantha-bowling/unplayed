// DB → UI adapter layer preserving existing UI contracts

import { DBLibraryItem } from "@/contracts/db/library";
import { UILibraryItem } from "@/contracts/ui/library";
import { getBestGameImage } from "@/utils/image-utils"; // existing logic used by UI today

/**
 * Adapt DB snake_case to UI camelCase, preserving existing getBestGameImage behavior
 */
export function adaptDBToUI(db: DBLibraryItem): UILibraryItem {
  return {
    id: db.id,
    name: db.name,
    imageUrl: getBestGameImage(db.header_image, db.image_url, db.id),
    headerImage: db.header_image,
    playtimeMinutes: db.userGame.playtime_minutes,
    dustScore: db.userGame.dust_score,
    isHidden: db.userGame.hidden,
    notes: db.userGame.notes,
    userGameId: db.userGame.id,
  };
}

/**
 * Adapt array of DB items to UI format
 */
export function adaptDBLibraryToUI(dbItems: DBLibraryItem[]): UILibraryItem[] {
  return dbItems.map(adaptDBToUI);
}