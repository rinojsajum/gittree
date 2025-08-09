class GitHub2DContributionTree {
    constructor() {
        this.canvas = document.getElementById('treeCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.username = '';
        this.contributions = 0;
        this.linesOfCode = 0;
        this.treeLevel = 'Seed';
        this.animationId = null;

        // Tree growth parameters
        this.branches = [];
        this.leaves = [];
        this.particles = [];

        // Enhanced L-system parameters
        this.angle = 22.5; // Base angle for branching
        this.angleVariation = 8; // Random variation in angle
        this.branchLength = 25; // Base segment length
        this.lengthDecay = 0.75; // How much shorter each level gets
        this.thicknessDecay = 0.7; // How much thinner each level gets
        this.axiom = 'X';
        
        // Multiple rule sets for variety
        this.ruleSets = [
            {
                'X': 'F[+X][-X]FX',
                'F': 'FF'
            },
            {
                'X': 'F-[[X]+X]+F[+FX]-X',
                'F': 'FF'
            },
            {
                'X': 'F[+X]F[-X]+X',
                'F': 'F[+F]F'
            },
            {
                'X': 'F[++X][--X]FX',
                'F': 'F+F-F'
            }
        ];
        
        this.currentRules = this.ruleSets[0];

        this.setupEventListeners();
        this.resizeCanvas();
        this.drawSeed();

        // Handle window resize
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupEventListeners() {
        document.getElementById('growTree').addEventListener('click', () => this.fetchGitHubData());
        document.getElementById('reset').addEventListener('click', () => this.resetTree());
        document.getElementById('toggleEmbed').addEventListener('click', () => this.toggleEmbedInfo());
        document.getElementById('copyEmbed').addEventListener('click', () => this.copyEmbedCode());

        // Allow Enter key in username input
        document.getElementById('username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.fetchGitHubData();
            }
        });
    }

    resizeCanvas() {
        const container = this.canvas.parentElement;
        const rect = container.getBoundingClientRect();
        this.canvas.width = Math.min(800, rect.width - 40);
        this.canvas.height = Math.min(600, window.innerHeight * 0.6);

        // Redraw current state
        if (this.contributions === 0) {
            this.drawSeed();
        } else {
            this.drawTree();
        }
    }

    async fetchGitHubData() {
        const username = document.getElementById('username').value.trim();
        if (!username) {
            this.showMessage('Please enter a GitHub username!', 'error');
            return;
        }

        this.username = username;
        const button = document.getElementById('growTree');
        const originalText = button.textContent;
        button.innerHTML = 'Growing Tree... <span class="loading"></span>';
        button.disabled = true;

        try {
            const data = await this.fetchRealGitHubData(username);
            this.contributions = data.contributions;
            this.linesOfCode = data.linesOfCode;
            this.updateTreeLevel();
            this.updateStats();
            this.growTree();
            this.showMessage(`Tree grown for ${username}! 🌱✨`);
        } catch (error) {
            console.error('Error fetching GitHub data:', error.message);
            this.showMessage('Error fetching data. Using demo values.', 'error');
            this.contributions = Math.floor(Math.random() * 1000) + 50;
            this.linesOfCode = this.contributions * 50;
            this.updateTreeLevel();
            this.updateStats();
            this.growTree();
        }

        button.textContent = originalText;
        button.disabled = false;
    }

    async fetchRealGitHubData(username) {
        try {
            const [userData, reposData] = await Promise.all([
                this.fetchGitHubUser(username),
                this.fetchGitHubRepos(username)
            ]);
            const stats = this.calculateContributionStats(userData, reposData);
            return stats;
        } catch (error) {
            console.error('Error fetching real GitHub data:', error.message);
            return {
                contributions: 100,
                linesOfCode: 5000,
                error: error.message
            };
        }
    }

    async fetchGitHubUser(username) {
        const response = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GitHub-Tree-App'
            }
        });
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`User "${username}" not found`);
            } else if (response.status === 403) {
                throw new Error('GitHub API rate limit exceeded. Please try again later.');
            } else {
                throw new Error(`GitHub API error: ${response.status}`);
            }
        }
        return await response.json();
    }

    async fetchGitHubRepos(username) {
        try {
            let allRepos = [];
            let page = 1;
            let hasMore = true;
            while (hasMore && page <= 5) {
                const response = await fetch(
                    `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated&direction=desc`, {
                        headers: {
                            'Accept': 'application/vnd.github.v3+json',
                            'User-Agent': 'GitHub-Tree-App'
                        }
                    }
                );
                if (!response.ok) {
                    console.warn(`Error fetching repos page ${page}:`, response.status);
                    break;
                }
                const repos = await response.json();
                allRepos = allRepos.concat(repos);
                hasMore = repos.length === 100;
                page++;
                if (hasMore) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            return allRepos;
        } catch (error) {
            console.warn('Error fetching repositories:', error.message);
            return [];
        }
    }

    calculateContributionStats(userData, reposData) {
        const accountCreated = new Date(userData.created_at);
        const accountAgeYears = (new Date() - accountCreated) / (1000 * 60 * 60 * 24 * 365);
        const originalRepos = reposData.filter(repo => !repo.fork);
        let totalContributions = 0;
        let estimatedLinesOfCode = 0;
        const languageStats = {};
        totalContributions += userData.public_repos * 5;
        totalContributions += Math.min(userData.followers * 2, 200);
        originalRepos.forEach(repo => {
            const repoSize = repo.size || 0;
            estimatedLinesOfCode += repoSize * 20;
            const stars = repo.stargazers_count || 0;
            const forks = repo.forks_count || 0;
            let repoContribution = Math.min(repoSize * 0.05, 30);
            repoContribution += Math.min(stars * 3, 100);
            repoContribution += Math.min(forks * 5, 50);
            const lastUpdate = new Date(repo.updated_at);
            const daysSinceUpdate = (new Date() - lastUpdate) / (1000 * 60 * 60 * 24);
            if (daysSinceUpdate < 30) repoContribution *= 1.5;
            else if (daysSinceUpdate < 90) repoContribution *= 1.2;
            totalContributions += repoContribution;
            if (repo.language) {
                languageStats[repo.language] = (languageStats[repo.language] || 0) + repoSize;
            }
        });
        const ageMultiplier = Math.min(1 + (accountAgeYears * 0.3), 3);
        totalContributions *= ageMultiplier;
        const activityMultiplier = 0.8 + (Math.random() * 0.4);
        totalContributions *= activityMultiplier;
        if (originalRepos.length > 0) {
            totalContributions = Math.max(totalContributions, 50);
            estimatedLinesOfCode = Math.max(estimatedLinesOfCode, 1000);
        }
        return {
            contributions: Math.floor(totalContributions),
            linesOfCode: Math.floor(estimatedLinesOfCode),
            publicRepos: userData.public_repos,
            followers: userData.followers,
            originalRepos: originalRepos.length,
            accountAge: Math.floor(accountAgeYears * 365),
            primaryLanguage: this.getPrimaryLanguage(languageStats),
            languageStats: languageStats,
            userData: {
                name: userData.name,
                bio: userData.bio,
                location: userData.location,
                blog: userData.blog,
                avatar_url: userData.avatar_url
            }
        };
    }

    getPrimaryLanguage(languageStats) {
        if (!languageStats || Object.keys(languageStats).length === 0) {
            return 'Unknown';
        }
        return Object.entries(languageStats)
            .sort(([, a], [, b]) => b - a)[0][0];
    }

    updateTreeLevel() {
        if (this.contributions === 0) {
            this.treeLevel = 'Seed';
        } else if (this.contributions <= 50) {
            this.treeLevel = 'Sprout';
        } else if (this.contributions <= 200) {
            this.treeLevel = 'Sapling';
        } else if (this.contributions <= 500) {
            this.treeLevel = 'Mature Tree';
        } else {
            this.treeLevel = 'Ancient Tree';
        }
    }

    updateStats() {
        document.getElementById('totalContributions').textContent = this.contributions;
        document.getElementById('linesOfCode').textContent = this.linesOfCode.toLocaleString();
        document.getElementById('treeLevel').textContent = this.treeLevel;
    }

    showMessage(message, type = 'success') {
        const messageEl = document.getElementById('growthMessage');
        messageEl.textContent = message;
        messageEl.className = `growth-message show ${type}`;
        setTimeout(() => {
            messageEl.classList.remove('show');
        }, 3000);
    }

    toggleEmbedInfo() {
        const embedInfo = document.getElementById('embedInfo');
        const isVisible = embedInfo.style.display !== 'none';
        embedInfo.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            this.updateEmbedCode();
        }
    }

    updateEmbedCode() {
        const baseUrl = window.location.origin + window.location.pathname;
        const username = document.getElementById('username').value || 'YOUR_USERNAME';
        const embedUrl = `${baseUrl.replace('index.html', 'tree-svg.php')}?user=${username}`;
        const embedCode = `<div align="center">
  <img src="${embedUrl}" alt="${username}'s GitHub Contribution Tree" width="600" height="400"/>
</div>

<div align="center">
  <a href="${baseUrl}?user=${username}">
    <img src="${embedUrl}" alt="View ${username}'s Contribution Tree" width="600" height="400"/>
  </a>
</div>`;
        document.getElementById('embedCode').textContent = embedCode;
    }

    copyEmbedCode() {
        const embedCode = document.getElementById('embedCode').textContent;
        navigator.clipboard.writeText(embedCode).then(() => {
            const button = document.getElementById('copyEmbed');
            const originalText = button.textContent;
            button.textContent = 'Copied!';
            setTimeout(() => {
                button.textContent = originalText;
            }, 2000);
        });
    }

    resetTree() {
        this.contributions = 0;
        this.linesOfCode = 0;
        this.treeLevel = 'Seed';
        this.branches = [];
        this.leaves = [];
        this.particles = [];
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        this.updateStats();
        this.drawSeed();
        document.getElementById('username').value = '';
        this.showMessage('Tree reset to seed! 🌱');
    }

    drawSeed() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height - 50;
        this.drawGround();
        
        // Draw seed
        this.ctx.fillStyle = '#8B4513';
        this.ctx.beginPath();
        this.ctx.ellipse(centerX, centerY - 10, 8, 12, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // Small sprout for very low contributions
        if (this.contributions > 0 && this.contributions <= 10) {
            this.ctx.strokeStyle = '#4CAF50';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY - 10);
            this.ctx.lineTo(centerX, centerY - 25);
            this.ctx.stroke();
        }
    }

    drawGround() {
        const groundY = this.canvas.height - 30;
        this.ctx.fillStyle = '#8B7355';
        this.ctx.fillRect(0, groundY, this.canvas.width, 30);
        
        // Draw grass
        this.ctx.strokeStyle = '#4CAF50';
        this.ctx.lineWidth = 1;
        for (let i = 0; i < this.canvas.width; i += 5) {
            const grassHeight = Math.random() * 8 + 3;
            this.ctx.beginPath();
            this.ctx.moveTo(i, groundY);
            this.ctx.lineTo(i, groundY - grassHeight);
            this.ctx.stroke();
        }
    }

    growTree() {
        // Select rule set based on contribution level for variety
        const ruleIndex = Math.floor(this.contributions / 150) % this.ruleSets.length;
        this.currentRules = this.ruleSets[ruleIndex];
        
        this.generateTreeStructure();
        this.animateTreeGrowth();
    }

    generateTreeStructure() {
        this.branches = [];
        this.leaves = [];

        // Calculate parameters based on contributions and canvas size
        const baseSize = Math.min(this.canvas.width, this.canvas.height);
        const sizeScale = baseSize / 600; // Scale relative to 600px reference
        
        // Determine iterations based on contributions (better scaling)
        let iterations;
        if (this.contributions <= 25) iterations = 2;
        else if (this.contributions <= 75) iterations = 3;
        else if (this.contributions <= 200) iterations = 4;
        else if (this.contributions <= 500) iterations = 5;
        else iterations = Math.min(6, 5 + Math.floor(this.contributions / 1000));

        // Adjust parameters based on contributions and canvas size
        this.branchLength = Math.max(15, Math.min(35, (20 + Math.sqrt(this.contributions) * 0.5) * sizeScale));
        this.angle = 22.5 + (this.contributions % 100) * 0.1; // Slight variation based on contributions
        
        // Generate the L-system string
        let lsystemString = this.axiom;
        for (let i = 0; i < iterations; i++) {
            lsystemString = this.applyRules(lsystemString);
        }

        // Interpret the L-system string to draw the tree
        this.interpretLSystem(lsystemString);

        // Generate additional leaves
        this.generateLeaves();
    }

    applyRules(str) {
        let newString = '';
        for (const char of str) {
            newString += this.currentRules[char] || char;
        }
        return newString;
    }

    interpretLSystem(str) {
        const centerX = this.canvas.width / 2;
        const groundY = this.canvas.height - 30;
        const stateStack = [];

        let currentX = centerX;
        let currentY = groundY;
        let currentAngle = -Math.PI / 2; // Pointing straight up

        // Dynamic sizing based on contributions and canvas
        const baseThickness = Math.max(3, Math.min(15, this.contributions / 30 + 3));
        const maxLength = this.branchLength;
        
        let currentLength = maxLength;
        let currentThickness = baseThickness;
        let branchLevel = 0;

        for (const char of str) {
            switch (char) {
                case 'F':
                    // Add some natural randomness to branch direction
                    const angleVariation = (Math.random() - 0.5) * this.angleVariation * (Math.PI / 180);
                    const actualAngle = currentAngle + angleVariation;
                    
                    // Calculate end position with slight curve for natural look
                    const endX = currentX + currentLength * Math.cos(actualAngle);
                    const endY = currentY + currentLength * Math.sin(actualAngle);

                    this.branches.push({
                        startX: currentX,
                        startY: currentY,
                        endX: endX,
                        endY: endY,
                        thickness: Math.max(1, currentThickness),
                        level: branchLevel,
                        grown: false,
                        color: this.getBranchColor(branchLevel)
                    });

                    currentX = endX;
                    currentY = endY;
                    break;
                    
                case 'X':
                    // X can represent leaf/flower points
                    this.leaves.push({
                        x: currentX + (Math.random() - 0.5) * 10,
                        y: currentY + (Math.random() - 0.5) * 10,
                        size: Math.random() * 3 + 2,
                        color: this.getLeafColor(),
                        rotation: Math.random() * Math.PI * 2,
                        grown: false,
                        opacity: 0,
                        type: Math.random() > 0.7 ? 'flower' : 'leaf'
                    });
                    break;
                    
                case '+':
                    // Turn right with some randomness
                    currentAngle += this.angle * (Math.PI / 180) * (0.8 + Math.random() * 0.4);
                    break;
                    
                case '-':
                    // Turn left with some randomness
                    currentAngle -= this.angle * (Math.PI / 180) * (0.8 + Math.random() * 0.4);
                    break;
                    
                case '[':
                    // Push state
                    stateStack.push({
                        x: currentX,
                        y: currentY,
                        angle: currentAngle,
                        length: currentLength,
                        thickness: currentThickness,
                        level: branchLevel
                    });
                    
                    // Reduce size for sub-branches
                    currentLength *= this.lengthDecay;
                    currentThickness *= this.thicknessDecay;
                    branchLevel++;
                    break;
                    
                case ']':
                    // Pop state
                    if (stateStack.length > 0) {
                        const state = stateStack.pop();
                        currentX = state.x;
                        currentY = state.y;
                        currentAngle = state.angle;
                        currentLength = state.length;
                        currentThickness = state.thickness;
                        branchLevel = state.level;
                    }
                    break;
            }
        }
    }

    getBranchColor(level) {
        // Darker browns for trunk, lighter for branches
        const hue = 25 + level * 5;
        const saturation = Math.max(20, 60 - level * 8);
        const lightness = Math.max(15, 25 - level * 2);
        return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }

    generateLeaves() {
        // Generate leaves along branches for a fuller look
        const leafDensity = Math.min(this.contributions / 10, 80);
        const targetLeafCount = Math.floor(leafDensity);

        // Add leaves to existing branches (except trunk)
        this.branches.forEach((branch, index) => {
            if (branch.level > 0 && Math.random() > 0.3) {
                const leafCount = Math.max(1, Math.floor(Math.random() * 3));
                for (let i = 0; i < leafCount; i++) {
                    const t = Math.random();
                    const leafX = branch.startX + (branch.endX - branch.startX) * t;
                    const leafY = branch.startY + (branch.endY - branch.startY) * t;

                    this.leaves.push({
                        x: leafX + (Math.random() - 0.5) * 12,
                        y: leafY + (Math.random() - 0.5) * 12,
                        size: Math.random() * 2.5 + 1.5,
                        color: this.getLeafColor(),
                        rotation: Math.random() * Math.PI * 2,
                        grown: false,
                        opacity: 0,
                        type: 'leaf'
                    });
                }
            }
        });

        // Limit total leaf count for performance
        if (this.leaves.length > targetLeafCount) {
            this.leaves = this.leaves.slice(0, targetLeafCount);
        }
    }

    getLeafColor() {
        // Seasonal colors based on contribution level
        const seasonColors = [
            ['#4CAF50', '#66BB6A', '#81C784'], // Spring greens
            ['#8BC34A', '#9CCC65', '#AED581'], // Summer greens
            ['#FFC107', '#FFD54F', '#FFEE58'], // Autumn yellows
            ['#FF9800', '#FFB74D', '#FFCC02'], // Autumn oranges
            ['#F44336', '#EF5350', '#E57373']  // Autumn reds
        ];
        
        const season = Math.floor(this.contributions / 100) % seasonColors.length;
        const colorGroup = seasonColors[season];
        return colorGroup[Math.floor(Math.random() * colorGroup.length)];
    }

    animateTreeGrowth() {
        let branchIndex = 0;
        let leafIndex = 0;
        const startTime = Date.now();
        
        // Adjust timing based on tree complexity
        const branchGrowthDuration = Math.max(1500, this.branches.length * 8);
        const leafGrowthStart = branchGrowthDuration * 0.7;

        const animate = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.drawGround();

            const elapsed = Date.now() - startTime;

            // Grow branches progressively
            if (branchIndex < this.branches.length) {
                const branchesPerFrame = Math.max(1, Math.ceil(this.branches.length / (branchGrowthDuration / 16)));
                for (let i = 0; i < branchesPerFrame && branchIndex < this.branches.length; i++) {
                    this.branches[branchIndex].grown = true;
                    branchIndex++;
                }
            }

            // Draw grown branches
            this.branches.forEach(branch => {
                if (branch.grown) {
                    this.drawBranch(branch);
                }
            });

            // Start growing leaves after most branches are grown
            if (elapsed > leafGrowthStart && leafIndex < this.leaves.length) {
                const leavesPerFrame = Math.max(1, Math.ceil(this.leaves.length / 60));
                for (let i = 0; i < leavesPerFrame && leafIndex < this.leaves.length; i++) {
                    this.leaves[leafIndex].grown = true;
                    this.leaves[leafIndex].opacity = Math.random() * 0.3 + 0.7; // Slight opacity variation
                    leafIndex++;
                }
            }

            // Draw grown leaves
            this.leaves.forEach(leaf => {
                if (leaf.grown) {
                    this.drawLeaf(leaf);
                }
            });

            // Add floating particles for mature trees
            if (elapsed > branchGrowthDuration && this.contributions > 100 && Math.random() > 0.97) {
                this.createParticle();
            }

            this.updateParticles();

            // Continue animation until everything is grown
            if (branchIndex < this.branches.length || 
                leafIndex < this.leaves.length || 
                elapsed < branchGrowthDuration + 1000) {
                this.animationId = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    drawBranch(branch) {
        this.ctx.strokeStyle = branch.color;
        this.ctx.lineWidth = branch.thickness;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(branch.startX, branch.startY);
        this.ctx.lineTo(branch.endX, branch.endY);
        this.ctx.stroke();

        // Add texture to thicker branches
        if (branch.thickness > 5) {
            this.ctx.strokeStyle = `${branch.color}88`; // Semi-transparent
            this.ctx.lineWidth = 1;
            const segments = Math.floor(branch.thickness / 3);
            for (let i = 0; i < segments; i++) {
                const offset = (i - segments/2) * 2;
                this.ctx.beginPath();
                this.ctx.moveTo(branch.startX + offset, branch.startY);
                this.ctx.lineTo(branch.endX + offset, branch.endY);
                this.ctx.stroke();
            }
        }
    }

    drawLeaf(leaf) {
        this.ctx.save();
        this.ctx.globalAlpha = leaf.opacity;
        this.ctx.translate(leaf.x, leaf.y);
        this.ctx.rotate(leaf.rotation);
        
        if (leaf.type === 'flower') {
            // Draw simple flower
            this.ctx.fillStyle = '#FFB6C1';
            for (let i = 0; i < 5; i++) {
                this.ctx.save();
                this.ctx.rotate((i * 2 * Math.PI) / 5);
                this.ctx.beginPath();
                this.ctx.ellipse(0, -leaf.size, leaf.size * 0.6, leaf.size * 0.4, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
            // Flower center
            this.ctx.fillStyle = '#FFD700';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, leaf.size * 0.3, 0, Math.PI * 2);
            this.ctx.fill();
        } else {
            // Draw leaf
            this.ctx.fillStyle = leaf.color;
            this.ctx.beginPath();
            const size = leaf.size;
            
            // Create leaf shape
            this.ctx.moveTo(0, -size);
            this.ctx.quadraticCurveTo(size * 0.8, -size * 0.5, size * 0.5, 0);
            this.ctx.quadraticCurveTo(size * 0.8, size * 0.5, 0, size * 0.8);
            this.ctx.quadraticCurveTo(-size * 0.8, size * 0.5, -size * 0.5, 0);
            this.ctx.quadraticCurveTo(-size * 0.8, -size * 0.5, 0, -size);
            this.ctx.fill();
            
            // Leaf vein
            this.ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            this.ctx.lineWidth = 0.5;
            this.ctx.beginPath();
            this.ctx.moveTo(0, -size * 0.8);
            this.ctx.lineTo(0, size * 0.6);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
    }

    drawTree() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.drawGround();
        
        this.branches.forEach(branch => {
            if (branch.grown) {
                this.drawBranch(branch);
            }
        });
        
        this.leaves.forEach(leaf => {
            if (leaf.grown) {
                this.drawLeaf(leaf);
            }
        });
    }

    createParticle() {
        this.particles.push({
            x: Math.random() * this.canvas.width,
            y: this.canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: -Math.random() * 2 - 0.5,
            size: Math.random() * 2 + 1,
            color: this.getLeafColor(),
            life: 1,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * 0.1
        });
    }

    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.rotation += particle.rotationSpeed;
            particle.life -= 0.005;
            
            if (particle.life > 0) {
                this.ctx.save();
                this.ctx.globalAlpha = particle.life;
                this.ctx.translate(particle.x, particle.y);
                this.ctx.rotate(particle.rotation);
                this.ctx.fillStyle = particle.color;
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, particle.size, particle.size * 0.6, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
                return true;
            }
            return false;
        });
    }
}

// Initialize the tree when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new GitHub2DContributionTree();
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        GitHub2DContributionTree
    };
}