# Sequelize Migrations Guide

This project now uses Sequelize migrations for database schema management. This provides better version control, rollback capabilities, and easier deployment.

## 📁 Migration Files

All migration files are located in the `migrations/` directory:

- `20251011174006-create-users-table.js` - Users table
- `20251011174016-create-categories-table.js` - Categories table
- `20251011174022-create-subcategories-table.js` - Subcategories table
- `20251011174028-create-products-table.js` - Products table
- `20251011174035-create-product-images-table.js` - Product images table
- `20251011174042-create-product-colors-table.js` - Product colors table
- `20251011174049-create-orders-table.js` - Orders table
- `20251011174057-create-order-items-table.js` - Order items table
- `20251011174104-create-banners-table.js` - Banners table
- `20251011174111-create-company-settings-table.js` - Company settings table

## 🌱 Seeders

Initial data is populated using seeders in the `seeders/` directory:

- `20251011174246-initial-data.js` - Initial categories and company settings

## 🚀 Available Commands

### Migration Commands

```bash
# Run all pending migrations
npm run migrate

# Undo the last migration
npm run migrate:undo

# Undo all migrations
npm run migrate:undo:all

# Create a new migration
npx sequelize-cli migration:generate --name migration-name

# Create a new seeder
npx sequelize-cli seed:generate --name seeder-name
```

### Seeder Commands

```bash
# Run all seeders
npm run seed

# Undo all seeders
npm run seed:undo

# Run specific seeder
npx sequelize-cli db:seed --seed 20251011174246-initial-data.js
```

### Database Commands

```bash
# Create database
npx sequelize-cli db:create

# Drop database
npx sequelize-cli db:drop

# Reset database (undo all migrations, run migrations, run seeders)
npm run db:reset
```

## 🔧 Configuration

Database configuration is in `config/config.json`:

- **Development**: Local MySQL database
- **Production**: Aiven MySQL database with SSL
- **Test**: Test database for testing

## 📋 Database Schema

### Tables Created

1. **users** - User accounts and authentication
2. **categories** - Product categories
3. **subcategories** - Product subcategories
4. **products** - Product information
5. **product_images** - Product image URLs
6. **product_colors** - Product color variants
7. **orders** - Customer orders
8. **order_items** - Individual items in orders
9. **banners** - Homepage banners
10. **company_settings** - Application settings

### Relationships

- Categories → Subcategories (One-to-Many)
- Categories → Products (One-to-Many)
- Subcategories → Products (One-to-Many)
- Products → Product Images (One-to-Many)
- Products → Product Colors (One-to-Many)
- Users → Orders (One-to-Many)
- Orders → Order Items (One-to-Many)
- Products → Order Items (One-to-Many)

## 🚀 Deployment

### For New Deployments

1. **Create database** (if not exists):
   ```bash
   npx sequelize-cli db:create
   ```

2. **Run migrations**:
   ```bash
   npm run migrate
   ```

3. **Seed initial data**:
   ```bash
   npm run seed
   ```

### For Existing Deployments

If you have an existing database with data, you can:

1. **Backup your data** first
2. **Run migrations** to add new tables/columns:
   ```bash
   npm run migrate
   ```
3. **Migrate existing data** manually if needed

## 🔄 Rollback

If you need to rollback changes:

```bash
# Undo last migration
npm run migrate:undo

# Undo all migrations
npm run migrate:undo:all

# Then re-run migrations if needed
npm run migrate
```

## 📝 Adding New Migrations

1. **Generate migration**:
   ```bash
   npx sequelize-cli migration:generate --name add-new-column-to-products
   ```

2. **Edit the migration file** in `migrations/` directory

3. **Run the migration**:
   ```bash
   npm run migrate
   ```

## 🌱 Adding New Seeders

1. **Generate seeder**:
   ```bash
   npx sequelize-cli seed:generate --name add-sample-products
   ```

2. **Edit the seeder file** in `seeders/` directory

3. **Run the seeder**:
   ```bash
   npm run seed
   ```

## ⚠️ Important Notes

- **Always backup** your database before running migrations in production
- **Test migrations** in development first
- **Migration order matters** - they run in timestamp order
- **Foreign key constraints** are properly set up with CASCADE options
- **Indexes** are created for performance on key fields

## 🎯 Benefits of Using Migrations

1. **Version Control** - Database schema changes are tracked in Git
2. **Rollback Capability** - Can undo changes if needed
3. **Team Collaboration** - Everyone gets the same database structure
4. **Deployment Safety** - Consistent database setup across environments
5. **Documentation** - Migration files serve as schema documentation
