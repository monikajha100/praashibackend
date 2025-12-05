# PowerShell script to modify SQL file
$content = Get-Content -Path "praashibysupal_db_complete.sql" -Raw -Encoding UTF8

# Define table constraints mapping
$tableConstraints = @{
    'banners' = @{ auto_increment = 10 }
    'categories' = @{ auto_increment = 25; unique_keys = @('slug') }
    'category_icons' = @{ auto_increment = 6; unique_keys = @('category_slug') }
    'chat_sessions' = @{ auto_increment = $null; unique_keys = @('session_id'); keys = @('contact_id') }
    'company_settings' = @{ auto_increment = 73; unique_keys = @('setting_key') }
    'contacts' = @{ auto_increment = 11; keys = @('idx_status', 'idx_type', 'idx_priority', 'idx_created_at') }
    'contact_responses' = @{ auto_increment = $null; keys = @('idx_contact_id', 'idx_response_date') }
    'contracts' = @{ auto_increment = 4; unique_keys = @('contract_number'); keys = @('partner_id', 'template_id', 'created_by') }
    'contract_analytics' = @{ auto_increment = 10; keys = @('contract_id') }
    'contract_reminders' = @{ auto_increment = 4; keys = @('contract_id') }
    'contract_renewals' = @{ auto_increment = $null; keys = @('contract_id', 'approved_by') }
    'contract_signatures' = @{ auto_increment = 3; keys = @('contract_id', 'signer_id') }
    'contract_templates' = @{ auto_increment = 4; keys = @('created_by') }
    'coupons' = @{ auto_increment = 9; unique_keys = @('code'); keys = @('idx_code', 'idx_active', 'idx_dates') }
    'coupon_campaigns' = @{ auto_increment = 2; keys = @('idx_active', 'idx_dates') }
    'coupon_usage' = @{ auto_increment = $null; keys = @('idx_coupon', 'idx_user', 'idx_order') }
    'invoices' = @{ auto_increment = 11; unique_keys = @('invoice_number'); keys = @('idx_invoices_order_id', 'idx_invoices_customer_id', 'idx_invoices_date') }
    'invoice_items' = @{ auto_increment = 25; keys = @('idx_invoice_items_invoice_id', 'idx_invoice_items_product_id') }
    'low_stock_alerts' = @{ auto_increment = 3; keys = @('product_id', 'warehouse_id', 'alert_type') }
    'notifications' = @{ auto_increment = $null; keys = @('contact_id', 'ticket_id', 'chat_session_id', 'recipient_id') }
    'orders' = @{ auto_increment = 46; unique_keys = @('order_number'); keys = @('user_id', 'idx_orders_status', 'idx_orders_date') }
    'order_items' = @{ auto_increment = 115; keys = @('order_id', 'product_id') }
    'partners' = @{ auto_increment = 13 }
    'partner_analytics' = @{ auto_increment = $null; keys = @('partner_id') }
    'partner_inventory_sharing' = @{ auto_increment = $null; unique_keys = @('unique_partner_product'); keys = @('product_id') }
    'partner_orders' = @{ auto_increment = $null; unique_keys = @('order_number'); keys = @('partner_id') }
    'partner_storefronts' = @{ auto_increment = 4; unique_keys = @('subdomain'); keys = @('partner_id') }
    'partner_themes' = @{ auto_increment = 4 }
    'partner_widgets' = @{ auto_increment = 7 }
    'products' = @{ auto_increment = 67; unique_keys = @('slug', 'sku'); keys = @('category_id', 'subcategory_id', 'idx_products_status', 'idx_products_featured') }
    'product_colors' = @{ auto_increment = 10; keys = @('idx_product_colors_product_id', 'idx_product_colors_active') }
    'product_images' = @{ auto_increment = 34; keys = @('product_id') }
    'product_reviews' = @{ auto_increment = $null; keys = @('product_id', 'user_id') }
    'product_videos' = @{ auto_increment = $null; keys = @('product_id') }
    'promotional_banners' = @{ auto_increment = 9 }
    'promotional_offers' = @{ auto_increment = 4; keys = @('idx_active', 'idx_expires_at', 'idx_products') }
    'site_settings' = @{ auto_increment = 6; unique_keys = @('setting_key') }
    'special_offers' = @{ auto_increment = 5; keys = @('idx_active', 'idx_expires_at', 'idx_products') }
    'stock_adjustments' = @{ auto_increment = 3; unique_keys = @('adjustment_number'); keys = @('product_id', 'warehouse_id', 'user_id', 'approved_by') }
    'stock_levels' = @{ auto_increment = 11; unique_keys = @('unique_product_warehouse'); keys = @('idx_stock_levels_product', 'idx_stock_levels_warehouse') }
    'stock_movements' = @{ auto_increment = $null; keys = @('user_id', 'idx_stock_movements_product', 'idx_stock_movements_warehouse', 'idx_stock_movements_date') }
    'subcategories' = @{ auto_increment = 26; unique_keys = @('slug'); keys = @('category_id') }
    'support_tickets' = @{ auto_increment = 4; unique_keys = @('ticket_number'); keys = @('contact_id', 'idx_tickets_status', 'idx_tickets_priority') }
    'users' = @{ auto_increment = 5; unique_keys = @('email') }
    'warehouses' = @{ auto_increment = 3; unique_keys = @('code') }
}

