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

// Generate contribution data
$contributions = generateContributionData($username);
$treeLevel = getTreeLevel($contributions);
$linesOfCode = $contributions * 47;

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
 * Generate contribution data based on username
 */
function generateContributionData($username) {
    $seed = crc32($username);
    mt_srand($seed);
    
    $base = strlen($username) * 30;
    $random = mt_rand(100, 900);
    
    return $base + $random;
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
