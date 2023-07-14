const { app, BrowserWindow, ipcMain } = require('electron');
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
  // Aqui você pode lidar com os registros gerados para cada dia útil.
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
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const formattedDate = currentDate.toISOString().split('T')[0];
      const generatedData = generateRandomTimeForForm({
        matricula,
        nome,
        data: formattedDate
      });
      generatedRecords.push(generatedData);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return generatedRecords;
}

function generateRandomTimeForForm(formData) {
  const generatedData = { ...formData };

  generatedData.horaEntrada = generateRandomTime('06:55', '07:00');
  generatedData.horaRefeicaoInicio = generateRandomTime('11:30', '11:35');
  generatedData.horaRefeicaoFim = generateRandomTime('13:00', '13:05');
  generatedData.horaSaida = generateRandomTime('17:00', '17:05');

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
