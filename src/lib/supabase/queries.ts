import { createClient } from "./client";
import { Database } from "./types";

/*
  =========================================
  SQL MIGRATION: post_captions & post_analytics
  =========================================
  
  CREATE TABLE post_captions (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID DEFAULT '00000000-0000-0000-0000-000000000001',
    platform     TEXT NOT NULL, -- 'x' | 'linkedin' | 'both'
    pillar       TEXT NOT NULL, -- 'builder'|'relatable'|'opinion'|'learning'|'brand'
    activity     TEXT,
    caption_text TEXT NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT now()
  );

  CREATE TABLE post_analytics (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID DEFAULT '00000000-0000-0000-0000-000000000001',
    platform      TEXT NOT NULL, -- 'x' | 'linkedin'
    pillar        TEXT NOT NULL,
    caption_text  TEXT,
    posted_date   DATE NOT NULL,
    likes         INTEGER DEFAULT 0,
    comments      INTEGER DEFAULT 0,
    reposts       INTEGER DEFAULT 0,
    impressions   INTEGER DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now()
  );
*/

export type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];
export type SQLProblem = Database["public"]["Tables"]["sql_problems"]["Row"];
export type Project = Database["public"]["Tables"]["projects"]["Row"];
export type Metric = Database["public"]["Tables"]["metrics"]["Row"];
export type QuickLink = Database["public"]["Tables"]["quick_links"]["Row"];

export interface DSAPlacementProblem {
    id: string; // Internal UUID
    number: number; // LC Problem Number
    title: string;
    chapter: string;
    difficulty: "Easy" | "Medium" | "Hard";
    lc_url: string;
    yt_url: string;
    is_must: boolean;
    status: "Todo" | "In Progress" | "Done" | "Revisit";
    notes: string;
}

export const MUST_KNOW_LC_NUMBERS = new Set([
    1, 121, 217, 53, 238, 152, 153, 33, 15, 11, 42, 169, 56, 128, 35, 34, 74,
    4, 206, 21, 141, 142, 19, 25, 143, 2, 160, 23, 20, 155, 739, 84, 239, 104,
    226, 100, 235, 102, 199, 98, 230, 105, 124, 297, 236, 543, 200, 133, 695,
    994, 207, 210, 323, 743, 787, 127, 269, 70, 198, 213, 5, 91, 322, 139,
    300, 1143, 518, 494, 72, 3, 424, 76, 567, 703, 973, 215, 621, 295
]);

export interface PostCaption {
    id: string;
    user_id: string;
    platform: 'x' | 'linkedin' | 'both';
    pillar: string;
    activity: string;
    caption_text: string;
    created_at: string;
}

export interface PostAnalytics {
    id: string;
    user_id: string;
    platform: 'x' | 'linkedin';
    pillar: string;
    caption_text: string;
    posted_date: string;
    likes: number;
    comments: number;
    reposts: number;
    impressions: number;
    created_at: string;
}

// ─── MOCK DATA FALLBACKS ───

export const MOCK_QUICK_LINKS: QuickLink[] = [
    { id: "1", label: "LeetCode", url: "https://leetcode.com", icon_name: "leetcode", position: 1, category: "Coding" },
    { id: "2", label: "NeetCode", url: "https://neetcode.io", icon_name: "neetcode", position: 2, category: "Coding" },
    { id: "3", label: "GitHub", url: "https://github.com/pranavgawai", icon_name: "github", position: 3, category: "Dev" },
    { id: "4", label: "Supabase", url: "https://app.supabase.com", icon_name: "supabase", position: 4, category: "Dev" },
    { id: "5", label: "Railway", url: "https://railway.app", icon_name: "railway", position: 5, category: "Dev" },
    { id: "6", label: "Vercel", url: "https://vercel.com", icon_name: "vercel", position: 6, category: "Dev" },
    { id: "7", label: "LinkedIn", url: "https://linkedin.com/in/pranavgawai", icon_name: "linkedin", position: 7, category: "Social" },
    { id: "8", label: "X.com", url: "https://x.com/pranavgawai_", icon_name: "x", position: 8, category: "Social" },
    { id: "9", label: "Coursera", url: "https://coursera.org", icon_name: "coursera", position: 9, category: "Learning" },
    { id: "10", label: "Judge0", url: "https://ce.judge0.com", icon_name: "terminal", position: 10, category: "Tool" },
    { id: "11", label: "Google Cloud", url: "https://cloudskillsboost.google", icon_name: "googlecloud", position: 11, category: "Learning" },
    { id: "12", label: "Cursor", url: "https://cursor.com", icon_name: "Code", position: 12, category: "Tool" },
];

let memoryTasks = [
    { text: "LeetCode Daily Challenge", done: true, description: "Hash Maps - Medium" },
    { text: "Review System Design Notes", done: true, description: "Load Balancers" },
    { text: "Commit to GitHub", done: true, description: "Project DEX - v1.0" },
    { text: "Mock Interview Prep", done: false, description: "Behavioral Questions @ 6PM" },
    { text: "Read Tech Blog", done: false, description: "Netflix Engineering" }
];

const getMockTodayLog = (): DailyLog => ({
    id: "log_1",
    log_date: new Date().toISOString().split("T")[0],
    energy: 8,
    tasks: memoryTasks,
    learned_today: "",
    dsa_solved: 3,
    sql_solved: 0,
    github_committed: true,
    x_posted: false,
    project_progress: "",
    tomorrow_task: "",
    mood: "Focused",
    steps: 5000,
    water: 4,
    sleep_hours: 7.5,
    workout: false,
    created_at: new Date().toISOString(),
});

const MOCK_METRICS: Metric[] = [
    { id: "1", metric_key: "lc_solved", metric_name: "LeetCode Solved", icon: "Code", current_value: 50, target_value: 200, unit: "problems", updated_at: new Date().toISOString() },
    { id: "2", metric_key: "sql_done", metric_name: "SQL Problems", icon: "Database", current_value: 0, target_value: 50, unit: "problems", updated_at: new Date().toISOString() },
    { id: "3", metric_key: "github_stars", metric_name: "GitHub Stars", icon: "Star", current_value: 0, target_value: 50, unit: "stars", updated_at: new Date().toISOString() },
    { id: "4", metric_key: "x_followers", metric_name: "X Followers", icon: "Twitter", current_value: 62, target_value: 500, unit: "followers", updated_at: new Date().toISOString() },
    { id: "5", metric_key: "li_followers", metric_name: "LinkedIn Followers", icon: "Linkedin", current_value: 800, target_value: 1500, unit: "followers", updated_at: new Date().toISOString() },
    { id: "6", metric_key: "certs", metric_name: "Certs Earned", icon: "Award", current_value: 2, target_value: 5, unit: "certs", updated_at: new Date().toISOString() },
    { id: "7", metric_key: "gsoc_prs", metric_name: "GSoC PRs", icon: "GitPullRequest", current_value: 0, target_value: 3, unit: "prs", updated_at: new Date().toISOString() },
    { id: "8", metric_key: "mock_interviews", metric_name: "Mock Interviews", icon: "Users", current_value: 0, target_value: 20, unit: "sessions", updated_at: new Date().toISOString() },
    { id: "9", metric_key: "applications", metric_name: "Applications Sent", icon: "Send", current_value: 0, target_value: 100, unit: "apps", updated_at: new Date().toISOString() },
];

