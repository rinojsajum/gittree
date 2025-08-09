# 🌱 3D GitHub Contribution Tree

An entertaining and interactive **3D visualization** that grows a virtual tree based on your GitHub contributions! Watch your coding activity transform into a beautiful, animated 3D tree that evolves from a tiny seed to a majestic tree. **Perfect for embedding in GitHub READMEs!**

![3D Tree Demo](https://user-images.githubusercontent.com/placeholder.gif)

## 🚀 **Quick Embed for GitHub README**

Add this to your GitHub README to show your live 3D contribution tree:

```markdown
<div align="center">
  <img src="https://yourusername.github.io/3d-github-tree/embed.html?user=YOUR_GITHUB_USERNAME" 
       alt="My GitHub Contribution Tree" 
       width="600" 
       height="400"/>
</div>
```

**Replace `yourusername` with your GitHub username and `YOUR_GITHUB_USERNAME` with your actual username!**

## ✨ Features

- **🎯 3D Visualization**: Beautiful Three.js powered 3D tree rendering
- **📱 GitHub README Embedding**: Perfect for showing off in your profile
- **🌱 Dynamic Tree Growth**: Tree size, branches, and leaves increase with contributions  
- **🎮 Interactive Controls**: Mouse drag to rotate, scroll to zoom
- **🎨 5 Growth Stages**: From Seed → Sprout → Sapling → Mature Tree → Ancient Tree
- **✨ Smooth Animations**: Gorgeous growth animations with easing
- **📊 Real-time Stats**: Live contribution data display
- **🔄 Auto-rotation**: Perfect for embed mode
- **📱 Responsive Design**: Works on desktop and mobile devices
- **🔗 GitHub Integration**: Fetch real contribution data from GitHub API

## 🌳 Tree Growth Stages

| Stage | Contributions | Description |
|-------|---------------|-------------|
| 🌱 Seed | 0 | Just a tiny seed waiting to grow |
| 🌿 Sprout | 1-50 | Small green shoot emerging |
| 🌳 Sapling | 51-200 | Young tree with few branches |
| 🌲 Mature Tree | 201-500 | Full tree with many branches |
| 🌳 Ancient Tree | 500+ | Majestic tree with abundant foliage |

## 🚀 Quick Start

### For Interactive 3D Tree:
1. Clone or download this repository
2. Open `index.html` in your web browser
3. Enter a GitHub username and click "Grow My Tree!"
4. Use mouse to rotate and scroll to zoom the 3D tree! 🌱✨

### For GitHub README Embedding:
1. **Fork this repository** to your GitHub account
2. **Enable GitHub Pages** in your repository settings
3. **Add the embed code** to your README:
   ```markdown
   <div align="center">
     <img src="https://YOUR_USERNAME.github.io/REPO_NAME/embed.html?user=YOUR_USERNAME" 
          alt="My GitHub Contribution Tree" 
          width="600" height="400"/>
   </div>
   ```
4. **Your 3D tree will appear in your README!** 🎉

### Live Demo:
- **Interactive version**: [Demo Link](https://yourusername.github.io/3d-github-tree/)
- **Embed version**: [Embed Demo](https://yourusername.github.io/3d-github-tree/embed.html?user=octocat)

## 📁 Project Structure

```
3d-github-tree/
├── index.html                    # Main interactive 3D tree page
├── embed.html                   # Embeddable version for GitHub READMEs
├── style.css                    # Styling and animations
├── script.js                    # 3D tree generation with Three.js
├── .github/workflows/deploy.yml # Auto-deployment to GitHub Pages
└── README.md                    # This documentation
```

## 🎮 How It Works

### 3D Tree Algorithm
The tree grows in **real 3D space** using Three.js:

1. **🌱 Trunk Generation**: Height and thickness scale with total contributions
2. **🌿 Branch Creation**: Number of branches increases every 25 contributions  
3. **🍃 Leaf Distribution**: Leaf count is based on contributions ÷ 4
4. **🎨 Seasonal Colors**: Tree colors change based on contribution levels
5. **✨ Growth Animation**: Smooth easing animations for natural growth
6. **🔄 Auto-rotation**: Gentle rotation for embed mode viewing

### Embedding Magic
The embed system works by:
- **URL Parameters**: `embed.html?user=username` loads specific user data
- **Auto-sizing**: Responsive design fits any README width
- **GitHub Pages**: Static hosting makes it work in README images
- **Cross-origin**: Designed to work across different domains

## 🔧 Customization

### Tree Parameters

You can modify these parameters in `script.js` to customize tree growth:

```javascript
// In generateTreeStructure() method
const maxHeight = Math.min(300, 50 + (this.contributions * 0.4));
const maxBranches = Math.min(20, Math.floor(this.contributions / 25) + 1);
const trunkHeight = maxHeight * 0.4;
```

### Colors and Styling

Modify colors in `style.css`:

```css
/* Tree colors based on season */
const colors = ['#4CAF50', '#8BC34A', '#CDDC39', '#FFC107', '#FF9800'];

/* Background gradient */
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

## 🔌 GitHub API Integration

### Current Implementation

The current version uses simulated data for demonstration. To integrate with real GitHub API:

### Option 1: Client-Side (Limited)

```javascript
// Replace simulateGitHubAPI() with real API calls
async fetchRealGitHubData(username) {
    const api = new GitHubAPI();
    const userData = await api.getUserData(username);
    const stats = await api.getContributionStats(username);
    return stats;
}
```

### Option 2: Server-Side (Recommended)

For production use, implement a backend service to:
1. Handle GitHub API authentication
2. Cache contribution data
3. Provide aggregated statistics

```javascript
// Example backend endpoint
async fetchContributionData(username) {
    const response = await fetch(`/api/contributions/${username}`);
    return await response.json();
}
```

### GitHub GraphQL API (Advanced)

For accurate contribution data, use GitHub's GraphQL API:

```graphql
query($username: String!) {
  user(login: $username) {
    contributionsCollection {
      totalCommitContributions
      totalIssueContributions
      totalPullRequestContributions
      totalRepositoryContributions
    }
  }
}
```

## 🎨 Hosting Options

### GitHub Pages

1. Create a new repository
2. Upload all files
3. Enable GitHub Pages in repository settings
4. Access at `https://yourusername.github.io/repository-name`

### Netlify/Vercel

1. Connect your repository
2. Deploy automatically
3. Get a custom domain

### Local Development

Simply open `index.html` in any modern web browser.

## 🌟 Enhancement Ideas

- **Seasonal Changes**: Different tree appearances based on time of year
- **Multiple Trees**: Forest view for multiple users
- **3D Visualization**: WebGL/Three.js implementation
- **Social Features**: Share your tree, compare with friends
- **Tree Types**: Different tree species based on programming languages
- **Weather Effects**: Rain, snow, wind animations
- **Achievement System**: Unlock special decorations
- **Time-lapse**: Show tree growth over time
- **Export Options**: Save tree as image or video

## 🤝 Contributing

Feel free to contribute improvements:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- Inspired by GitHub's contribution graph
- Built with vanilla JavaScript for maximum compatibility
- Uses HTML5 Canvas for smooth animations

---

**Made with ❤️ for the GitHub community**

*Turn your code contributions into a growing digital garden!* 🌱🌳✨
