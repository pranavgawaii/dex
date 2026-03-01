import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
    try {
        const username = process.env.LEETCODE_USERNAME;

        if (!username) {
            return NextResponse.json({
                error: 'LeetCode username missing from .env.local',
                todaySolved: 0,
                totalSolved: 0,
                easy: 0,
                medium: 0,
                hard: 0
            }, { status: 400 });
        }

        // LeetCode's public GraphQL API endpoint
        const endpoint = 'https://leetcode.com/graphql';

        const query = `
            query userProblemsSolved($username: String!) {
                allQuestionsCount {
                    difficulty
                    count
                }
                matchedUser(username: $username) {
                    problemsSolvedBeatsStats {
                        difficulty
                        percentage
                    }
                    submitStatsGlobal {
                        acSubmissionNum {
                            difficulty
                            count
                        }
                    }
                }
                recentAcSubmissionList(username: $username, limit: 15) {
                    title
                    timestamp
                }
            }
        `;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com'
            },
            body: JSON.stringify({
                query,
                variables: { username }
            }),
        });

        if (!response.ok) {
            throw new Error(`LeetCode API returned ${response.status}`);
        }

        const data = await response.json();

        if (data.errors) {
            throw new Error('GraphQL Error');
        }

        const stats = data.data.matchedUser.submitStatsGlobal.acSubmissionNum;

        // Find total, easy, medium, hard
        const total = stats.find((s: any) => s.difficulty === 'All')?.count || 0;
        const easy = stats.find((s: any) => s.difficulty === 'Easy')?.count || 0;
        const medium = stats.find((s: any) => s.difficulty === 'Medium')?.count || 0;
        const hard = stats.find((s: any) => s.difficulty === 'Hard')?.count || 0;

        // Calculate if they solved anything today by looking at recent AcSubmissionList
        const recentSubmissions = data.data.recentAcSubmissionList || [];

        // Start of today midnight in ms
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayStartMs = todayStart.getTime();

        let todaySolved = 0;

        // Count unique problems solved today
        const solvedTodayTitles = new Set();
        for (const sub of recentSubmissions) {
            // LeetCode timestamp is in seconds, convert to ms
            const subMs = parseInt(sub.timestamp) * 1000;
            if (subMs >= todayStartMs) {
                solvedTodayTitles.add(sub.title);
            }
        }
        todaySolved = solvedTodayTitles.size;

        return NextResponse.json({
            totalSolved: total,
            easy,
            medium,
            hard,
            todaySolved,
            recentSubmissions
        });

    } catch (error) {
        console.error('LeetCode API Route error:', error);
        return NextResponse.json({
            error: 'Failed to fetch LeetCode stats',
            todaySolved: 0,
            totalSolved: 0,
            easy: 0,
            medium: 0,
            hard: 0,
            recentSubmissions: []
        }, { status: 500 });
    }
}
