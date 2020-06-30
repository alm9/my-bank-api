import express from 'express';
// import mongoose from 'mongoose';

const PORT = 3001;
const app = express();
app.use(express.json());

// app.use(bankRouter)
app.listen(PORT, () => {
  console.log('API started');
});
