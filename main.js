const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require("fs");
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 600,
    height: 700,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile('index.html');
}

app.whenReady().then(createWindow);

ipcMain.on('form-submission', (event, dadosFormulario) => {
  const dadosGerados = geraDadosPorPeriodoData(dadosFormulario);
  console.log(dadosGerados);

  const caminhoArquivo = dialog.showSaveDialogSync({
    title: 'Salvar arquivo',
    defaultPath: 'registros.csv',
    filters: [
      { name: 'Arquivos CSV', extensions: ['csv'] }
    ]
  });

  if (caminhoArquivo) {
    const csvDados = gerarCsvDados(dadosGerados);

    fs.writeFileSync(caminhoArquivo, csvDados);
  }
});

function geraDadosPorPeriodoData(dadosFormulario) {
  const { matricula, nome, dataInicial, dataFinal } = dadosFormulario;
  const inicioData = new Date(dataInicial + "T09:00:00");
  const finalData = new Date(dataFinal + "T09:00:00");
  const registrosGerados = [];

  const dataCorrente = new Date(inicioData);
  while (dataCorrente <= finalData) {
    if (dataCorrente.getDay() === 6) {
      const dataFormatada = dataCorrente.toISOString().split('T')[0];
      const dadosGerados = {
        matricula,
        nome,
        data: dataFormatada,
        ...geraHorarioSabado()
      };
      registrosGerados.push(dadosGerados);
    }
    if (dataCorrente.getDay() !== 0 && dataCorrente.getDay() !== 6) {
      const dataFormatada = dataCorrente.toISOString().split('T')[0];
      const dadosGerados = {
        matricula,
        nome,
        data: dataFormatada,
        ...geraHoarioSegundaSexta()
      };
      registrosGerados.push(dadosGerados);
    }

    dataCorrente.setDate(dataCorrente.getDate() + 1);
  }

  return registrosGerados;
}

function geraHoarioSegundaSexta() {
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
    horaInicioTimestamp.getTime() + Math.random() * (horaFinalTimestamp.getTime() - horaInicioTimestamp.getTime())
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
