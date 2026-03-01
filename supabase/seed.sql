-- Insert Quick Links
INSERT INTO public.quick_links (id, label, url, icon_name, position, category) VALUES
(gen_random_uuid(), 'LeetCode', 'https://leetcode.com', 'Code', 1, 'Coding'),
(gen_random_uuid(), 'NeetCode', 'https://neetcode.io', 'BookOpen', 2, 'Coding'),
(gen_random_uuid(), 'GitHub', 'https://github.com/pranavgawai', 'Github', 3, 'Dev'),
(gen_random_uuid(), 'Supabase', 'https://app.supabase.com', 'Database', 4, 'Dev'),
(gen_random_uuid(), 'Railway', 'https://railway.app', 'Server', 5, 'Dev'),
(gen_random_uuid(), 'Vercel', 'https://vercel.com', 'Globe', 6, 'Dev'),
(gen_random_uuid(), 'PlacePro', 'https://placepro.in', 'Building2', 7, 'Project'),
(gen_random_uuid(), 'LinkedIn', 'https://linkedin.com/in/pranavgawai', 'Linkedin', 8, 'Social'),
(gen_random_uuid(), 'X', 'https://x.com/pranavgawai_', 'Twitter', 9, 'Social'),
(gen_random_uuid(), 'Coursera', 'https://coursera.org', 'GraduationCap', 10, 'Learning'),
(gen_random_uuid(), 'Judge0', 'https://ce.judge0.com', 'Terminal', 11, 'Tool'),
(gen_random_uuid(), 'CloudSkills', 'https://cloudskillsboost.google/paths/118', 'Cloud', 12, 'Learning');

-- Insert Metrics
INSERT INTO public.metrics (id, metric_key, metric_name, icon, current_value, target_value, unit) VALUES
(gen_random_uuid(), 'lc_solved', 'LeetCode Solved', 'Code', 50, 200, 'problems'),
(gen_random_uuid(), 'sql_done', 'SQL Problems', 'Database', 0, 50, 'problems'),
(gen_random_uuid(), 'github_stars', 'GitHub Stars', 'Star', 0, 50, 'stars'),
(gen_random_uuid(), 'x_followers', 'X Followers', 'Twitter', 62, 500, 'followers'),
(gen_random_uuid(), 'li_followers', 'LinkedIn Followers', 'Linkedin', 800, 1500, 'followers'),
(gen_random_uuid(), 'certs', 'Certs Earned', 'Award', 2, 5, 'certs'),
(gen_random_uuid(), 'gsoc_prs', 'GSoC PRs', 'GitPullRequest', 0, 3, 'prs'),
(gen_random_uuid(), 'mock_interviews', 'Mock Interviews', 'Users', 0, 20, 'interviews'),
(gen_random_uuid(), 'applications', 'Applications Sent', 'Send', 0, 100, 'apps');

-- Insert DSA Problems (Subset for Arrays & Hashing representing the structure)
INSERT INTO public.dsa_problems (number, title, pattern, difficulty, lc_url, nc_url) VALUES
(1, 'Contains Duplicate', 'Arrays & Hashing', 'Easy', '/problems/contains-duplicate', 'https://neetcode.io/problems/contains-duplicate'),
(2, 'Valid Anagram', 'Arrays & Hashing', 'Easy', '/problems/valid-anagram', 'https://neetcode.io/problems/valid-anagram'),
(3, 'Two Sum', 'Arrays & Hashing', 'Easy', '/problems/two-sum', 'https://neetcode.io/problems/two-sum'),
(4, 'Group Anagrams', 'Arrays & Hashing', 'Medium', '/problems/group-anagrams', 'https://neetcode.io/problems/group-anagrams'),
(5, 'Top K Frequent Elements', 'Arrays & Hashing', 'Medium', '/problems/top-k-frequent-elements', 'https://neetcode.io/problems/top-k-frequent-elements'),
(6, 'Product of Array Except Self', 'Arrays & Hashing', 'Medium', '/problems/product-of-array-except-self', 'https://neetcode.io/problems/product-of-array-except-self'),
(7, 'Valid Sudoku', 'Arrays & Hashing', 'Medium', '/problems/valid-sudoku', 'https://neetcode.io/problems/valid-sudoku'),
(8, 'Encode and Decode Strings', 'Arrays & Hashing', 'Medium', '/problems/encode-and-decode-strings', 'https://neetcode.io/problems/encode-and-decode-strings'),
(9, 'Longest Consecutive Sequence', 'Arrays & Hashing', 'Medium', '/problems/longest-consecutive-sequence', 'https://neetcode.io/problems/longest-consecutive-sequence'),
(10, 'Valid Palindrome', 'Two Pointers', 'Easy', '/problems/valid-palindrome', 'https://neetcode.io/problems/valid-palindrome'),
(11, 'Two Sum II', 'Two Pointers', 'Medium', '/problems/two-sum-ii-input-array-is-sorted', 'https://neetcode.io/problems/two-sum-ii-input-array-is-sorted'),
(12, '3Sum', 'Two Pointers', 'Medium', '/problems/3sum', 'https://neetcode.io/problems/3sum'),
(13, 'Best Time to Buy and Sell Stock', 'Sliding Window', 'Easy', '/problems/best-time-to-buy-and-sell-stock', 'https://neetcode.io/problems/best-time-to-buy-and-sell-stock'),
(14, 'Valid Parentheses', 'Stack', 'Easy', '/problems/valid-parentheses', 'https://neetcode.io/problems/valid-parentheses');

-- Insert SQL Problems Phase 1
INSERT INTO public.sql_problems (number, title, concept, phase, lc_url) VALUES
(1757, 'Recyclable and Low Fat Products', 'Select', 1, '/problems/recyclable-and-low-fat-products'),
(584, 'Find Customer Referee', 'Select', 1, '/problems/find-customer-referee'),
(595, 'Big Countries', 'Select', 1, '/problems/big-countries'),
(1148, 'Article Views I', 'Select', 1, '/problems/article-views-i'),
(1683, 'Invalid Tweets', 'Select', 1, '/problems/invalid-tweets'),
(1378, 'Replace Employee ID With The Unique Identifier', 'Joins', 1, '/problems/replace-employee-id-with-the-unique-identifier'),
(1068, 'Product Sales Analysis I', 'Joins', 1, '/problems/product-sales-analysis-i'),
(1581, 'Customer Who Visited but Did Not Make Any Transactions', 'Joins', 1, '/problems/customer-who-visited-but-did-not-make-any-transactions'),
(197, 'Rising Temperature', 'Joins', 1, '/problems/rising-temperature'),
(1661, 'Average Time of Process per Machine', 'Joins', 1, '/problems/average-time-of-process-per-machine'),
(577, 'Employee Bonus', 'Joins', 1, '/problems/employee-bonus'),
(1280, 'Students and Examinations', 'Joins', 1, '/problems/students-and-examinations'),
(570, 'Managers with at Least 5 Direct Reports', 'Joins', 1, '/problems/managers-with-at-least-5-direct-reports'),
(1934, 'Confirmation Rate', 'Joins', 1, '/problems/confirmation-rate');
