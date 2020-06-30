import express from 'express';
import mongoose from 'mongoose';
import { promises } from 'fs';
import { bankRouter } from './routes/BankRouter.js';

const PORT = 3001;
const app = express();
app.use(express.json());

const fileWithConnectionString = './myConnectionString.txt';
const connectionString = read(fileWithConnectionString);
async function read(file) {
  return await promises.readFile(file, 'utf8');
}

//conectar ao mongodb:
(async () => {
  try {
    await mongoose.connect(await connectionString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  } catch (error) {
    console.log(
      `Erro: não foi possível conectar ao MongoDB. Detalhes do erro: ${error}`
    );
  }
})();

app.use(bankRouter);

app.listen(PORT, async () => {
  console.log('API started');
});
