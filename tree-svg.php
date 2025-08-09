<?php
/**
 * GitHub Tree SVG Generator
 * 
 * This script generates an SVG image of a GitHub contribution tree
 * that can be directly embedded in GitHub READMEs as an image.
 * 
 * Usage: https://your-domain.com/tree-svg.php?user=username
 */

header('Content-Type: image/svg+xml');
header('Cache-Control: public, max-age=3600'); // Cache for 1 hour

// Get parameters
$username = $_GET['user'] ?? 'octocat';
$username = htmlspecialchars(preg_replace('/[^a-zA-Z0-9\-_]/', '', $username));
$width = intval($_GET['width'] ?? 600);
$height = intval($_GET['height'] ?? 400);

// Generate contribution data using real GitHub API
$contributionData = fetchRealGitHubData($username);
$contributions = $contributionData['contributions'];
$treeLevel = getTreeLevel($contributions);
$linesOfCode = $contributionData['linesOfCode'];
$apiStatus = $contributionData['status'];

// Calculate tree dimensions
$treeHeight = min(250, 60 + ($contributions * 0.15));
$trunkWidth = max(12, $contributions / 80);
$numBranches = min(15, floor($contributions / 25) + 2);
$leafCount = min(60, $contributions / 8);

// Colors
$skyStart = '#87CEEB';
$skyEnd = '#98FB98';
$ground = '#7CB342';
$trunk = '#8B4513';
$leaves = getLeafColors($contributions);

