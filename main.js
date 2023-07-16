const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require("fs");
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
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

ipcMain.on('form-submission', (event, formData) => {
  const generatedData = generateRecordsForDateRange(formData);
  console.log(generatedData);

  const savePath = dialog.showSaveDialogSync({
    title: 'Salvar arquivo',
    defaultPath: 'registros.csv',
    filters: [
      { name: 'Arquivos CSV', extensions: ['csv'] }
    ]
  });

  if (savePath) {
    const csvData = generateCsvData(formData, generatedData);

    fs.writeFileSync(savePath, csvData);
  }
});

ipcMain.on('cancel-clicked', () => {
  app.quit();
});

function generateRecordsForDateRange(formData) {
  const { matricula, nome, dataInicial, dataFinal } = formData;
  const startDate = new Date(dataInicial);
  const endDate = new Date(dataFinal);
  const generatedRecords = [];

  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    if (currentDate.getDay() !== 5 && currentDate.getDay() !== 6) {
      const formattedDate = currentDate.toISOString().split('T')[0];
      const generatedData = {
        matricula,
        nome,
        data: formattedDate,
        ...generateRandomTimeForForm()
      };
      generatedRecords.push(generatedData);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return generatedRecords;
}

function generateRandomTimeForForm() {
  const generatedData = {};

  generatedData.horaEntrada = generateRandomTime('06:55', '07:00');
  generatedData.horaRefeicaoInicio = generateRandomTime('11:30', '11:35');
  generatedData.horaRefeicaoFim = generateRandomTime('13:00', '13:05');
  generatedData.horaSaida = generateRandomTime('17:00', '17:05');

  return generatedData;
}

function generateRandomTimeForFormSabado() {
  const generatedData = {};

  generatedData.horaEntrada = generateRandomTime('06:55', '07:00');
  generatedData.horaRefeicaoInicio = generateRandomTime('11:30', '11:35');
  generatedData.horaRefeicaoFim = generateRandomTime('12:00', '12:05');
  generatedData.horaSaida = generateRandomTime('13:00', '13:05');

  return generatedData;
}

function generateRandomTime(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':');
  const [endHour, endMinute] = endTime.split(':');

  const startTimestamp = new Date();
  startTimestamp.setHours(startHour, startMinute, 0);

  const endTimestamp = new Date();
  endTimestamp.setHours(endHour, endMinute, 0);

  const randomTimestamp = new Date(
    startTimestamp.getTime() + Math.random() * (endTimestamp.getTime() - startTimestamp.getTime())
  );

  const hours = randomTimestamp.getHours();
  const minutes = randomTimestamp.getMinutes();
  const seconds = randomTimestamp.getSeconds();

  return `${padZero(hours)}:${padZero(minutes)}:${padZero(seconds)}`;
}

function padZero(value) {
  return String(value).padStart(2, '0');
}

function generateCsvData(formData, generatedRecords) {
  const { nome, matricula } = formData;
  let csvData = `Nome: ${nome},Matrícula: ${matricula} \nData,Hora Entrada,Hora Refeição Início,Hora Refeição Fim,Hora Saída\n`;

  for (const record of generatedRecords) {
    const { data, horaEntrada, horaRefeicaoInicio, horaRefeicaoFim, horaSaida } = record;
    csvData += `${data},${horaEntrada},${horaRefeicaoInicio},${horaRefeicaoFim},${horaSaida}\n`;
  }

  return csvData;
}
