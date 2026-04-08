

## Plan: Reorganize & Enhance Queue Manager Page

### Summary
Reorganize the Queue Manager page into logical sections, make batch tools collapsed by default, add descriptive use-case info to each tool, and fix the layout relationship between Queue Statistics and its Batch Processing Controls.

### Current Layout (top to bottom)
1. Queue Statistics
2. Smart Prioritization (card component)
3. Header Image Enhancement (card component)
4. Dust Score Recalculation
5. Batch User Metrics Recalculation
6. Batch Processing Controls (Steam queue processor) -- disconnected from Queue Stats
7. Metadata Consistency
8. Smart User Prioritization (manual, per-user)
9. User Metrics Calculator (manual, per-user)
10. Leaderboard Management

### Proposed Layout (grouped by function)

**Section 1: Steam Queue Management**
- Queue Statistics card
- Batch Processing Controls (Steam queue) -- moved up, directly below its stats
- Smart Prioritization card
- Header Image Enhancement card

**Section 2: Data Pipeline (Batch Recalculation)**
- Section header: "Data Pipeline Tools" with brief explanation of the 3-stage flow
- Dust Score Recalculation (collapsible, collapsed by default)
- Batch User Metrics Recalculation (collapsible, collapsed by default)
- Leaderboard Management (collapsible, collapsed by default)

**Section 3: Single-User Tools**
- Section header: "Single-User Tools"
- Smart User Prioritization (collapsible, collapsed by default)
- User Metrics Calculator (collapsible, collapsed by default)
- Metadata Consistency card (collapsible, collapsed by default)

### Collapsible Behavior
- Use the existing `Collapsible` component from shadcn/ui
- Each batch/single-user tool card gets a clickable header that toggles open/closed
- Default state: collapsed
- Add a chevron icon to indicate expand/collapse state

### Enhanced Descriptions (added to each card)
Each tool gets a "When to use" section with 2-3 bullet points explaining use cases:

- **Dust Score Recalculation**: "Use after changing the dust score formula. Processes ~302K game records. Not needed for routine operations -- the trigger handles new imports automatically."
- **Batch User Metrics**: "Use after bulk dust score recalculation to aggregate per-user stats. Processes ~538 users. Run before triggering leaderboard."
- **Leaderboard Management**: "Use after user metrics are up to date. Snapshots all rankings. Auto-runs daily at midnight UTC."
- **User Metrics Calculator**: "Debug tool for recalculating a single user's metrics. Useful for support tickets or verifying formula changes."
- **Smart User Prioritization**: "Bump a specific user's games to the front of the processing queue. Useful when a user reports missing game data."

### Files Modified

| File | Change |
|------|--------|
| `src/pages/QueueManagerPage.tsx` | Reorder cards into sections, wrap each tool in `Collapsible` (collapsed by default), add use-case descriptions, move Batch Processing Controls next to Queue Stats |

### Technical Notes
- Uses existing `Collapsible`, `CollapsibleTrigger`, `CollapsibleContent` from `@/components/ui/collapsible`
- Add `ChevronDown` icon from lucide-react for toggle indicator
- Section headers use simple `h2` + `p` elements with existing text styles
- No new components needed -- all changes in `QueueManagerPage.tsx`

