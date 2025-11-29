/**
 * Run Complete Database SQL File
 * Executes the complete database SQL file using the existing database connection
 */

const mysql = require('mysql2');
const fs = require('fs');
const path = require('path');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'praashibysupal_db',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true // Important for executing multiple SQL statements
};

async function runSQLFile() {
  console.log('\n========================================');
  console.log('  Running Complete Database SQL File');
  console.log('========================================\n');

  const connection = mysql.createConnection(dbConfig);

  return new Promise((resolve, reject) => {
    connection.connect((err) => {
      if (err) {
        console.error('❌ Database connection error:', err.message);
        return reject(err);
      }
      console.log('✅ Connected to MySQL database');
      console.log(`📊 Database: ${dbConfig.database}`);
      console.log(`🔗 Host: ${dbConfig.host}\n`);

      // Read the SQL file
      const sqlFilePath = path.join(__dirname, 'praashibysupal_complete_database.sql');
      console.log('📄 Reading SQL file:', sqlFilePath);

      if (!fs.existsSync(sqlFilePath)) {
        const error = new Error(`SQL file not found: ${sqlFilePath}`);
        console.error('❌', error.message);
        connection.end();
        return reject(error);
      }

      const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
      console.log(`📝 SQL file size: ${(sqlContent.length / 1024).toFixed(2)} KB`);
      console.log('🚀 Executing SQL statements...\n');

      // Disable foreign key checks temporarily
      const fullSQL = 'SET FOREIGN_KEY_CHECKS = 0;\n' + sqlContent + '\nSET FOREIGN_KEY_CHECKS = 1;';

      // Execute the SQL file
      connection.query(fullSQL, (err, results) => {
        if (err) {
          console.error('❌ Error executing SQL:', err.message);
          console.error('Error code:', err.code);
          console.error('SQL State:', err.sqlState);
          if (err.sql) {
            console.error('Failed SQL (first 500 chars):', err.sql.substring(0, 500));
          }
          connection.end();
          return reject(err);
        }

        console.log('✅ SQL file executed successfully!');
        console.log('📊 Results:', Array.isArray(results) ? `${results.length} statements executed` : 'Completed');
        console.log('\n✨ Database setup complete!\n');

        connection.end();
        resolve(results);
      });
    });
  });
}

// Run the script
runSQLFile()
  .then(() => {
    console.log('🎉 All done!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Script failed:', err.message);
    process.exit(1);
  });