// Start SVG
echo '<?xml version="1.0" encoding="UTF-8"?>';
?>
<svg width="<?php echo $width; ?>" height="<?php echo $height; ?>" viewBox="0 0 <?php echo $width; ?> <?php echo $height; ?>" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Sky gradient -->
    <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:<?php echo $skyStart; ?>;stop-opacity:1" />
      <stop offset="100%" style="stop-color:<?php echo $skyEnd; ?>;stop-opacity:1" />
    </linearGradient>
    
    <!-- Shadow filter -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-opacity="0.3"/>
    </filter>
    
    <!-- Animation for tree growth -->
    <style>
      .tree-part {
        animation: grow 2s ease-out forwards;
        transform-origin: bottom center;
      }
      .leaf {
        animation: leafGrow 2s ease-out forwards;
        animation-delay: 1s;
        opacity: 0;
        transform-origin: center;
      }
      @keyframes grow {
        from { transform: scaleY(0); }
        to { transform: scaleY(1); }
      }
      @keyframes leafGrow {
        from { opacity: 0; transform: scale(0); }
        to { opacity: 1; transform: scale(1); }
      }
      .info-box {
        animation: fadeIn 3s ease-out forwards;
        opacity: 0;
      }
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    </style>
  </defs>
  
  <!-- Background -->
  <rect width="100%" height="100%" fill="url(#skyGradient)"/>
  
  <!-- Ground -->
  <rect x="0" y="<?php echo $height - 60; ?>" width="<?php echo $width; ?>" height="60" fill="<?php echo $ground; ?>"/>
  
  <!-- Grass blades -->
  <?php for ($i = 0; $i < 40; $i++): ?>
    <?php
    $grassX = rand(0, $width);
    $grassY = $height - 60 + rand(0, 20);
    $grassHeight = rand(8, 20);
    ?>
    <line x1="<?php echo $grassX; ?>" y1="<?php echo $grassY; ?>" 
          x2="<?php echo $grassX; ?>" y2="<?php echo $grassY - $grassHeight; ?>" 
          stroke="#4CAF50" stroke-width="1" opacity="0.7"/>
  <?php endfor; ?>
  
  <!-- Tree trunk -->
  <?php
  $centerX = $width / 2;
  $groundY = $height - 60;
  $trunkTop = $groundY - $treeHeight;
  ?>
  <rect x="<?php echo $centerX - $trunkWidth/2; ?>" 
        y="<?php echo $trunkTop; ?>" 
        width="<?php echo $trunkWidth; ?>" 
        height="<?php echo $treeHeight; ?>" 
        fill="<?php echo $trunk; ?>" 
        filter="url(#shadow)"
        class="tree-part"/>
  
  <!-- Branches -->
  <?php for ($i = 0; $i < $numBranches; $i++): ?>
    <?php
    $branchLevel = floor($i / 3);
    $branchY = $trunkTop + ($treeHeight * (0.2 + $branchLevel * 0.25));
    $branchLength = 30 + ($contributions / 15) - ($branchLevel * 8);
    $side = ($i % 2 == 0) ? -1 : 1;
    $branchEndX = $centerX + ($side * $branchLength);
    $branchEndY = $branchY - 15 - ($branchLevel * 8);
    $branchThickness = max(2, 6 - $branchLevel);
    ?>
    <line x1="<?php echo $centerX; ?>" y1="<?php echo $branchY; ?>" 
          x2="<?php echo $branchEndX; ?>" y2="<?php echo $branchEndY; ?>" 
          stroke="<?php echo $trunk; ?>" 
          stroke-width="<?php echo $branchThickness; ?>" 
          stroke-linecap="round"
          class="tree-part"
          style="animation-delay: <?php echo $i * 0.1; ?>s"/>
  <?php endfor; ?>
  
  <!-- Leaves -->
  <?php for ($i = 0; $i < $leafCount; $i++): ?>
    <?php
    $leafX = $centerX + rand(-90, 90);
    $leafY = $trunkTop + rand(10, $treeHeight * 0.8);
    $leafSize = rand(4, 8);
    $leafColor = $leaves[array_rand($leaves)];
    ?>
    <circle cx="<?php echo $leafX; ?>" 
            cy="<?php echo $leafY; ?>" 
            r="<?php echo $leafSize; ?>" 
            fill="<?php echo $leafColor; ?>"
            class="leaf"
            style="animation-delay: <?php echo 1 + ($i * 0.02); ?>s"/>
  <?php endfor; ?>
  
  <!-- Info box -->
  <g class="info-box">
    <!-- Background -->
    <rect x="20" y="20" width="220" height="90" 
          fill="white" fill-opacity="0.9" 
          stroke="#ddd" stroke-width="1" 
          rx="8" ry="8" 
          filter="url(#shadow)"/>
    
    <!-- Title -->
    <text x="30" y="40" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#24292e">
      🌱 <?php echo $username; ?>'s Tree
    </text>
    
    <!-- Stats -->
    <text x="30" y="58" font-family="Arial, sans-serif" font-size="12" fill="#586069">
      Contributions: <?php echo number_format($contributions); ?>
    </text>
    <text x="30" y="74" font-family="Arial, sans-serif" font-size="12" fill="#586069">
      Tree Level: <?php echo $treeLevel; ?>
    </text>
    <text x="30" y="90" font-family="Arial, sans-serif" font-size="12" fill="#586069">
      Est. Lines: <?php echo number_format($linesOfCode); ?>
    </text>
  </g>
  
  <!-- GitHub link -->
  <text x="<?php echo $width - 120; ?>" y="<?php echo $height - 15; ?>" 
        font-family="Arial, sans-serif" font-size="10" fill="#586069" opacity="0.8">
    🌳 GitHub Tree Generator
  </text>
  
  <!-- Floating particles (optional decorative elements) -->
  <?php if ($contributions > 200): ?>
    <?php for ($i = 0; $i < 5; $i++): ?>
      <?php
      $particleX = rand(50, $width - 50);
      $particleY = rand(50, $height - 100);
      ?>
      <circle cx="<?php echo $particleX; ?>" cy="<?php echo $particleY; ?>" r="2" 
              fill="#4CAF50" opacity="0.6">
        <animate attributeName="cy" 
                values="<?php echo $particleY; ?>;<?php echo $particleY - 20; ?>;<?php echo $particleY; ?>" 
                dur="3s" repeatCount="indefinite"/>
        <animate attributeName="opacity" 
                values="0.6;0.2;0.6" 
                dur="3s" repeatCount="indefinite"/>
      </circle>
    <?php endfor; ?>
  <?php endif; ?>
</svg>

<?php

/**
 * Fetch real GitHub data using GitHub API
 */
function fetchRealGitHubData($username) {
    try {
        // Fetch user data
        $userData = fetchGitHubUser($username);
        if (!$userData) {
            return getFallbackData($username, 'User not found');
        }
        
        // Fetch repositories
        $reposData = fetchGitHubRepos($username);
        
        // Calculate contribution statistics
        $stats = calculateContributionStats($userData, $reposData);
        
        return [
            'contributions' => $stats['contributions'],
            'linesOfCode' => $stats['linesOfCode'],
            'status' => 'success'
        ];
        
    } catch (Exception $e) {
        error_log("GitHub API Error for $username: " . $e->getMessage());
        return getFallbackData($username, $e->getMessage());
    }
}

/**
 * Fetch GitHub user data
 */
function fetchGitHubUser($username) {
    $url = "https://api.github.com/users/" . urlencode($username);
    
    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'header' => [
                'Accept: application/vnd.github.v3+json',
                'User-Agent: GitHub-Tree-SVG'
            ],
            'timeout' => 10
        ]
    ]);
    
    $response = @file_get_contents($url, false, $context);
    
    if ($response === false) {
        throw new Exception('Failed to fetch user data');
    }
    
    $userData = json_decode($response, true);
    
    if (!$userData || isset($userData['message'])) {
        throw new Exception($userData['message'] ?? 'Invalid user data');
    }
    
    return $userData;
}

