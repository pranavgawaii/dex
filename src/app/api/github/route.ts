import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export async function GET() {
    try {
        const username = process.env.GITHUB_USERNAME;
        const token = process.env.GITHUB_TOKEN;

        if (!username || !token) {
            return NextResponse.json({
                error: 'GitHub credentials missing from .env.local',
                todayCommits: 0,
                streak: 0
            }, { status: 400 });
        }

        // GraphQL query explicitly for contribution calendar
        const query = `
            query {
                user(login: "${username}") {
                    contributionsCollection {
                        contributionCalendar {
                            totalContributions
                            weeks {
                                contributionDays {
                                    contributionCount
                                    date
                                }
                            }
                        }
                    }
                }
            }
        `;

        const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query }),
        });

        if (!response.ok) {
            throw new Error(`GitHub API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.errors) {
            console.error('GitHub GraphQL errors:', data.errors);
            throw new Error('GraphQL Query Error');
        }

        const weeks = data.data.user.contributionsCollection.contributionCalendar.weeks;

        let todayCommits = 0;
        let streak = 0;

        // Calculate streak by iterating backwards through all days
        const allDays = weeks.flatMap((w: any) => w.contributionDays).reverse();

        for (let i = 0; i < allDays.length; i++) {
            const day = allDays[i];

            if (i === 0) {
                // Today
                todayCommits = day.contributionCount;
                if (day.contributionCount > 0) {
                    streak++;
                }
                // If 0 commits today, we still check yesterday to see if there WAS an active streak
            } else {
                if (day.contributionCount > 0) {
                    streak++;
                } else {
                    // Streak broke
                    break;
                }
            }
        }

        return NextResponse.json({
            todayCommits,
            streak,
            totalContributions: data.data.user.contributionsCollection.contributionCalendar.totalContributions,
            weeks
        });

    } catch (error) {
        console.error('GitHub API Route error:', error);
        return NextResponse.json({
            error: 'Failed to fetch GitHub stats',
            todayCommits: 0,
            streak: 0
        }, { status: 500 });
    }
}
