const { app, BrowserWindow, ipcMain, dialog, ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function janelaCadatraFuncionario() {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });
  

  win.loadFile('cadastro-funcionario.html');

}

function janelaGeraPonto() {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  win.loadFile('index.html');
}

app.whenReady().then(janelaCadatraFuncionario).then(createDatabase());

function buscaFuncionarios() {
  // const db = createDatabase();
  const query = `SELECT * FROM funcionarios`;

  return new Promise((resolve, reject) => {
    db.all(query, [], (error, rows) => {
      if (error) {
        console.error('erro na consulta', error.message);
        reject(error);
      } else {
        // console.log(rows);
        resolve(rows);
      }
    });
  });
}

ipcMain.handle('buscarFuncionarios', async (event, args) => {
  try {
    const listaFuncionarios = await buscaFuncionarios();
    return listaFuncionarios;
  } catch (error) {
    return [];
  }
});

ipcMain.on('cadastro-funcionario', (event, dadosFuncionario) => {
  // console.log(dadosFuncionario);
  const query = `INSERT INTO funcionarios (matricula, nome) VALUES (?, ?)`;
  db.run(query, [dadosFuncionario.matricula, dadosFuncionario.nome], (error) => {
    if (error) {
      console.error(error);
    }
  });
});

ipcMain.on('editar-funcionario', (event, novoDadosFuncionario) => {
  const query = `UPDATE funcionarios SET matricula = ?, nome = ? WHERE id = ?`;
  db.run(
    query,
    [novoDadosFuncionario.newMatricula, novoDadosFuncionario.newNome, novoDadosFuncionario.id],
    (error) => {
      if (error) {
        console.error(error);
      }
    }
  );
});

ipcMain.on('excluir-funcionario', (event, id) => {
  const query = `DELETE FROM funcionarios WHERE id = ?`
  db.run(query, [id], (error) => {
    if (error) {
      console.error(error)
    }
  })
})

ipcMain.on('form-submission', (event, dadosFormulario) => {
  const dadosGerados = geraDadosPorPeriodoData(dadosFormulario);
  // console.log(dadosGerados);

  const caminhoArquivo = dialog.showSaveDialogSync({
    title: 'Salvar arquivo',
    defaultPath: 'registros.csv',
    filters: [{ name: 'Arquivos CSV', extensions: ['csv'] }],
  });

  if (caminhoArquivo) {
    const csvDados = gerarCsvDados(dadosGerados);

    fs.writeFileSync(caminhoArquivo, csvDados);
  }
});

function geraDadosPorPeriodoData(dadosFormulario) {
  const { matricula, nome, dataInicial, dataFinal } = dadosFormulario;
  const inicioData = new Date(dataInicial + 'T09:00:00');
  const finalData = new Date(dataFinal + 'T09:00:00');
  const registrosGerados = [];

  const dataCorrente = new Date(inicioData);
  while (dataCorrente <= finalData) {
    if (dataCorrente.getDay() === 6) {
      const dataFormatada = dataCorrente.toISOString().split('T')[0];
      const dadosGerados = {
        matricula,
        nome,
        data: dataFormatada,
        ...geraHorarioSabado(),
      };
      registrosGerados.push(dadosGerados);
    }
    if (dataCorrente.getDay() !== 0 && dataCorrente.getDay() !== 6) {
      const dataFormatada = dataCorrente.toISOString().split('T')[0];
      const dadosGerados = {
        matricula,
        nome,
        data: dataFormatada,
        ...geraHorarioSegundaSexta(),
      };
      registrosGerados.push(dadosGerados);
    }

    dataCorrente.setDate(dataCorrente.getDate() + 1);
  }

  return registrosGerados;
}

function geraHorarioSegundaSexta() {
  const dadosGerados = {};

  dadosGerados.horaEntrada = geraHorarioRandomico('06:55', '07:00');
  dadosGerados.horaRefeicaoInicio = geraHorarioRandomico('11:30', '11:35');
  dadosGerados.horaRefeicaoFim = geraHorarioRandomico('13:00', '13:05');
  dadosGerados.horaSaida = geraHorarioRandomico('17:00', '17:05');

  return dadosGerados;
}

function geraHorarioSabado() {
  const dadosGerados = {};

  dadosGerados.horaEntrada = geraHorarioRandomico('06:55', '07:00');
  dadosGerados.horaRefeicaoInicio = geraHorarioRandomico('11:30', '11:35');
  dadosGerados.horaRefeicaoFim = geraHorarioRandomico('12:00', '12:05');
  dadosGerados.horaSaida = geraHorarioRandomico('13:00', '13:05');

  return dadosGerados;
}

function geraHorarioRandomico(horaInicio, horaFim) {
  const [horaInicial, minutoInicial] = horaInicio.split(':');
  const [horaFinal, minutoFinal] = horaFim.split(':');

  const horaInicioTimestamp = new Date();
  horaInicioTimestamp.setHours(horaInicial, minutoInicial, 0);

  const horaFinalTimestamp = new Date();
  horaFinalTimestamp.setHours(horaFinal, minutoFinal, 0);

  const horaRandomicaTimestamp = new Date(
    horaInicioTimestamp.getTime() +
      Math.random() * (horaFinalTimestamp.getTime() - horaInicioTimestamp.getTime())
  );

  const horas = horaRandomicaTimestamp.getHours();
  const minutos = horaRandomicaTimestamp.getMinutes();
  const segundos = horaRandomicaTimestamp.getSeconds();

  return `${padZero(horas)}:${padZero(minutos)}:${padZero(segundos)}`;
}

function padZero(valor) {
  return String(valor).padStart(2, '0');
}

function gerarCsvDados(dadosGerados) {
  const { nome, matricula } = dadosGerados[0];
  let dadosCsv = `Nome: ${nome},Matrícula: ${matricula} \nData,Hora Entrada,Hora Refeição Início,Hora Refeição Fim,Hora Saída\n`;

  for (const dados of dadosGerados) {
    const { data, horaEntrada, horaRefeicaoInicio, horaRefeicaoFim, horaSaida } = dados;
    dadosCsv += `${data},${horaEntrada},${horaRefeicaoInicio},${horaRefeicaoFim},${horaSaida}\n`;
  }

  return dadosCsv;
}

function createDatabase() {
  db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
      console.error('Erro ao abrir o banco de dados', err.message);
    } else {
      console.log('Conexao com o banco de dados estabelecida.');
      createTable(db);
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
