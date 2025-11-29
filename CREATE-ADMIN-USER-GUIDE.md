# 🔧 CREATE ADMIN USER IN LIVE DATABASE
## Fix Admin Login Issue

---

## **🚨 THE PROBLEM:**
Your `users` table exists but has no users, so admin login fails. You need to create an admin user in your live database.

---

## **✅ SOLUTION 1: Create Admin User via SQL**

### **Step 1: Connect to Your Live Database**
1. **Open HeidiSQL** (or your preferred database tool)
2. **Connect to your live database** (the same one your backend uses)
3. **Navigate to your database** (likely `praashibysupal_db` or similar)

### **Step 2: Run This SQL Query**
**Execute this SQL to create an admin user:**

```sql
INSERT INTO users (
    name, 
    email, 
    password, 
    phone, 
    role, 
    is_active, 
    email_verified_at, 
    created_at, 
    updated_at
) VALUES (
    'Admin User',
    'admin@praashibysupal.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: "password"
    NULL,
    'admin',
    1,
    NOW(),
    NOW(),
    NOW()
);
```

### **Step 3: Verify User Created**
```sql
SELECT * FROM users WHERE role = 'admin';
```

---

## **✅ SOLUTION 2: Create Admin User via Backend API**

### **Step 1: Create Admin User Script**
**Create a file called `create-admin-user.js` in your backend directory:**

```javascript
const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function createAdminUser() {
    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        // Create admin user
        const result = await db.query(`
            INSERT INTO users (
                name, 
                email, 
                password, 
                role, 
                is_active, 
                email_verified_at, 
                created_at, 
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
            'Admin User',
            'admin@praashibysupal.com',
            hashedPassword,
            'admin',
            1,
            new Date()
        ]);
        
        console.log('Admin user created successfully!');
        console.log('Email: admin@praashibysupal.com');
        console.log('Password: admin123');
        console.log('User ID:', result.insertId);
        
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
    
    process.exit(0);
}

createAdminUser();
```

### **Step 2: Run the Script**
```bash
# On your server or locally (if connected to live DB)
cd backend
node create-admin-user.js
```

---

## **✅ SOLUTION 3: Use Existing Backend Script**

### **Check if you have existing admin creation scripts:**
```bash
# Look for existing scripts
ls -la backend/ | grep -i admin
ls -la backend/ | grep -i create
```

### **If you have `create-production-admin.js`:**
```bash
cd backend
node create-production-admin.js
```

---

## **✅ SOLUTION 4: Direct Database Insert (Simplest)**

### **Step 1: Connect to Live Database**
1. **Open HeidiSQL**
2. **Connect to your live database**
3. **Go to your `users` table**

### **Step 2: Insert Admin User**
**Right-click on `users` table → "Insert row" and fill:**

- **name**: `Admin User`
- **email**: `admin@praashibysupal.com`
- **password**: `$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` (this is "password" hashed)
- **phone**: `NULL` (leave empty)
- **role**: `admin`
- **is_active**: `1`
- **email_verified_at**: `NULL` (leave empty)
- **created_at**: `NOW()`
- **updated_at**: `NOW()`

### **Step 3: Save the Row**
**Click "Save" button**

---

## **🧪 TESTING:**

### **Test 1: Admin Login**
1. **Go to**: `https://praashibysupal.com/admin/login`
2. **Login with:**
   - **Email**: `admin@praashibysupal.com`
   - **Password**: `password` (or `admin123` if you used the script)
3. **Should redirect to**: Admin dashboard

### **Test 2: Check User in Database**
```sql
SELECT id, name, email, role, is_active FROM users WHERE role = 'admin';
```

### **Test 3: Admin Panel Access**
1. **Login to admin panel**
2. **Check dashboard loads**
3. **Test navigation between admin pages**

---

## **🔧 TROUBLESHOOTING:**

### **If login still doesn't work:**

1. **Check password hash:**
   ```sql
   SELECT password FROM users WHERE email = 'admin@praashibysupal.com';
   ```

2. **Verify user is active:**
   ```sql
   SELECT is_active FROM users WHERE email = 'admin@praashibysupal.com';
   ```

3. **Check backend logs** for authentication errors

4. **Try different password:**
   - Use the script method to create user with known password
   - Or use the pre-hashed password: `$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` (password: "password")

---

## **🎯 EXPECTED RESULTS:**

After creating admin user:
- ✅ **Admin login** works with email/password
- ✅ **Admin dashboard** loads
- ✅ **All admin functionality** available
- ✅ **User shows in database** with role 'admin'

**The quickest solution is to use HeidiSQL to insert the admin user directly into your live database!**

