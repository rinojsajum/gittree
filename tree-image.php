<?php
/**
 * GitHub Tree Image Generator
 * 
 * This PHP script generates a PNG image of a GitHub contribution tree
 * that can be directly embedded in GitHub READMEs.
 * 
 * Usage: https://your-domain.com/tree-image.php?user=username
 */

header('Content-Type: image/png');
header('Cache-Control: public, max-age=3600'); // Cache for 1 hour

// Get username from URL parameter
$username = $_GET['user'] ?? 'octocat';
$username = preg_replace('/[^a-zA-Z0-9\-_]/', '', $username); // Sanitize

// Image dimensions
$width = 600;
$height = 400;

// Create image
$image = imagecreatetruecolor($width, $height);

// Colors
$skyBlue = imagecolorallocate($image, 135, 206, 235);
$grassGreen = imagecolorallocate($image, 124, 179, 66);
$trunkBrown = imagecolorallocate($image, 139, 69, 19);
$leafGreen = imagecolorallocate($image, 76, 175, 80);
$leafYellow = imagecolorallocate($image, 255, 193, 7);
$leafOrange = imagecolorallocate($image, 255, 152, 0);
$white = imagecolorallocate($image, 255, 255, 255);
$black = imagecolorallocate($image, 0, 0, 0);
$gray = imagecolorallocate($image, 100, 100, 100);

// Create gradient background
for ($y = 0; $y < $height; $y++) {
    $ratio = $y / $height;
    $r = 135 + ($ratio * (152 - 135));
    $g = 206 + ($ratio * (251 - 206));
    $b = 235 + ($ratio * (152 - 235));
    $color = imagecolorallocate($image, $r, $g, $b);
    imageline($image, 0, $y, $width, $y, $color);
}

// Simulate GitHub API data (in production, you'd fetch real data)
$contributions = generateContributionData($username);
$treeLevel = getTreeLevel($contributions);

// Draw ground
$groundY = $height - 50;
imagefilledrectangle($image, 0, $groundY, $width, $height, $grassGreen);

// Draw tree based on contributions
$centerX = $width / 2;
$treeHeight = min(200, 50 + ($contributions * 0.2));
$trunkWidth = max(15, $contributions / 50);

// Draw trunk
$trunkX1 = $centerX - $trunkWidth / 2;
$trunkX2 = $centerX + $trunkWidth / 2;
$trunkY1 = $groundY;
$trunkY2 = $groundY - $treeHeight;

imagefilledrectangle($image, $trunkX1, $trunkY2, $trunkX2, $trunkY1, $trunkBrown);

// Draw branches
$numBranches = min(12, floor($contributions / 30) + 2);
for ($i = 0; $i < $numBranches; $i++) {
    $branchLevel = floor($i / 3);
    $branchY = $trunkY2 + ($treeHeight * (0.3 + $branchLevel * 0.2));
    $branchLength = 40 + ($contributions / 10) - ($branchLevel * 15);
    $branchAngle = ($i * 60) - 30 + ($branchLevel * 20);
    
    $side = ($i % 2 == 0) ? -1 : 1;
    $branchEndX = $centerX + ($side * $branchLength);
    $branchEndY = $branchY - 20 - ($branchLevel * 10);
    
    // Draw branch line
    imageline($image, $centerX, $branchY, $branchEndX, $branchEndY, $trunkBrown);
    
    // Add thickness to branch
    imageline($image, $centerX, $branchY + 1, $branchEndX, $branchEndY + 1, $trunkBrown);
    imageline($image, $centerX, $branchY - 1, $branchEndX, $branchEndY - 1, $trunkBrown);
}

// Draw leaves
$leafCount = min(80, $contributions / 8);
for ($i = 0; $i < $leafCount; $i++) {
    $leafX = $centerX + (rand(-120, 120));
    $leafY = $trunkY2 + rand(0, $treeHeight * 0.8);
    
    // Skip if too close to trunk
    if (abs($leafX - $centerX) < $trunkWidth) continue;
    
    $leafColor = getLeafColor($contributions, $leafGreen, $leafYellow, $leafOrange);
    
    // Draw leaf as small filled ellipse
    imagefilledellipse($image, $leafX, $leafY, 8, 6, $leafColor);
}

// Add some small details - grass blades
for ($i = 0; $i < 50; $i++) {
    $grassX = rand(0, $width);
    $grassY = $groundY + rand(0, 20);
    imageline($image, $grassX, $grassY, $grassX, $grassY - rand(5, 15), $leafGreen);
}

// Draw stats box
$boxX = 20;
$boxY = 20;
$boxWidth = 200;
$boxHeight = 80;

// Semi-transparent background
$bgColor = imagecolorallocatealpha($image, 255, 255, 255, 50);
imagefilledrectangle($image, $boxX, $boxY, $boxX + $boxWidth, $boxY + $boxHeight, $bgColor);
imagerectangle($image, $boxX, $boxY, $boxX + $boxWidth, $boxY + $boxHeight, $gray);

// Add text
$font = 3; // Built-in font
imagestring($image, $font, $boxX + 10, $boxY + 10, "GitHub: $username", $black);
imagestring($image, $font, $boxX + 10, $boxY + 25, "Contributions: $contributions", $black);
imagestring($image, $font, $boxX + 10, $boxY + 40, "Tree Level: $treeLevel", $black);
imagestring($image, $font, $boxX + 10, $boxY + 55, "Generated: " . date('Y-m-d'), $gray);

// Add GitHub logo area (simple representation)
$logoX = $width - 80;
$logoY = $height - 30;
imagestring($image, 2, $logoX, $logoY, "GitHub Tree", $gray);

// Output the image
imagepng($image);
imagedestroy($image);

/**
 * Generate contribution data based on username
 */
function generateContributionData($username) {
    // Simple algorithm to generate consistent data based on username
    $seed = crc32($username);
    mt_srand($seed);
    
    $base = strlen($username) * 25;
    $random = mt_rand(50, 800);
    
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
 * Get leaf color based on contributions (seasonal effect)
 */
function getLeafColor($contributions, $green, $yellow, $orange) {
    $season = floor($contributions / 200) % 3;
    
    switch ($season) {
        case 0: return $green;
        case 1: return $yellow;
        case 2: return $orange;
        default: return $green;
    }
}
?>