# Function to modify CREATE TABLE statements
function Modify-CreateTable {
    param($match)
    
    $tableName = $match.Groups[1].Value
    $tableContent = $match.Groups[2].Value
    
    # Add AUTO_INCREMENT to id column
    $tableContent = $tableContent -replace '`id` int\(11\) NOT NULL,', '`id` int(11) NOT NULL AUTO_INCREMENT,'
    
    # Add PRIMARY KEY constraint if not exists
    if ($tableContent -notmatch 'PRIMARY KEY') {
        $lines = $tableContent -split "`n"
        for ($i = $lines.Length - 1; $i -ge 0; $i--) {
            if ($lines[$i].Trim().EndsWith(')')) {
                $lines = $lines[0..($i-1)] + @('  PRIMARY KEY (`id`)') + $lines[$i..($lines.Length-1)]
                break
            }
        }
        $tableContent = $lines -join "`n"
    }
    
    # Add other constraints if they exist
    if ($tableConstraints.ContainsKey($tableName)) {
        $constraints = $tableConstraints[$tableName]
        
        # Add UNIQUE KEY constraints
        if ($constraints.unique_keys) {
            foreach ($uniqueKey in $constraints.unique_keys) {
                if ($tableContent -notmatch "UNIQUE KEY `$uniqueKey`") {
                    $lines = $tableContent -split "`n"
                    for ($i = 0; $i -lt $lines.Length; $i++) {
                        if ($lines[$i] -match 'PRIMARY KEY') {
                            $lines = $lines[0..$i] + @("  UNIQUE KEY `$uniqueKey` (`$uniqueKey`)") + $lines[($i+1)..($lines.Length-1)]
                            break
                        }
                    }
                    $tableContent = $lines -join "`n"
                }
            }
        }
        
        # Add KEY constraints
        if ($constraints.keys) {
            foreach ($key in $constraints.keys) {
                if ($tableContent -notmatch "KEY `$key`") {
                    $lines = $tableContent -split "`n"
                    for ($i = $lines.Length - 1; $i -ge 0; $i--) {
                        if ($lines[$i] -match 'KEY|PRIMARY KEY|UNIQUE KEY') {
                            $lines = $lines[0..$i] + @("  KEY `$key` (`$key`)") + $lines[($i+1)..($lines.Length-1)]
                            break
                        }
                    }
                    $tableContent = $lines -join "`n"
                }
            }
        }
    }
    
    # Add AUTO_INCREMENT value to ENGINE line
    if ($tableConstraints.ContainsKey($tableName) -and $tableConstraints[$tableName].auto_increment) {
        $autoIncValue = $tableConstraints[$tableName].auto_increment
        $tableContent = $tableContent -replace 'ENGINE=InnoDB DEFAULT CHARSET=', "ENGINE=InnoDB AUTO_INCREMENT=$autoIncValue DEFAULT CHARSET="
    }
    
    return "CREATE TABLE `$tableName` ($tableContent"
}

# Apply modifications to CREATE TABLE statements
$content = [regex]::Replace($content, 'CREATE TABLE `([^`]+)` \((.*?)\) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;', { param($match) Modify-CreateTable $match }, [System.Text.RegularExpressions.RegexOptions]::Singleline)

# Remove ALTER TABLE statements for PRIMARY KEY and AUTO_INCREMENT
$content = $content -replace '(?s)--\s*\n--\s*Indexes for dumped tables\s*\n--\s*\n.*?(?=--\s*\n--\s*AUTO_INCREMENT for dumped tables)', ''
$content = $content -replace '(?s)--\s*\n--\s*AUTO_INCREMENT for dumped tables\s*\n--\s*\n.*?(?=--\s*\n--\s*Constraints for table)', ''

# Write the modified content
Set-Content -Path "praashibysupal_db_final.sql" -Value $content -Encoding UTF8

Write-Host "SQL file modification completed successfully!"
