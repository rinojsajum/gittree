class GitHub3DContributionTree {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.treeGroup = null;
        this.particles = [];
        this.animationId = null;
        
        this.username = '';
        this.contributions = 0;
        this.linesOfCode = 0;
        this.treeLevel = 'Seed';
        
        // Tree components
        this.branches = [];
        this.leaves = [];
        this.trunk = null;
        
        this.init();
        this.setupEventListeners();
        this.handleURLParameters();
    }
    
    init() {
        const container = document.getElementById('tree3d');
        
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB);
        
        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 10);
        
        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Controls setup (only if not in embed mode)
        if (!this.isEmbedMode()) {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2;
        }
        
        // Lighting setup
        this.setupLighting();
        
        // Ground setup
        this.setupGround();
        
        // Tree group
        this.treeGroup = new THREE.Group();
        this.scene.add(this.treeGroup);
        
        // Initial seed
        this.drawSeed();
        
        // Start render loop
        this.animate();
        
        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 20, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Point light for warmth
        const pointLight = new THREE.PointLight(0xffaa00, 0.5, 100);
        pointLight.position.set(-10, 10, 10);
        this.scene.add(pointLight);
    }
    
    setupGround() {
        // Ground geometry
        const groundGeometry = new THREE.PlaneGeometry(50, 50);
        const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x8FBC8F });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Add some grass blades
        this.addGrass();
    }
    
    addGrass() {
        const grassGroup = new THREE.Group();
        
        for (let i = 0; i < 200; i++) {
            const grassGeometry = new THREE.ConeGeometry(0.02, 0.3, 3);
            const grassMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.25, 0.7, 0.3 + Math.random() * 0.3)
            });
            const grass = new THREE.Mesh(grassGeometry, grassMaterial);
            
            grass.position.x = (Math.random() - 0.5) * 40;
            grass.position.z = (Math.random() - 0.5) * 40;
            grass.position.y = 0.15;
            
            grass.rotation.y = Math.random() * Math.PI * 2;
            grass.scale.y = 0.5 + Math.random() * 0.5;
            
            grassGroup.add(grass);
        }
        
        this.scene.add(grassGroup);
    }
    
    setupEventListeners() {
        document.getElementById('growTree').addEventListener('click', () => this.fetchGitHubData());
        document.getElementById('reset').addEventListener('click', () => this.resetTree());
        document.getElementById('toggleEmbed').addEventListener('click', () => this.toggleEmbedInfo());
        document.getElementById('copyEmbed').addEventListener('click', () => this.copyEmbedCode());
        
        document.getElementById('username').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.fetchGitHubData();
            }
        });
    }
    
    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const username = urlParams.get('user');
        const embedMode = urlParams.get('embed');
        
        if (embedMode === 'true') {
            this.enableEmbedMode();
        }
        
        if (username) {
            document.getElementById('username').value = username;
            // Auto-load tree for embed mode
            if (embedMode === 'true') {
                setTimeout(() => this.fetchGitHubData(), 1000);
            }
        }
    }
    
    isEmbedMode() {
        return new URLSearchParams(window.location.search).get('embed') === 'true';
    }
    
    enableEmbedMode() {
        document.body.classList.add('embed-mode');
        // Remove orbit controls for embed mode
        if (this.controls) {
            this.controls.dispose();
            this.controls = null;
        }
        // Auto-rotate in embed mode
        this.autoRotate = true;
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
        const embedUrl = `${baseUrl}?user=${username}&embed=true`;
        
        const embedCode = `<!-- 3D GitHub Contribution Tree -->
<div align="center">
  <img src="${embedUrl}" alt="${username}'s GitHub Contribution Tree" width="600" height="400"/>
</div>

<!-- Alternative: Direct link -->
<div align="center">
  <a href="${baseUrl}?user=${username}">
    <img src="${embedUrl}" alt="View ${username}'s 3D Contribution Tree" width="600" height="400"/>
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
            const data = await this.simulateGitHubAPI(username);
            
            this.contributions = data.contributions;
            this.linesOfCode = data.linesOfCode;
            this.updateTreeLevel();
            this.updateStats();
            this.growTree();
            
            this.showMessage(`3D Tree grown for ${username}! 🌱✨`);
            
        } catch (error) {
            console.error('Error fetching GitHub data:', error);
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
    
    async simulateGitHubAPI(username) {
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const baseContributions = username.length * 20;
        const randomFactor = Math.random() * 500;
        
        return {
            contributions: Math.floor(baseContributions + randomFactor),
            linesOfCode: Math.floor((baseContributions + randomFactor) * 45)
        };
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
    
    resetTree() {
        this.contributions = 0;
        this.linesOfCode = 0;
        this.treeLevel = 'Seed';
        
        // Clear existing tree
        this.clearTree();
        
        this.updateStats();
        this.drawSeed();
        document.getElementById('username').value = '';
        this.showMessage('3D Tree reset to seed! 🌱');
    }
    
    clearTree() {
        // Remove all tree objects
        this.treeGroup.clear();
        this.branches = [];
        this.leaves = [];
        this.trunk = null;
    }
    
    drawSeed() {
        this.clearTree();
        
        // Create seed geometry
        const seedGeometry = new THREE.SphereGeometry(0.1, 8, 6);
        const seedMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const seed = new THREE.Mesh(seedGeometry, seedMaterial);
        seed.position.y = 0.1;
        seed.castShadow = true;
        
        this.treeGroup.add(seed);
        
        // Add tiny sprout if there are minimal contributions
        if (this.contributions > 0 && this.contributions <= 10) {
            const sproutGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
            const sproutMaterial = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
            const sprout = new THREE.Mesh(sproutGeometry, sproutMaterial);
            sprout.position.y = 0.25;
            this.treeGroup.add(sprout);
        }
    }
    
    growTree() {
        this.clearTree();
        this.generate3DTree();
        this.animate3DGrowth();
    }
    
    generate3DTree() {
        const trunkHeight = Math.min(8, 1 + (this.contributions * 0.01));
        const trunkRadius = Math.max(0.1, this.contributions / 1000);
        
        // Create trunk
        this.createTrunk(trunkHeight, trunkRadius);
        
        // Create branches
        this.createBranches(trunkHeight, trunkRadius);
        
        // Create leaves
        this.createLeaves();
        
        // Add particles
        this.createParticleSystem();
    }
    
    createTrunk(height, radius) {
        const trunkGeometry = new THREE.CylinderGeometry(radius, radius * 1.2, height, 8);
        const trunkMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x8B4513,
            roughness: 0.8
        });
        
        this.trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        this.trunk.position.y = height / 2;
        this.trunk.castShadow = true;
        this.trunk.scale.y = 0;
        
        this.treeGroup.add(this.trunk);
    }
    
    createBranches(trunkHeight, trunkRadius) {
        const numBranches = Math.min(20, Math.floor(this.contributions / 25) + 1);
        
        for (let i = 0; i < numBranches; i++) {
            const branchLevel = Math.floor(i / 4);
            const branchHeight = trunkHeight * (0.8 - branchLevel * 0.2);
            const branchLength = Math.max(1, trunkHeight * (0.6 - branchLevel * 0.1));
            const branchRadius = trunkRadius * (0.8 - branchLevel * 0.2);
            
            const angle = (i * Math.PI * 2) / (numBranches / (branchLevel + 1));
            const tilt = Math.PI / 6 + (branchLevel * Math.PI / 12);
            
            const branchGeometry = new THREE.CylinderGeometry(
                branchRadius * 0.5, 
                branchRadius, 
                branchLength, 
                6
            );
            const branchMaterial = new THREE.MeshLambertMaterial({ 
                color: new THREE.Color().setHSL(0.08, 0.6, 0.3 + branchLevel * 0.1)
            });
            
            const branch = new THREE.Mesh(branchGeometry, branchMaterial);
            
            // Position branch
            branch.position.y = branchHeight;
            branch.position.x = Math.cos(angle) * (trunkRadius + branchLength / 4);
            branch.position.z = Math.sin(angle) * (trunkRadius + branchLength / 4);
            
            // Rotate branch
            branch.rotation.z = Math.cos(angle) * tilt;
            branch.rotation.x = Math.sin(angle) * tilt;
            
            branch.castShadow = true;
            branch.scale.y = 0;
            
            this.branches.push(branch);
            this.treeGroup.add(branch);
        }
    }
    
    createLeaves() {
        const leafCount = Math.min(200, this.contributions / 3);
        
        for (let i = 0; i < leafCount; i++) {
            const leafGeometry = new THREE.SphereGeometry(0.1, 6, 4);
            const leafColor = this.getSeasonalColor();
            const leafMaterial = new THREE.MeshLambertMaterial({ color: leafColor });
            
            const leaf = new THREE.Mesh(leafGeometry, leafMaterial);
            
            // Random position around branches
            const radius = 2 + Math.random() * 4;
            const height = 2 + Math.random() * 6;
            const angle = Math.random() * Math.PI * 2;
            
            leaf.position.x = Math.cos(angle) * radius;
            leaf.position.z = Math.sin(angle) * radius;
            leaf.position.y = height;
            
            leaf.scale.setScalar(0.5 + Math.random() * 0.5);
            leaf.visible = false;
            
            this.leaves.push(leaf);
            this.treeGroup.add(leaf);
        }
    }
    
    getSeasonalColor() {
        const colors = [0x4CAF50, 0x8BC34A, 0xCDDC39, 0xFFC107, 0xFF9800];
        const season = Math.floor(this.contributions / 200) % colors.length;
        return colors[season];
    }
    
    createParticleSystem() {
        const particleCount = Math.min(50, this.contributions / 10);
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 10;
            positions[i * 3 + 1] = Math.random() * 10;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x4CAF50,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });
        
        const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        particleSystem.visible = false;
        
        this.treeGroup.add(particleSystem);
        this.particles.push(particleSystem);
    }
    
    animate3DGrowth() {
        let progress = 0;
        const duration = 3000; // 3 seconds
        const startTime = Date.now();
        
        const animateGrowth = () => {
            const elapsed = Date.now() - startTime;
            progress = Math.min(elapsed / duration, 1);
            
            // Grow trunk
            if (this.trunk) {
                this.trunk.scale.y = this.easeOutCubic(progress);
            }
            
            // Grow branches
            this.branches.forEach((branch, index) => {
                const branchDelay = index * 100;
                const branchProgress = Math.max(0, (elapsed - branchDelay) / (duration - branchDelay));
                branch.scale.y = this.easeOutCubic(branchProgress);
            });
            
            // Show leaves
            if (progress > 0.6) {
                const leafProgress = (progress - 0.6) / 0.4;
                this.leaves.forEach((leaf, index) => {
                    if (index < this.leaves.length * leafProgress) {
                        leaf.visible = true;
                        const scale = this.easeOutBounce(leafProgress);
                        leaf.scale.setScalar((0.5 + Math.random() * 0.5) * scale);
                    }
                });
            }
            
            // Show particles
            if (progress > 0.8) {
                this.particles.forEach(particle => {
                    particle.visible = true;
                });
            }
            
            if (progress < 1) {
                requestAnimationFrame(animateGrowth);
            }
        };
        
        animateGrowth();
    }
    
    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }
    
    easeOutBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        // Auto-rotate in embed mode
        if (this.autoRotate && this.treeGroup) {
            this.treeGroup.rotation.y += 0.005;
        }
        
        // Update controls
        if (this.controls) {
            this.controls.update();
        }
        
        // Animate particles
        this.particles.forEach(particle => {
            if (particle.visible) {
                particle.rotation.y += 0.01;
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        const container = document.getElementById('tree3d');
        
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GitHub3DContributionTree();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GitHub3DContributionTree };
}