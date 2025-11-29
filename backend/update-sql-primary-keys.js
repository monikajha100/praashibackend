const fs = require('fs');
const path = require('path');

const sqlFile = path.join(__dirname, 'praashibysupal_db (5).sql');
let content = fs.readFileSync(sqlFile, 'utf-8');

// Map of table names to AUTO_INCREMENT values
const autoIncrementMap = {
  'banners': 11,
  'categories': 25,
  'category_icons': 6,
  'chat_sessions': null,
  'company_settings': 74,
  'contacts': 11,
  'contact_messages': null,
  'contact_responses': null,
  'contracts': 4,
  'contract_analytics': 10,
  'contract_reminders': 4,
  'contract_renewals': null,
  'contract_signatures': 3,
  'contract_templates': 4,
  'coupons': 9,
  'coupon_campaigns': 2,
  'coupon_usage': null,
  'instagram_posts': null,
  'invoices': 11,
  'invoice_items': 25,
  'low_stock_alerts': 3,
  'newsletter_subscribers': null,
  'notifications': null,
  'orders': 55,
  'order_items': 124,
  'partners': 13,
  'partner_analytics': null,
  'partner_inventory_sharing': null,
  'partner_orders': null,
  'partner_storefronts': 4,
  'partner_themes': 4,
  'partner_widgets': 7,
  'products': 81,
  'product_colors': 10,
  'product_images': 38,
  'product_reviews': null,
  'product_videos': null,
  'promotional_banners': 9,
  'promotional_offers': 4,
  'sequelizemeta': null,
  'site_settings': 6,
  'special_offers': 7,
  'stock_adjustments': 3,
  'stock_levels': 11,
  'stock_movements': null,
  'subcategories': 26,
  'support_tickets': 4,
  'users': 7,
  'visitor_stats': 2,
  'warehouses': 3,
  'wishlists': null
};

// Step 1: Update all CREATE TABLE statements to include PRIMARY KEY and AUTO_INCREMENT in id column
Object.keys(autoIncrementMap).forEach(tableName => {
  // Replace id column definition in CREATE TABLE
  const pattern = new RegExp(
    `(CREATE TABLE \\`${tableName}\\` \\(\\s*)\\`id\\` int\\(11\\) NOT NULL(?!\\s+AUTO_INCREMENT)`,
    'g'
  );
  content = content.replace(pattern, '$1`id` int(11) NOT NULL AUTO_INCREMENT PRIMARY KEY');
  
  // Update AUTO_INCREMENT value in ENGINE clause
  const autoIncrement = autoIncrementMap[tableName];
  if (autoIncrement !== null) {
    const enginePattern = new RegExp(
      `(CREATE TABLE \\`${tableName}\\`[\\s\\S]*?\\) ENGINE=InnoDB) AUTO_INCREMENT=\\d+`,
      'g'
    );
    if (enginePattern.test(content)) {
      content = content.replace(enginePattern, `$1 AUTO_INCREMENT=${autoIncrement}`);
    } else {
      const enginePattern2 = new RegExp(
        `(CREATE TABLE \\`${tableName}\\`[\\s\\S]*?\\) ENGINE=InnoDB)( DEFAULT CHARSET=)`,
        'g'
      );
      content = content.replace(enginePattern2, `$1 AUTO_INCREMENT=${autoIncrement}$2`);
    }
  }
});

// Step 2: Remove all ALTER TABLE statements that add PRIMARY KEY
content = content.replace(/--\s*Indexes for table `[^`]+`\s*--\s*ALTER TABLE `[^`]+`\s*ADD PRIMARY KEY \(`id`\)[,\s]*\n/g, '');

// Step 3: Remove all ALTER TABLE statements that set AUTO_INCREMENT
content = content.replace(/--\s*AUTO_INCREMENT for table `[^`]+`\s*--\s*ALTER TABLE `[^`]+`\s*MODIFY `id`[^;]*;\s*\n/g, '');

// Step 4: Clean up empty comment sections
content = content.replace(/--\s*Indexes for dumped tables\s*--\s*/g, '');
content = content.replace(/--\s*AUTO_INCREMENT for dumped tables\s*--\s*/g, '');

// Write back
fs.writeFileSync(sqlFile, content, 'utf-8');
console.log('✅ SQL file updated successfully!');
console.log('   - Added PRIMARY KEY and AUTO_INCREMENT to all id columns in CREATE TABLE');
console.log('   - Updated AUTO_INCREMENT values');
console.log('   - Removed ALTER TABLE statements for PRIMARY KEY and AUTO_INCREMENT');

