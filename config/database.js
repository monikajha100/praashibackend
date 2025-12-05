const mysql = require('mysql2');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME ||'praashiby_supal',
  port: process.env.DB_PORT || '3306',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

const connect = (callback) => {
  pool.getConnection((err, connection) => {
    if (err) {
      return callback(err);
    }
    console.log('MySQL connected as id ' + connection.threadId);
    connection.release();
    callback(null);
  });
};

const query = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.execute(sql, params, (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results);
      }
    });
  });
};

const transaction = (queries) => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        return reject(err);
      }

      connection.beginTransaction((err) => {
        if (err) {
          connection.release();
          return reject(err);
        }

        const results = [];
        let completed = 0;

        queries.forEach((queryObj, index) => {
          connection.execute(queryObj.sql, queryObj.params, (err, result) => {
            if (err) {
              connection.rollback(() => {
                connection.release();
                reject(err);
              });
              return;
            }

            results[index] = result;
            completed++;

            if (completed === queries.length) {
              connection.commit((err) => {
                if (err) {
                  connection.rollback(() => {
                    connection.release();
                    reject(err);
                  });
                  return;
                }
                connection.release();
                resolve(results);
              });
            }
          });
        });
      });
    });
  });
};

module.exports = {
  pool,
  connect,
  query,
  transaction
};
