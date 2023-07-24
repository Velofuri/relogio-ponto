const sqlite3 = require('sqlite3').verbose();

function createDatabase() {
  const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
      console.error('Erro ao abrir o banco de dados', err.message);
    } else {
      console.log('Conexao com o banco de dados estabelecida.');
      createTable(db);
    }
  });

  return db; // Retornar a instância do banco de dados
}

function createTable(db) {
  const query = `
    CREATE TABLE IF NOT EXISTS funcionarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      matricula TEXT,
      nome TEXT
    )
  `;

  db.run(query, (err) => {
    if (err) {
      console.error('Erro ao criar a tabela', err.message);
    }
  });
}

function testeDB() {
  const db = createDatabase(); // Obtenha a instância do banco de dados criada anteriormente
  db.run(`INSERT INTO funcionarios (matricula, nome) VALUES ("22222", "TesteDB")`, (err) => {
    if (err) {
      console.error(err.message);
    } else {
      console.log('Inserção realizada com sucesso!');
    }
  });
}

function consultaDb() {
  const db = createDatabase()
  db.all(`SELECT * FROM funcionarios`, [], (err, rows) => {
    if (err) {
      console.error('Erro ao executar consulta:', err.message);
    } else {
      console.log('Dados na tabela funcionarios:');
      console.table(rows);
    }
  })
}

function consultaNovaTabela() {
  const db = createDatabase()
  db.all(`SELECT * FROM registros_ponto`, [], (err, rows) => {
    if (err) {
      console.error('Erro ao executar consulta:', err.message);
    } else {
      console.log('Dados na tabela funcionarios:');
      console.table(rows);
    }
  })
}

// testeDB();
// consultaDb();
consultaNovaTabela()
