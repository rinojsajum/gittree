/**
 * GitHub API Integration for 3D Contribution Tree
 * 
 * This module provides real GitHub API integration to fetch actual contribution data.
 * Replace the simulated API calls in script.js with these functions for production use.
 */

class GitHubAPIIntegration {
    constructor(accessToken = null) {
        this.baseURL = 'https://api.github.com';
        this.graphqlURL = 'https://api.github.com/graphql';
        this.accessToken = accessToken;
        this.rateLimitRemaining = 60; // GitHub rate limit for unauthenticated requests
    }

    /**
     * Set GitHub personal access token for authenticated requests
     * This increases rate limits and allows access to private repos
     */
    setAccessToken(token) {
        this.accessToken = token;
    }

    /**
     * Get request headers with optional authentication
     */
    getHeaders() {
        const headers = {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': '3D-GitHub-Tree-App'
        };

        if (this.accessToken) {
            headers['Authorization'] = `token ${this.accessToken}`;
        }

        return headers;
    }

    /**
     * Fetch user basic information
     */
    async getUserData(username) {
        try {
            const response = await fetch(`${this.baseURL}/users/${username}`, {
                headers: this.getHeaders()
            });

            if (!response.ok) {
                throw new Error(`User not found: ${response.status}`);
            }

            const data = await response.json();
            this.updateRateLimit(response);

            return {
                username: data.login,
                name: data.name,
                bio: data.bio,
                publicRepos: data.public_repos,
                followers: data.followers,
                following: data.following,
                createdAt: new Date(data.created_at),
                avatarUrl: data.avatar_url
            };
        } catch (error) {
            throw new Error(`Error fetching user data: ${error.message}`);
        }
    }

    /**
     * Fetch user repositories with language and contribution data
     */
    async getUserRepositories(username, perPage = 100) {
        try {
            let allRepos = [];
            let page = 1;
            let hasMore = true;

            while (hasMore && page <= 10) { // Limit to 10 pages (1000 repos max)
                const response = await fetch(
                    `${this.baseURL}/users/${username}/repos?per_page=${perPage}&page=${page}&sort=updated&direction=desc`,
                    { headers: this.getHeaders() }
                );

                if (!response.ok) {
                    throw new Error(`Error fetching repositories: ${response.status}`);
                }

                const repos = await response.json();
                this.updateRateLimit(response);

                allRepos = allRepos.concat(repos);
                hasMore = repos.length === perPage;
                page++;

                // Small delay to respect rate limits
                await this.delay(100);
            }

            return allRepos.map(repo => ({
                name: repo.name,
                language: repo.language,
                size: repo.size,
                stargazers: repo.stargazers_count,
                forks: repo.forks_count,
                isPrivate: repo.private,
                isFork: repo.fork,
                createdAt: new Date(repo.created_at),
                updatedAt: new Date(repo.updated_at),
                pushedAt: repo.pushed_at ? new Date(repo.pushed_at) : null
            }));
        } catch (error) {
            throw new Error(`Error fetching repositories: ${error.message}`);
        }
    }