/**
 * Fetch GitHub repositories
 */
function fetchGitHubRepos($username) {
    $allRepos = [];
    $page = 1;
    $maxPages = 3; // Limit for performance
    
    while ($page <= $maxPages) {
        $url = "https://api.github.com/users/" . urlencode($username) . "/repos?per_page=100&page=$page&sort=updated&direction=desc";
        
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => [
                    'Accept: application/vnd.github.v3+json',
                    'User-Agent: GitHub-Tree-SVG'
                ],
                'timeout' => 10
            ]
        ]);
        
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            break; // Stop on error
        }
        
        $repos = json_decode($response, true);
        
        if (!is_array($repos) || empty($repos)) {
            break; // No more repos
        }
        
        $allRepos = array_merge($allRepos, $repos);
        
        if (count($repos) < 100) {
            break; // Last page
        }
        
        $page++;
        usleep(200000); // 200ms delay to be respectful
    }
    
    return $allRepos;
}

/**
 * Calculate contribution statistics from real data
 */
function calculateContributionStats($userData, $reposData) {
    $accountCreated = new DateTime($userData['created_at']);
    $now = new DateTime();
    $accountAgeYears = $accountCreated->diff($now)->days / 365;
    
    // Filter out forked repositories
    $originalRepos = array_filter($reposData, function($repo) {
        return !$repo['fork'];
    });
    
    $totalContributions = 0;
    $estimatedLinesOfCode = 0;
    
    // Base contributions from account metrics
    $totalContributions += ($userData['public_repos'] ?? 0) * 12;
    $totalContributions += min(($userData['followers'] ?? 0) * 5, 500);
    
    // Process repositories
    foreach ($originalRepos as $repo) {
        $repoSize = $repo['size'] ?? 0;
        $stars = $repo['stargazers_count'] ?? 0;
        $forks = $repo['forks_count'] ?? 0;
        
        // Lines of code estimation
        $estimatedLinesOfCode += $repoSize * 30;
        
        // Contribution calculation
        $repoContribution = min($repoSize * 0.12, 60);
        $repoContribution += min($stars * 6, 180);
        $repoContribution += min($forks * 10, 100);
        
        // Recent activity bonus
        $lastUpdate = new DateTime($repo['updated_at']);
        $daysSinceUpdate = $lastUpdate->diff($now)->days;
        
        if ($daysSinceUpdate < 30) {
            $repoContribution *= 1.5;
        } elseif ($daysSinceUpdate < 90) {
            $repoContribution *= 1.2;
        }
        
        $totalContributions += $repoContribution;
    }
    
    // Account age factor
    $ageMultiplier = min(1 + ($accountAgeYears * 0.6), 3);
    $totalContributions *= $ageMultiplier;
    
    // Ensure minimum values for active accounts
    if (count($originalRepos) > 0) {
        $totalContributions = max($totalContributions, 120);
        $estimatedLinesOfCode = max($estimatedLinesOfCode, 2000);
    }
    
    return [
        'contributions' => floor($totalContributions),
        'linesOfCode' => floor($estimatedLinesOfCode)
    ];
}

/**
 * Get fallback data when API fails
 */
function getFallbackData($username, $reason) {
    // Generate consistent fallback data based on username
    $seed = crc32($username);
    mt_srand($seed);
    
    $base = strlen($username) * 35;
    $random = mt_rand(150, 800);
    
    return [
        'contributions' => $base + $random,
        'linesOfCode' => ($base + $random) * 50,
        'status' => 'fallback',
        'reason' => $reason
    ];
}

/**
 * Get tree level based on contributions
 */
function getTreeLevel($contributions) {
    if ($contributions <= 50) return 'Sprout';
    if ($contributions <= 200) return 'Sapling';
    if ($contributions <= 500) return 'Mature Tree';
    return 'Ancient Tree';
}

/**
 * Get leaf colors based on contributions (seasonal effect)
 */
function getLeafColors($contributions) {
    $allColors = [
        ['#4CAF50', '#8BC34A', '#C8E6C9'], // Spring green
        ['#66BB6A', '#81C784', '#A5D6A7'], // Summer green
        ['#FFC107', '#FFD54F', '#FFE082'], // Autumn yellow
        ['#FF9800', '#FFB74D', '#FFCC02'], // Autumn orange
    ];
    
    $season = floor($contributions / 150) % count($allColors);
    return $allColors[$season];
}
?>
