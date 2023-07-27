const sqlite3 = require('sqlite3').verbose();

function createDatabase() {
  db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
      console.error('Erro ao abrir o banco de dados', err.message);
    } else {
      console.log('Conexao com o banco de dados estabelecida.');
      createTable(db);
      createTableRegistrosPonto(db);
    }
  });
  return db;
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

function createTableRegistrosPonto(db) {
  const query = `
    CREATE TABLE IF NOT EXISTS registros_ponto (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      funcionario_id INTEGER,
      data TEXT,
      hora_entrada TEXT,
      hora_refeicao_inicio TEXT,
      hora_refeicao_fim TEXT,
      hora_saida TEXT,
      FOREIGN KEY(funcionario_id) REFERENCES funcionarios(id) ON DELETE CASCADE
    )
  `;

  db.run(query, (err) => {
    if (err) {
      console.error('Erro ao criar a tabela registros_ponto', err.message);
    }
  });
}

module.exports = {createDatabase}