    /**
     * Fetch contribution statistics using GitHub GraphQL API
     * Note: Requires authentication token
     */
    async getContributionStats(username) {
        if (!this.accessToken) {
            console.warn('Access token required for contribution stats. Using repository-based estimation.');
            return await this.estimateContributionsFromRepos(username);
        }

        const query = `
            query($username: String!) {
                user(login: $username) {
                    contributionsCollection {
                        totalCommitContributions
                        totalIssueContributions
                        totalPullRequestContributions
                        totalRepositoryContributions
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
                    repositories(first: 100, isFork: false, ownerAffiliations: OWNER) {
                        nodes {
                            name
                            primaryLanguage {
                                name
                            }
                            languages(first: 10) {
                                edges {
                                    size
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            const response = await fetch(this.graphqlURL, {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: query,
                    variables: { username }
                })
            });

            if (!response.ok) {
                throw new Error(`GraphQL request failed: ${response.status}`);
            }

            const data = await response.json();
            this.updateRateLimit(response);

            if (data.errors) {
                throw new Error(`GraphQL errors: ${data.errors.map(e => e.message).join(', ')}`);
            }

            const user = data.data.user;
            const contributions = user.contributionsCollection;
            
            // Calculate lines of code estimation from language data
            let estimatedLines = 0;
            const languageStats = {};

            user.repositories.nodes.forEach(repo => {
                repo.languages.edges.forEach(edge => {
                    const language = edge.node.name;
                    const size = edge.size;
                    languageStats[language] = (languageStats[language] || 0) + size;
                    estimatedLines += size / 5; // Rough conversion from bytes to lines
                });
            });

            return {
                totalContributions: contributions.contributionCalendar.totalContributions,
                commitContributions: contributions.totalCommitContributions,
                issueContributions: contributions.totalIssueContributions,
                pullRequestContributions: contributions.totalPullRequestContributions,
                repositoryContributions: contributions.totalRepositoryContributions,
                estimatedLinesOfCode: Math.floor(estimatedLines),
                languageBreakdown: languageStats,
                contributionDays: this.processContributionCalendar(contributions.contributionCalendar)
            };
        } catch (error) {
            console.warn(`GraphQL API failed, falling back to estimation: ${error.message}`);
            return await this.estimateContributionsFromRepos(username);
        }
    }

    /**
     * Estimate contributions from repository data (fallback method)
     */
    async estimateContributionsFromRepos(username) {
        try {
            const repos = await this.getUserRepositories(username);
            const userData = await this.getUserData(username);

            // Filter out forks and focus on original repositories
            const originalRepos = repos.filter(repo => !repo.isFork);

            // Estimate contributions based on repository activity
            let totalEstimatedContributions = 0;
            let estimatedLinesOfCode = 0;
            const languageStats = {};

            originalRepos.forEach(repo => {
                // Estimate contributions based on repository size and stars
                const sizeContribution = Math.min(repo.size * 0.1, 50); // Cap per repo
                const popularityBonus = Math.min(repo.stargazers * 2, 100);
                const activityScore = this.calculateActivityScore(repo);

                totalEstimatedContributions += sizeContribution + popularityBonus + activityScore;

                // Estimate lines of code
                estimatedLinesOfCode += repo.size * 50; // Rough estimation

                // Track languages
                if (repo.language) {
                    languageStats[repo.language] = (languageStats[repo.language] || 0) + repo.size;
                }
            });

            // Account for account age
            const accountAgeYears = (new Date() - userData.createdAt) / (1000 * 60 * 60 * 24 * 365);
            const ageMultiplier = Math.min(accountAgeYears * 0.1 + 0.5, 2);

            return {
                totalContributions: Math.floor(totalEstimatedContributions * ageMultiplier),
                commitContributions: Math.floor(totalEstimatedContributions * 0.7),
                issueContributions: Math.floor(totalEstimatedContributions * 0.1),
                pullRequestContributions: Math.floor(totalEstimatedContributions * 0.15),
                repositoryContributions: originalRepos.length,
                estimatedLinesOfCode: Math.floor(estimatedLinesOfCode),
                languageBreakdown: languageStats,
                isEstimated: true
            };
        } catch (error) {
            throw new Error(`Error estimating contributions: ${error.message}`);
        }
    }

    /**
     * Calculate activity score based on repository metadata
     */
    calculateActivityScore(repo) {
        const now = new Date();
        const daysSinceUpdate = (now - repo.updatedAt) / (1000 * 60 * 60 * 24);
        const daysSincePush = repo.pushedAt ? (now - repo.pushedAt) / (1000 * 60 * 60 * 24) : daysSinceUpdate;

        // More recent activity gets higher scores
        let activityScore = 0;
        if (daysSinceUpdate < 30) activityScore += 20;
        else if (daysSinceUpdate < 90) activityScore += 10;
        else if (daysSinceUpdate < 365) activityScore += 5;

        if (daysSincePush < 7) activityScore += 15;
        else if (daysSincePush < 30) activityScore += 10;

        return activityScore;
    }

    /**
     * Process contribution calendar data
     */
    processContributionCalendar(calendar) {
        const contributionDays = [];
        
        calendar.weeks.forEach(week => {
            week.contributionDays.forEach(day => {
                contributionDays.push({
                    date: day.date,
                    count: day.contributionCount
                });
            });
        });

        return contributionDays;
    }

    /**
     * Update rate limit tracking
     */
    updateRateLimit(response) {
        const remaining = response.headers.get('X-RateLimit-Remaining');
        if (remaining) {
            this.rateLimitRemaining = parseInt(remaining);
        }
    }

    /**
     * Get current rate limit status
     */
    async getRateLimitStatus() {
        try {
            const response = await fetch(`${this.baseURL}/rate_limit`, {
                headers: this.getHeaders()
            });

            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.warn('Could not fetch rate limit status:', error.message);
        }

        return { remaining: this.rateLimitRemaining };
    }

    /**
     * Simple delay utility
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Get comprehensive GitHub statistics for tree generation
     */
    async getTreeData(username) {
        try {
            console.log(`Fetching GitHub data for ${username}...`);

            const [userData, contributionStats] = await Promise.all([
                this.getUserData(username),
                this.getContributionStats(username)
            ]);

            // Calculate tree parameters
            const treeData = {
                username: userData.username,
                displayName: userData.name || userData.username,
                contributions: contributionStats.totalContributions,
                linesOfCode: contributionStats.estimatedLinesOfCode,
                repositories: contributionStats.repositoryContributions,
                languages: Object.keys(contributionStats.languageBreakdown || {}),
                primaryLanguage: this.getPrimaryLanguage(contributionStats.languageBreakdown || {}),
                accountAge: Math.floor((new Date() - userData.createdAt) / (1000 * 60 * 60 * 24)),
                isEstimated: contributionStats.isEstimated || false,
                rateLimitRemaining: this.rateLimitRemaining
            };

            console.log('GitHub data successfully fetched:', treeData);
            return treeData;

        } catch (error) {
            console.error('Error fetching GitHub data:', error.message);
            throw error;
        }
    }

    /**
     * Get primary programming language
     */
    getPrimaryLanguage(languageBreakdown) {
        if (!languageBreakdown || Object.keys(languageBreakdown).length === 0) {
            return 'Unknown';
        }

        return Object.entries(languageBreakdown)
            .sort(([,a], [,b]) => b - a)[0][0];
    }
}

// Usage example:
/*
const githubAPI = new GitHubAPIIntegration();

// For public data (rate limited)
githubAPI.getTreeData('octocat').then(data => {
    console.log('Tree data:', data);
});

// For authenticated requests (higher rate limits)
githubAPI.setAccessToken('your_github_token_here');
githubAPI.getTreeData('your_username').then(data => {
    console.log('Authenticated tree data:', data);
});
*/

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GitHubAPIIntegration;
} else {
    window.GitHubAPIIntegration = GitHubAPIIntegration;
}
