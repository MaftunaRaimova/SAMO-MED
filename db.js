const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres', // change here your own user
  host: 'localhost', // change here your own localhost
  database: 'postgres',
  password: 'secret', // change here your own password
  port: 5432,
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL', err);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

module.exports = pool;