export const CURATED_120_PROBLEMS = [
    { number: 1, title: 'Two Sum', chapter: 'Arrays & Strings', difficulty: 'Easy', lc_url: '/problems/two-sum', yt_url: 'https://www.youtube.com/results?search_query=striver+Two+Sum' },
    { number: 121, title: 'Best Time to Buy Stock', chapter: 'Arrays & Strings', difficulty: 'Easy', lc_url: '/problems/best-time-to-buy-and-sell-stock', yt_url: 'https://www.youtube.com/results?search_query=striver+Best+Time+to+Buy+Stock' },
    { number: 217, title: 'Contains Duplicate', chapter: 'Arrays & Strings', difficulty: 'Easy', lc_url: '/problems/contains-duplicate', yt_url: 'https://www.youtube.com/results?search_query=striver+Contains+Duplicate' },
    { number: 53, title: 'Maximum Subarray', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/maximum-subarray', yt_url: 'https://www.youtube.com/results?search_query=striver+Maximum+Subarray' },
    { number: 238, title: 'Product of Array Except Self', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/product-of-array-except-self', yt_url: 'https://www.youtube.com/results?search_query=striver+Product+of+Array+Except+Self' },
    { number: 152, title: 'Maximum Product Subarray', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/maximum-product-subarray', yt_url: 'https://www.youtube.com/results?search_query=striver+Maximum+Product+Subarray' },
    { number: 153, title: 'Find Min in Rotated Sorted Array', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/find-minimum-in-rotated-sorted-array', yt_url: 'https://www.youtube.com/results?search_query=striver+Find+Min+in+Rotated+Sorted+Array' },
    { number: 33, title: 'Search in Rotated Sorted Array', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/search-in-rotated-sorted-array', yt_url: 'https://www.youtube.com/results?search_query=striver+Search+in+Rotated+Sorted+Array' },
    { number: 15, title: '3Sum', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/3sum', yt_url: 'https://www.youtube.com/results?search_query=striver+3Sum' },
    { number: 11, title: 'Container With Most Water', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/container-with-most-water', yt_url: 'https://www.youtube.com/results?search_query=striver+Container+With+Most+Water' },
    { number: 42, title: 'Trapping Rain Water', chapter: 'Arrays & Strings', difficulty: 'Hard', lc_url: '/problems/trapping-rain-water', yt_url: 'https://www.youtube.com/results?search_query=striver+Trapping+Rain+Water' },
    { number: 31, title: 'Next Permutation', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/next-permutation', yt_url: 'https://www.youtube.com/results?search_query=striver+Next+Permutation' },
    { number: 75, title: 'Sort Colors', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/sort-colors', yt_url: 'https://www.youtube.com/results?search_query=striver+Sort+Colors' },
    { number: 169, title: 'Majority Element', chapter: 'Arrays & Strings', difficulty: 'Easy', lc_url: '/problems/majority-element', yt_url: 'https://www.youtube.com/results?search_query=striver+Majority+Element' },
    { number: 189, title: 'Rotate Array', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/rotate-array', yt_url: 'https://www.youtube.com/results?search_query=striver+Rotate+Array' },
    { number: 56, title: 'Merge Intervals', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/merge-intervals', yt_url: 'https://www.youtube.com/results?search_query=striver+Merge+Intervals' },
    { number: 57, title: 'Insert Interval', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/insert-interval', yt_url: 'https://www.youtube.com/results?search_query=striver+Insert+Interval' },
    { number: 128, title: 'Longest Consecutive Sequence', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/longest-consecutive-sequence', yt_url: 'https://www.youtube.com/results?search_query=striver+Longest+Consecutive+Sequence' },
    { number: 73, title: 'Set Matrix Zeroes', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/set-matrix-zeroes', yt_url: 'https://www.youtube.com/results?search_query=striver+Set+Matrix+Zeroes' },
    { number: 54, title: 'Spiral Matrix', chapter: 'Arrays & Strings', difficulty: 'Medium', lc_url: '/problems/spiral-matrix', yt_url: 'https://www.youtube.com/results?search_query=striver+Spiral+Matrix' },
    { number: 35, title: 'Search Insert Position', chapter: 'Binary Search', difficulty: 'Easy', lc_url: '/problems/search-insert-position', yt_url: 'https://www.youtube.com/results?search_query=striver+Search+Insert+Position' },
    { number: 34, title: 'Find First and Last Position', chapter: 'Binary Search', difficulty: 'Medium', lc_url: '/problems/find-first-and-last-position-of-element-in-sorted-array', yt_url: 'https://www.youtube.com/results?search_query=striver+Find+First+and+Last+Position' },
    { number: 74, title: 'Search a 2D Matrix', chapter: 'Binary Search', difficulty: 'Medium', lc_url: '/problems/search-a-2d-matrix', yt_url: 'https://www.youtube.com/results?search_query=striver+Search+a+2D+Matrix' },
    { number: 875, title: 'Koko Eating Bananas', chapter: 'Binary Search', difficulty: 'Medium', lc_url: '/problems/koko-eating-bananas', yt_url: 'https://www.youtube.com/results?search_query=striver+Koko+Eating+Bananas' },
    { number: 1011, title: 'Capacity to Ship Packages', chapter: 'Binary Search', difficulty: 'Medium', lc_url: '/problems/capacity-to-ship-packages-within-d-days', yt_url: 'https://www.youtube.com/results?search_query=striver+Capacity+to+Ship+Packages' },
    { number: 410, title: 'Split Array Largest Sum', chapter: 'Binary Search', difficulty: 'Hard', lc_url: '/problems/split-array-largest-sum', yt_url: 'https://www.youtube.com/results?search_query=striver+Split+Array+Largest+Sum' },
    { number: 4, title: 'Median of Two Sorted Arrays', chapter: 'Binary Search', difficulty: 'Hard', lc_url: '/problems/median-of-two-sorted-arrays', yt_url: 'https://www.youtube.com/results?search_query=striver+Median+of+Two+Sorted+Arrays' },
    { number: 540, title: 'Single Element in Sorted Array', chapter: 'Binary Search', difficulty: 'Medium', lc_url: '/problems/single-element-in-a-sorted-array', yt_url: 'https://www.youtube.com/results?search_query=striver+Single+Element+in+Sorted+Array' },
    { number: 206, title: 'Reverse Linked List', chapter: 'Linked Lists', difficulty: 'Easy', lc_url: '/problems/reverse-linked-list', yt_url: 'https://www.youtube.com/results?search_query=striver+Reverse+Linked+List' },
    { number: 21, title: 'Merge Two Sorted Lists', chapter: 'Linked Lists', difficulty: 'Easy', lc_url: '/problems/merge-two-sorted-lists', yt_url: 'https://www.youtube.com/results?search_query=striver+Merge+Two+Sorted+Lists' },
    { number: 141, title: 'Linked List Cycle', chapter: 'Linked Lists', difficulty: 'Easy', lc_url: '/problems/linked-list-cycle', yt_url: 'https://www.youtube.com/results?search_query=striver+Linked+List+Cycle' },
    { number: 142, title: 'Linked List Cycle II', chapter: 'Linked Lists', difficulty: 'Medium', lc_url: '/problems/linked-list-cycle-ii', yt_url: 'https://www.youtube.com/results?search_query=striver+Linked+List+Cycle+II' },
    { number: 19, title: 'Remove Nth From End', chapter: 'Linked Lists', difficulty: 'Medium', lc_url: '/problems/remove-nth-node-from-end-of-list', yt_url: 'https://www.youtube.com/results?search_query=striver+Remove+Nth+From+End' },
    { number: 24, title: 'Swap Nodes in Pairs', chapter: 'Linked Lists', difficulty: 'Medium', lc_url: '/problems/swap-nodes-in-pairs', yt_url: 'https://www.youtube.com/results?search_query=striver+Swap+Nodes+in+Pairs' },
    { number: 25, title: 'Reverse K Group', chapter: 'Linked Lists', difficulty: 'Hard', lc_url: '/problems/reverse-nodes-in-k-group', yt_url: 'https://www.youtube.com/results?search_query=striver+Reverse+K+Group' },
    { number: 143, title: 'Reorder List', chapter: 'Linked Lists', difficulty: 'Medium', lc_url: '/problems/reorder-list', yt_url: 'https://www.youtube.com/results?search_query=striver+Reorder+List' },
    { number: 148, title: 'Sort List', chapter: 'Linked Lists', difficulty: 'Medium', lc_url: '/problems/sort-list', yt_url: 'https://www.youtube.com/results?search_query=striver+Sort+List' },
    { number: 2, title: 'Add Two Numbers', chapter: 'Linked Lists', difficulty: 'Medium', lc_url: '/problems/add-two-numbers', yt_url: 'https://www.youtube.com/results?search_query=striver+Add+Two+Numbers' },
    { number: 160, title: 'Intersection of Two Lists', chapter: 'Linked Lists', difficulty: 'Easy', lc_url: '/problems/intersection-of-two-linked-lists', yt_url: 'https://www.youtube.com/results?search_query=striver+Intersection+of+Two+Lists' },
    { number: 23, title: 'Merge K Sorted Lists', chapter: 'Linked Lists', difficulty: 'Hard', lc_url: '/problems/merge-k-sorted-lists', yt_url: 'https://www.youtube.com/results?search_query=striver+Merge+K+Sorted+Lists' },
    { number: 20, title: 'Valid Parentheses', chapter: 'Stacks & Queues', difficulty: 'Easy', lc_url: '/problems/valid-parentheses', yt_url: 'https://www.youtube.com/results?search_query=striver+Valid+Parentheses' },
    { number: 155, title: 'Min Stack', chapter: 'Stacks & Queues', difficulty: 'Medium', lc_url: '/problems/min-stack', yt_url: 'https://www.youtube.com/results?search_query=striver+Min+Stack' },
    { number: 150, title: 'Evaluate Reverse Polish', chapter: 'Stacks & Queues', difficulty: 'Medium', lc_url: '/problems/evaluate-reverse-polish-notation', yt_url: 'https://www.youtube.com/results?search_query=striver+Evaluate+Reverse+Polish' },
    { number: 739, title: 'Daily Temperatures', chapter: 'Stacks & Queues', difficulty: 'Medium', lc_url: '/problems/daily-temperatures', yt_url: 'https://www.youtube.com/results?search_query=striver+Daily+Temperatures' },
    { number: 853, title: 'Car Fleet', chapter: 'Stacks & Queues', difficulty: 'Medium', lc_url: '/problems/car-fleet', yt_url: 'https://www.youtube.com/results?search_query=striver+Car+Fleet' },
    { number: 84, title: 'Largest Rectangle Histogram', chapter: 'Stacks & Queues', difficulty: 'Hard', lc_url: '/problems/largest-rectangle-in-histogram', yt_url: 'https://www.youtube.com/results?search_query=striver+Largest+Rectangle+Histogram' },
    { number: 239, title: 'Sliding Window Maximum', chapter: 'Stacks & Queues', difficulty: 'Hard', lc_url: '/problems/sliding-window-maximum', yt_url: 'https://www.youtube.com/results?search_query=striver+Sliding+Window+Maximum' },
    { number: 496, title: 'Next Greater Element I', chapter: 'Stacks & Queues', difficulty: 'Easy', lc_url: '/problems/next-greater-element-i', yt_url: 'https://www.youtube.com/results?search_query=striver+Next+Greater+Element+I' },
    { number: 232, title: 'Implement Queue with Stacks', chapter: 'Stacks & Queues', difficulty: 'Easy', lc_url: '/problems/implement-queue-using-stacks', yt_url: 'https://www.youtube.com/results?search_query=striver+Implement+Queue+with+Stacks' },
    { number: 104, title: 'Maximum Depth of Binary Tree', chapter: 'Trees', difficulty: 'Easy', lc_url: '/problems/maximum-depth-of-binary-tree', yt_url: 'https://www.youtube.com/results?search_query=striver+Maximum+Depth+of+Binary+Tree' },
    { number: 226, title: 'Invert Binary Tree', chapter: 'Trees', difficulty: 'Easy', lc_url: '/problems/invert-binary-tree', yt_url: 'https://www.youtube.com/results?search_query=striver+Invert+Binary+Tree' },
    { number: 100, title: 'Same Tree', chapter: 'Trees', difficulty: 'Easy', lc_url: '/problems/same-tree', yt_url: 'https://www.youtube.com/results?search_query=striver+Same+Tree' },
    { number: 572, title: 'Subtree of Another Tree', chapter: 'Trees', difficulty: 'Easy', lc_url: '/problems/subtree-of-another-tree', yt_url: 'https://www.youtube.com/results?search_query=striver+Subtree+of+Another+Tree' },
    { number: 235, title: 'LCA of BST', chapter: 'Trees', difficulty: 'Medium', lc_url: '/problems/lowest-common-ancestor-of-a-binary-search-tree', yt_url: 'https://www.youtube.com/results?search_query=striver+LCA+of+BST' },
    { number: 102, title: 'Level Order Traversal', chapter: 'Trees', difficulty: 'Medium', lc_url: '/problems/binary-tree-level-order-traversal', yt_url: 'https://www.youtube.com/results?search_query=striver+Level+Order+Traversal' },
    { number: 199, title: 'Right Side View', chapter: 'Trees', difficulty: 'Medium', lc_url: '/problems/binary-tree-right-side-view', yt_url: 'https://www.youtube.com/results?search_query=striver+Right+Side+View' },
    { number: 98, title: 'Validate BST', chapter: 'Trees', difficulty: 'Medium', lc_url: '/problems/validate-binary-search-tree', yt_url: 'https://www.youtube.com/results?search_query=striver+Validate+BST' },
    { number: 230, title: 'Kth Smallest in BST', chapter: 'Trees', difficulty: 'Medium', lc_url: '/problems/kth-smallest-element-in-a-bst', yt_url: 'https://www.youtube.com/results?search_query=striver+Kth+Smallest+in+BST' },
    { number: 105, title: 'Construct from Preorder+Inorder', chapter: 'Trees', difficulty: 'Medium', lc_url: '/problems/construct-binary-tree-from-preorder-and-inorder-traversal', yt_url: 'https://www.youtube.com/results?search_query=striver+Construct+from+Preorder+Inorder' },
    { number: 124, title: 'Binary Tree Max Path Sum', chapter: 'Trees', difficulty: 'Hard', lc_url: '/problems/binary-tree-maximum-path-sum', yt_url: 'https://www.youtube.com/results?search_query=striver+Binary+Tree+Max+Path+Sum' },
    { number: 297, title: 'Serialize and Deserialize', chapter: 'Trees', difficulty: 'Hard', lc_url: '/problems/serialize-and-deserialize-binary-tree', yt_url: 'https://www.youtube.com/results?search_query=striver+Serialize+and+Deserialize' },
    { number: 236, title: 'LCA Binary Tree', chapter: 'Trees', difficulty: 'Medium', lc_url: '/problems/lowest-common-ancestor-of-a-binary-tree', yt_url: 'https://www.youtube.com/results?search_query=striver+LCA+Binary+Tree' },
    { number: 543, title: 'Diameter of Binary Tree', chapter: 'Trees', difficulty: 'Easy', lc_url: '/problems/diameter-of-binary-tree', yt_url: 'https://www.youtube.com/results?search_query=striver+Diameter+of+Binary+Tree' },
    { number: 112, title: 'Path Sum', chapter: 'Trees', difficulty: 'Easy', lc_url: '/problems/path-sum', yt_url: 'https://www.youtube.com/results?search_query=striver+Path+Sum' },
    { number: 200, title: 'Number of Islands', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/number-of-islands', yt_url: 'https://www.youtube.com/results?search_query=striver+Number+of+Islands' },
    { number: 133, title: 'Clone Graph', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/clone-graph', yt_url: 'https://www.youtube.com/results?search_query=striver+Clone+Graph' },
    { number: 695, title: 'Max Area of Island', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/max-area-of-island', yt_url: 'https://www.youtube.com/results?search_query=striver+Max+Area+of+Island' },
    { number: 417, title: 'Pacific Atlantic Water Flow', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/pacific-atlantic-water-flow', yt_url: 'https://www.youtube.com/results?search_query=striver+Pacific+Atlantic+Water+Flow' },
    { number: 130, title: 'Surrounded Regions', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/surrounded-regions', yt_url: 'https://www.youtube.com/results?search_query=striver+Surrounded+Regions' },
    { number: 994, title: 'Rotting Oranges', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/rotting-oranges', yt_url: 'https://www.youtube.com/results?search_query=striver+Rotting+Oranges' },
    { number: 207, title: 'Course Schedule', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/course-schedule', yt_url: 'https://www.youtube.com/results?search_query=striver+Course+Schedule' },
    { number: 210, title: 'Course Schedule II', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/course-schedule-ii', yt_url: 'https://www.youtube.com/results?search_query=striver+Course+Schedule+II' },
    { number: 684, title: 'Redundant Connection', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/redundant-connection', yt_url: 'https://www.youtube.com/results?search_query=striver+Redundant+Connection' },
    { number: 323, title: 'Number of Connected Components', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/number-of-connected-components-in-an-undirected-graph', yt_url: 'https://www.youtube.com/results?search_query=striver+Number+of+Connected+Components' },
    { number: 743, title: 'Network Delay Time', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/network-delay-time', yt_url: 'https://www.youtube.com/results?search_query=striver+Network+Delay+Time' },
    { number: 787, title: 'Cheapest Flights K Stops', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/cheapest-flights-within-k-stops', yt_url: 'https://www.youtube.com/results?search_query=striver+Cheapest+Flights+K+Stops' },
    { number: 127, title: 'Word Ladder', chapter: 'Graphs', difficulty: 'Hard', lc_url: '/problems/word-ladder', yt_url: 'https://www.youtube.com/results?search_query=striver+Word+Ladder' },
    { number: 269, title: 'Alien Dictionary', chapter: 'Graphs', difficulty: 'Hard', lc_url: '/problems/alien-dictionary', yt_url: 'https://www.youtube.com/results?search_query=striver+Alien+Dictionary' },
    { number: 1584, title: 'Min Cost Connect Points', chapter: 'Graphs', difficulty: 'Medium', lc_url: '/problems/min-cost-to-connect-all-points', yt_url: 'https://www.youtube.com/results?search_query=striver+Min+Cost+Connect+Points' },
    { number: 70, title: 'Climbing Stairs', chapter: 'Dynamic Programming', difficulty: 'Easy', lc_url: '/problems/climbing-stairs', yt_url: 'https://www.youtube.com/results?search_query=striver+Climbing+Stairs' },
    { number: 198, title: 'House Robber', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/house-robber', yt_url: 'https://www.youtube.com/results?search_query=striver+House+Robber' },
    { number: 213, title: 'House Robber II', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/house-robber-ii', yt_url: 'https://www.youtube.com/results?search_query=striver+House+Robber+II' },
    { number: 5, title: 'Longest Palindromic Substring', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/longest-palindromic-substring', yt_url: 'https://www.youtube.com/results?search_query=striver+Longest+Palindromic+Substring' },
    { number: 647, title: 'Palindromic Substrings', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/palindromic-substrings', yt_url: 'https://www.youtube.com/results?search_query=striver+Palindromic+Substrings' },
    { number: 91, title: 'Decode Ways', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/decode-ways', yt_url: 'https://www.youtube.com/results?search_query=striver+Decode+Ways' },
    { number: 322, title: 'Coin Change', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/coin-change', yt_url: 'https://www.youtube.com/results?search_query=striver+Coin+Change' },
    { number: 139, title: 'Word Break', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/word-break', yt_url: 'https://www.youtube.com/results?search_query=striver+Word+Break' },
    { number: 300, title: 'Longest Increasing Subsequence', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/longest-increasing-subsequence', yt_url: 'https://www.youtube.com/results?search_query=striver+Longest+Increasing+Subsequence' },
    { number: 1143, title: 'Longest Common Subsequence', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/longest-common-subsequence', yt_url: 'https://www.youtube.com/results?search_query=striver+Longest+Common+Subsequence' },
    { number: 309, title: 'Best Time Stock with Cooldown', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/best-time-to-buy-and-sell-stock-with-cooldown', yt_url: 'https://www.youtube.com/results?search_query=striver+Best+Time+Stock+with+Cooldown' },
    { number: 518, title: 'Coin Change II', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/coin-change-ii', yt_url: 'https://www.youtube.com/results?search_query=striver+Coin+Change+II' },
    { number: 494, title: 'Target Sum', chapter: 'Dynamic Programming', difficulty: 'Medium', lc_url: '/problems/target-sum', yt_url: 'https://www.youtube.com/results?search_query=striver+Target+Sum' },
    { number: 97, title: 'Interleaving String', chapter: 'Dynamic Programming', difficulty: 'Hard', lc_url: '/problems/interleaving-string', yt_url: 'https://www.youtube.com/results?search_query=striver+Interleaving+String' },
    { number: 72, title: 'Edit Distance', chapter: 'Dynamic Programming', difficulty: 'Hard', lc_url: '/problems/edit-distance', yt_url: 'https://www.youtube.com/results?search_query=striver+Edit+Distance' },
    { number: 44, title: 'Wildcard Matching', chapter: 'Dynamic Programming', difficulty: 'Hard', lc_url: '/problems/wildcard-matching', yt_url: 'https://www.youtube.com/results?search_query=striver+Wildcard+Matching' },
    { number: 115, title: 'Distinct Subsequences', chapter: 'Dynamic Programming', difficulty: 'Hard', lc_url: '/problems/distinct-subsequences', yt_url: 'https://www.youtube.com/results?search_query=striver+Distinct+Subsequences' },
    { number: 312, title: 'Burst Balloons', chapter: 'Dynamic Programming', difficulty: 'Hard', lc_url: '/problems/burst-balloons', yt_url: 'https://www.youtube.com/results?search_query=striver+Burst+Balloons' },
    { number: 10, title: 'Regular Expression Matching', chapter: 'Dynamic Programming', difficulty: 'Hard', lc_url: '/problems/regular-expression-matching', yt_url: 'https://www.youtube.com/results?search_query=striver+Regular+Expression+Matching' },
    { number: 3, title: 'Longest Substring No Repeat', chapter: 'Sliding Window & Two Pointers', difficulty: 'Medium', lc_url: '/problems/longest-substring-without-repeating-characters', yt_url: 'https://www.youtube.com/results?search_query=striver+Longest+Substring+No+Repeat' },
    { number: 424, title: 'Longest Repeating Char Replace', chapter: 'Sliding Window & Two Pointers', difficulty: 'Medium', lc_url: '/problems/longest-repeating-character-replacement', yt_url: 'https://www.youtube.com/results?search_query=striver+Longest+Repeating+Char+Replace' },
    { number: 76, title: 'Minimum Window Substring', chapter: 'Sliding Window & Two Pointers', difficulty: 'Hard', lc_url: '/problems/minimum-window-substring', yt_url: 'https://www.youtube.com/results?search_query=striver+Minimum+Window+Substring' },
    { number: 567, title: 'Permutation in String', chapter: 'Sliding Window & Two Pointers', difficulty: 'Medium', lc_url: '/problems/permutation-in-string', yt_url: 'https://www.youtube.com/results?search_query=striver+Permutation+in+String' },
    { number: 438, title: 'Find All Anagrams', chapter: 'Sliding Window & Two Pointers', difficulty: 'Medium', lc_url: '/problems/find-all-anagrams-in-a-string', yt_url: 'https://www.youtube.com/results?search_query=striver+Find+All+Anagrams' },
    { number: 30, title: 'Substring with Concat Words', chapter: 'Sliding Window & Two Pointers', difficulty: 'Hard', lc_url: '/problems/substring-with-concatenation-of-all-words', yt_url: 'https://www.youtube.com/results?search_query=striver+Substring+with+Concat+Words' },
    { number: 703, title: 'Kth Largest in Stream', chapter: 'Heap & Priority Queue', difficulty: 'Easy', lc_url: '/problems/kth-largest-element-in-a-stream', yt_url: 'https://www.youtube.com/results?search_query=striver+Kth+Largest+in+Stream' },
    { number: 1046, title: 'Last Stone Weight', chapter: 'Heap & Priority Queue', difficulty: 'Easy', lc_url: '/problems/last-stone-weight', yt_url: 'https://www.youtube.com/results?search_query=striver+Last+Stone+Weight' },
    { number: 973, title: 'K Closest Points to Origin', chapter: 'Heap & Priority Queue', difficulty: 'Medium', lc_url: '/problems/k-closest-points-to-origin', yt_url: 'https://www.youtube.com/results?search_query=striver+K+Closest+Points+to+Origin' },
    { number: 215, title: 'Kth Largest in Array', chapter: 'Heap & Priority Queue', difficulty: 'Medium', lc_url: '/problems/kth-largest-element-in-an-array', yt_url: 'https://www.youtube.com/results?search_query=striver+Kth+Largest+in+Array' },
    { number: 621, title: 'Task Scheduler', chapter: 'Heap & Priority Queue', difficulty: 'Medium', lc_url: '/problems/task-scheduler', yt_url: 'https://www.youtube.com/results?search_query=striver+Task+Scheduler' },
    { number: 355, title: 'Design Twitter', chapter: 'Heap & Priority Queue', difficulty: 'Medium', lc_url: '/problems/design-twitter', yt_url: 'https://www.youtube.com/results?search_query=striver+Design+Twitter' },
    { number: 295, title: 'Find Median from Data Stream', chapter: 'Heap & Priority Queue', difficulty: 'Hard', lc_url: '/problems/find-median-from-data-stream', yt_url: 'https://www.youtube.com/results?search_query=striver+Find+Median+from+Data+Stream' }
];

const getFallbackDSAData = (): DSAPlacementProblem[] => {
    return CURATED_120_PROBLEMS.map((p, i) => ({
        id: `mock-${i}`,
        number: p.number,
        title: p.title,
        chapter: p.chapter,
        difficulty: p.difficulty as "Easy" | "Medium" | "Hard",
        lc_url: p.lc_url,
        yt_url: p.yt_url,
        is_must: MUST_KNOW_LC_NUMBERS.has(p.number),
        status: "Todo",
        notes: ""
    }));
};

export async function seedDSAProblems(): Promise<void> {
    const supabase = createClient();
    try {
        const { data, error } = await supabase.from("dsa_problems").select("id").limit(10);
        if (error) {
            console.error("Failed to check DSA problems table:", error);
            return;
        }
        if (data && data.length < 10) {
            // Wipe existing first
            const del = await supabase.from("dsa_problems").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all
            if (del.error) console.error("Wipe DSA problems error:", del.error);

            const toInsert = CURATED_120_PROBLEMS.map((p) => ({
                number: p.number,
                title: p.title,
                pattern: p.chapter,
                difficulty: p.difficulty,
                lc_url: p.lc_url,
                nc_url: p.yt_url,
                status: "Todo",
                notes: ""
            }));

            // @ts-ignore
            const ins = await supabase.from("dsa_problems").insert(toInsert);
            if (ins.error) console.error("Insert DSA problems error:", ins.error);
        }
    } catch (e) {
        console.error("Failed to seed DSA problems", e);
    }
}

export async function getDSAProblems(): Promise<DSAPlacementProblem[]> {
    try {
        const supabase = createClient();
        const { data, error } = await supabase.from("dsa_problems").select("*").order("number");

        if (error) {
            console.error("getDSAProblems Supabase Error:", error);
            return getFallbackDSAData();
        }

        if (!data || data.length === 0) {
            return getFallbackDSAData();
        }

        return data.map((r: any) => ({
            id: r.id,
            number: r.number,
            title: r.title,
            chapter: r.pattern,
            difficulty: r.difficulty as "Easy" | "Medium" | "Hard",
            lc_url: r.lc_url,
            yt_url: r.nc_url,
            is_must: MUST_KNOW_LC_NUMBERS.has(r.number),
            status: r.status as "Todo" | "In Progress" | "Done" | "Revisit",
            notes: r.notes || ""
        }));
    } catch (e) {
        console.error("getDSAProblems Catch:", e);
        return getFallbackDSAData();
    }
}

export async function updateDSAProblemStatus(id: string, status: DSAPlacementProblem["status"]): Promise<void> {
    if (id.startsWith("mock-")) return;
    const supabase = createClient();
    // @ts-ignore
    await supabase.from("dsa_problems").update({ status }).eq("id", id);
}

export async function updateDSAProblemNotes(id: string, notes: string): Promise<void> {
    if (id.startsWith("mock-")) return;
    const supabase = createClient();
    // @ts-ignore
    await supabase.from("dsa_problems").update({ notes }).eq("id", id);
}

export const CURATED_50_SQL_PROBLEMS = [
    { number: 1757, title: "Recyclable and Low Fat Products", concept: "Select", phase: 1, lc_url: "/problems/recyclable-and-low-fat-products", difficulty: "Easy" },
    { number: 584, title: "Find Customer Referee", concept: "Select", phase: 1, lc_url: "/problems/find-customer-referee", difficulty: "Easy" },
    { number: 595, title: "Big Countries", concept: "Select", phase: 1, lc_url: "/problems/big-countries", difficulty: "Easy" },
    { number: 1148, title: "Article Views I", concept: "Select", phase: 1, lc_url: "/problems/article-views-i", difficulty: "Easy" },
    { number: 1683, title: "Invalid Tweets", concept: "Select", phase: 1, lc_url: "/problems/invalid-tweets", difficulty: "Easy" },
    { number: 1378, title: "Replace Employee ID With The Unique Identifier", concept: "Joins", phase: 1, lc_url: "/problems/replace-employee-id-with-the-unique-identifier", difficulty: "Easy" },
    { number: 1068, title: "Product Sales Analysis I", concept: "Joins", phase: 1, lc_url: "/problems/product-sales-analysis-i", difficulty: "Easy" },
    { number: 1581, title: "Customer Who Visited but Did Not Make Any Transactions", concept: "Joins", phase: 1, lc_url: "/problems/customer-who-visited-but-did-not-make-any-transactions", difficulty: "Easy" },
    { number: 197, title: "Rising Temperature", concept: "Joins", phase: 1, lc_url: "/problems/rising-temperature", difficulty: "Easy" },
    { number: 1661, title: "Average Time of Process per Machine", concept: "Joins", phase: 1, lc_url: "/problems/average-time-of-process-per-machine", difficulty: "Easy" },
    { number: 577, title: "Employee Bonus", concept: "Joins", phase: 1, lc_url: "/problems/employee-bonus", difficulty: "Easy" },
    { number: 1280, title: "Students and Examinations", concept: "Joins", phase: 1, lc_url: "/problems/students-and-examinations", difficulty: "Easy" },
    { number: 570, title: "Managers with at Least 5 Direct Reports", concept: "Joins", phase: 1, lc_url: "/problems/managers-with-at-least-5-direct-reports", difficulty: "Medium" },
    { number: 1934, title: "Confirmation Rate", concept: "Joins", phase: 1, lc_url: "/problems/confirmation-rate", difficulty: "Medium" },
    { number: 620, title: "Not Boring Movies", concept: "Basic Aggregate Functions", phase: 2, lc_url: "/problems/not-boring-movies", difficulty: "Easy" },
    { number: 1251, title: "Average Selling Price", concept: "Basic Aggregate Functions", phase: 2, lc_url: "/problems/average-selling-price", difficulty: "Easy" },
    { number: 1075, title: "Project Employees I", concept: "Basic Aggregate Functions", phase: 2, lc_url: "/problems/project-employees-i", difficulty: "Easy" },
    { number: 1633, title: "Percentage of Users Attended a Contest", concept: "Basic Aggregate Functions", phase: 2, lc_url: "/problems/percentage-of-users-attended-a-contest", difficulty: "Easy" },
    { number: 1211, title: "Queries Quality and Percentage", concept: "Basic Aggregate Functions", phase: 2, lc_url: "/problems/queries-quality-and-percentage", difficulty: "Easy" },
    { number: 1193, title: "Monthly Transactions I", concept: "Basic Aggregate Functions", phase: 2, lc_url: "/problems/monthly-transactions-i", difficulty: "Medium" },
    { number: 1174, title: "Immediate Food Delivery II", concept: "Basic Aggregate Functions", phase: 2, lc_url: "/problems/immediate-food-delivery-ii", difficulty: "Medium" },
    { number: 550, title: "Game Play Analysis IV", concept: "Basic Aggregate Functions", phase: 2, lc_url: "/problems/game-play-analysis-iv", difficulty: "Medium" },
    { number: 2356, title: "Number of Unique Subjects Taught by Each Teacher", concept: "Sorting and Grouping", phase: 3, lc_url: "/problems/number-of-unique-subjects-taught-by-each-teacher", difficulty: "Easy" },
    { number: 1141, title: "User Activity for the Past 30 Days I", concept: "Sorting and Grouping", phase: 3, lc_url: "/problems/user-activity-for-the-past-30-days-i", difficulty: "Easy" },
    { number: 1084, title: "Sales Analysis III", concept: "Sorting and Grouping", phase: 3, lc_url: "/problems/sales-analysis-iii", difficulty: "Easy" },
    { number: 511, title: "Game Play Analysis I", concept: "Sorting and Grouping", phase: 3, lc_url: "/problems/game-play-analysis-i", difficulty: "Easy" },
    { number: 1050, title: "Actors and Directors Who Cooperated At Least Three Times", concept: "Sorting and Grouping", phase: 3, lc_url: "/problems/actors-and-directors-who-cooperated-at-least-three-times", difficulty: "Easy" },
    { number: 1587, title: "Bank Account Summary II", concept: "Sorting and Grouping", phase: 3, lc_url: "/problems/bank-account-summary-ii", difficulty: "Easy" },
    { number: 1070, title: "Product Sales Analysis III", concept: "Advanced Select and Joins", phase: 4, lc_url: "/problems/product-sales-analysis-iii", difficulty: "Medium" },
    { number: 1045, title: "Customers Who Bought All Products", concept: "Advanced Select and Joins", phase: 4, lc_url: "/problems/customers-who-bought-all-products", difficulty: "Medium" },
    { number: 180, title: "Consecutive Numbers", concept: "Advanced Select and Joins", phase: 4, lc_url: "/problems/consecutive-numbers", difficulty: "Medium" },
    { number: 1164, title: "Product Price at a Given Date", concept: "Advanced Select and Joins", phase: 4, lc_url: "/problems/product-price-at-a-given-date", difficulty: "Medium" },
    { number: 1204, title: "Last Person to Fit in the Bus", concept: "Advanced Select and Joins", phase: 4, lc_url: "/problems/last-person-to-fit-in-the-bus", difficulty: "Medium" },
    { number: 1907, title: "Count Salary Categories", concept: "Advanced Select and Joins", phase: 4, lc_url: "/problems/count-salary-categories", difficulty: "Medium" },
    { number: 1978, title: "Employees Whose Manager Left the Company", concept: "Subqueries", phase: 4, lc_url: "/problems/employees-whose-manager-left-the-company", difficulty: "Easy" },
    { number: 626, title: "Exchange Seats", concept: "Subqueries", phase: 4, lc_url: "/problems/exchange-seats", difficulty: "Medium" },
    { number: 1341, title: "Movie Rating", concept: "Subqueries", phase: 4, lc_url: "/problems/movie-rating", difficulty: "Medium" },
    { number: 1321, title: "Restaurant Growth", concept: "Subqueries", phase: 4, lc_url: "/problems/restaurant-growth", difficulty: "Medium" },
    { number: 602, title: "Friend Requests II: Who Has the Most Friends", concept: "Subqueries", phase: 4, lc_url: "/problems/friend-requests-ii-who-has-the-most-friends", difficulty: "Medium" },
    { number: 585, title: "Investments in 2016", concept: "Subqueries", phase: 4, lc_url: "/problems/investments-in-2016", difficulty: "Medium" },
    { number: 185, title: "Department Top Three Salaries", concept: "Subqueries", phase: 4, lc_url: "/problems/department-top-three-salaries", difficulty: "Hard" },
    { number: 1667, title: "Fix Names in a Table", concept: "Advanced String Functions / Regex / Clause", phase: 4, lc_url: "/problems/fix-names-in-a-table", difficulty: "Easy" },
    { number: 1527, title: "Patients With a Condition", concept: "Advanced String Functions / Regex / Clause", phase: 4, lc_url: "/problems/patients-with-a-condition", difficulty: "Easy" },
    { number: 196, title: "Delete Duplicate Emails", concept: "Advanced String Functions / Regex / Clause", phase: 4, lc_url: "/problems/delete-duplicate-emails", difficulty: "Easy" },
    { number: 176, title: "Second Highest Salary", concept: "Advanced String Functions / Regex / Clause", phase: 4, lc_url: "/problems/second-highest-salary", difficulty: "Medium" },
    { number: 1484, title: "Group Sold Products By The Date", concept: "Advanced String Functions / Regex / Clause", phase: 4, lc_url: "/problems/group-sold-products-by-the-date", difficulty: "Easy" },
    { number: 1327, title: "List the Products Ordered in a Period", concept: "Advanced String Functions / Regex / Clause", phase: 4, lc_url: "/problems/list-the-products-ordered-in-a-period", difficulty: "Easy" },
    { number: 1517, title: "Find Users With Valid E-Mails", concept: "Advanced String Functions / Regex / Clause", phase: 4, lc_url: "/problems/find-users-with-valid-e-mails", difficulty: "Easy" },
    { number: 178, title: "Rank Scores", concept: "Advanced String Functions / Regex / Clause", phase: 4, lc_url: "/problems/rank-scores", difficulty: "Medium" },
    { number: 184, title: "Department Highest Salary", concept: "Advanced String Functions / Regex / Clause", phase: 4, lc_url: "/problems/department-highest-salary", difficulty: "Medium" }
];

const getFallbackSQLData = (): SQLProblem[] => {
    return CURATED_50_SQL_PROBLEMS.map((p, i) => ({
        id: `mock-sql-${i}`,
        number: p.number,
        title: p.title,
        concept: p.concept,
        phase: p.phase as 1 | 2 | 3 | 4,
        lc_url: p.lc_url,
        difficulty: p.difficulty as "Easy" | "Medium" | "Hard",
        status: "Todo",
        notes: "",
        my_solution: "",
        solved_date: null,
        created_at: new Date().toISOString()
    }));
};

export async function seedSQLProblems(): Promise<void> {
    const supabase = createClient();
    try {
        const { data, error } = await supabase.from("sql_problems").select("id").limit(10);
        if (error) {
            console.error("Failed to check SQL problems table:", error);
            return;
        }
        if (data && data.length < 10) {
            // Wipe existing first
            const del = await supabase.from("sql_problems").delete().neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all
            if (del.error) console.error("Wipe SQL problems error:", del.error);

            const toInsert = CURATED_50_SQL_PROBLEMS.map((p) => ({
                number: p.number,
                title: p.title,
                concept: p.concept,
                phase: p.phase as 1 | 2 | 3 | 4,
                lc_url: p.lc_url,
                difficulty: p.difficulty,
                status: "Todo" as const,
                notes: "",
                my_solution: "",
                solved_date: null,
                created_at: new Date().toISOString()
            }));

            // @ts-ignore
            const ins = await supabase.from("sql_problems").insert(toInsert);
            if (ins.error) console.error("Insert SQL problems error:", ins.error);
        }
    } catch (e) {
        console.error("Failed to seed SQL problems", e);
    }
}

export async function getSQLProblems(): Promise<SQLProblem[]> {
    try {
        const supabase = createClient();
        const { data, error } = await supabase.from("sql_problems").select("*").order("number");

        if (error) {
            console.error("getSQLProblems Supabase Error:", error);
            return getFallbackSQLData();
        }

        if (!data || data.length === 0) {
            return getFallbackSQLData();
        }

        return data;
    } catch (e) {
        console.error("getSQLProblems Catch:", e);
        return getFallbackSQLData();
    }
}

export async function updateSQLProblemStatus(id: string, status: SQLProblem["status"]): Promise<void> {
    if (id.startsWith("mock-")) return;
    const supabase = createClient();
    // @ts-ignore
    await supabase.from("sql_problems").update({ status }).eq("id", id);
}

export async function updateSQLProblemSolution(id: string, my_solution: string): Promise<void> {
    if (id.startsWith("mock-")) return;
    const supabase = createClient();
    // @ts-ignore
    await supabase.from("sql_problems").update({ my_solution } as any).eq("id", id);
}

export async function updateSQLProblemNotes(id: string, notes: string): Promise<void> {
    if (id.startsWith("mock-")) return;
    const supabase = createClient();
    // @ts-ignore
    await supabase.from("sql_problems").update({ notes }).eq("id", id);
}

export async function getTodayLog(): Promise<DailyLog> {
    try {
        const today = new Date().toISOString().split("T")[0];
        const supabase = createClient();
        const { data, error } = await supabase.from("daily_logs").select("*").eq("log_date", today).maybeSingle();
        if (error) throw error;
        return data || getMockTodayLog();
    } catch (e) {
        return getMockTodayLog();
    }
}

export async function upsertTodayLog(logData: Partial<Database["public"]["Tables"]["daily_logs"]["Insert"]>): Promise<void> {
    try {
        const today = logData.log_date || new Date().toISOString().split("T")[0];
        const supabase = createClient();
        if (logData.tasks) {
            memoryTasks = logData.tasks as any; // update memory mock for optimistic testing
        }

        // First try to check if it exists (since we don't have id necessarily)
        const { data: existing } = await supabase.from("daily_logs").select("id").eq("log_date", today).maybeSingle();

        if (existing) {
            // @ts-ignore
            await supabase.from("daily_logs").update(logData).eq("id", existing.id);
        } else {
            // @ts-ignore
            await supabase.from("daily_logs").insert({ log_date: today, ...logData } as any);
        }
    } catch (e) {
        console.error("Mock upserted locally");
    }
}

export async function getRecentLogs(): Promise<DailyLog[] | null> {
    const supabase = createClient();
    const { data } = await supabase.from("daily_logs").select("*").order("log_date", { ascending: false }).limit(14);
    return data;
}

export async function getLogByDate(date: string): Promise<DailyLog | null> {
    const supabase = createClient();
    const { data } = await supabase.from("daily_logs").select("*").eq("log_date", date).maybeSingle();
    return data;
}

export async function getProjects(): Promise<Project[]> {
    try {
        const supabase = createClient();
        const { data, error } = await supabase.from("projects").select("*").order("created_at");
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
}

export async function getMetrics(): Promise<Metric[]> {
    try {
        const supabase = createClient();
        const { data, error } = await supabase.from("metrics").select("*").order("metric_key");
        if (error) throw error;
        if (!data || data.length === 0) return MOCK_METRICS;
        return data;
    } catch (e) {
        return MOCK_METRICS;
    }
}

export async function updateMetric(key: string, current_value: number): Promise<void> {
    try {
        const supabase = createClient();
        // @ts-ignore
        await supabase.from("metrics").update({ current_value }).eq("metric_key", key);
    } catch (e) {
        console.error("Mock update local");
    }
}

export async function getQuickLinks(): Promise<QuickLink[]> {
    try {
        // 1. Try LocalStorage first (for instant, reliable local dev state)
        if (typeof window !== "undefined") {
            const stored = localStorage.getItem("dex_quick_links");
            if (stored) return JSON.parse(stored);
        }

        // 2. Fallback to Supabase if config exists
        const supabase = createClient();
        const { data, error } = await supabase.from("quick_links").select("*").order("position");

        if (!error && data && data.length > 0) {
            if (typeof window !== "undefined") {
                localStorage.setItem("dex_quick_links", JSON.stringify(data));
            }
            return data;
        }

        // 3. Last resort: Mock data
        return MOCK_QUICK_LINKS;
    } catch (e) {
        console.error("getQuickLinks Error:", e);
        return MOCK_QUICK_LINKS;
    }
}

export async function updateQuickLinks(links: QuickLink[]): Promise<void> {
    // 1. Save to LocalStorage immediately for instant UI feedback
    if (typeof window !== "undefined") {
        localStorage.setItem("dex_quick_links", JSON.stringify(links));
    }

    // 2. Attempt Supabase sync
    try {
        const supabase = createClient();

        // Clean IDs for new links
        const formatted = links.map(l => {
            if (l.id.startsWith('temp_')) {
                const { id, ...rest } = l;
                return rest;
            }
            return l;
        });

        // Delete what's not in the new list (if we have real IDs)
        const { data: existing } = await supabase.from("quick_links").select("id");
        if (existing) {
            const existingIds = existing.map((r: any) => r.id);
            const newIds = links.filter(l => !l.id.startsWith('temp_')).map(l => l.id);
            const toDelete = existingIds.filter(id => !newIds.includes(id));

            if (toDelete.length > 0) {
                await supabase.from("quick_links").delete().in("id", toDelete);
            }
        }

        // Upsert new/updated links
        // @ts-ignore
        await supabase.from("quick_links").upsert(formatted);
    } catch (e) {
        console.warn("Supabase sync failed, using LocalStorage fallback:", e);
    }
}

export async function saveCaption(data: Omit<PostCaption, 'id' | 'created_at' | 'user_id'>): Promise<void> {
    try {
        const supabase = createClient();
        // @ts-ignore
        await supabase.from("post_captions").insert({
            user_id: '00000000-0000-0000-0000-000000000001',
            ...data
        });
    } catch (e) {
        console.error("Failed to save caption locally", e);
    }
}

export async function getRecentCaptions(): Promise<PostCaption[]> {
    try {
        const supabase = createClient();
        // @ts-ignore
        const { data, error } = await supabase.from("post_captions").select("*").order("created_at", { ascending: false }).limit(20);
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
}

export async function savePostAnalytics(data: Omit<PostAnalytics, 'id' | 'created_at' | 'user_id'>): Promise<void> {
    try {
        const supabase = createClient();
        // @ts-ignore
        await supabase.from("post_analytics").insert({
            user_id: '00000000-0000-0000-0000-000000000001',
            ...data
        });
    } catch (e) {
        console.error("Failed to save analytics", e);
    }
}

export async function getPostAnalytics(): Promise<PostAnalytics[]> {
    try {
        const supabase = createClient();
        // @ts-ignore
        const { data, error } = await supabase.from("post_analytics").select("*").order("posted_date", { ascending: false });
        if (error) throw error;
        return data || [];
    } catch (e) {
        return [];
    }
}
