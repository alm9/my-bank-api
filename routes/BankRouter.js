import express from 'express';
import { accountModel } from '../models/accountModel.js';
const appRouter = express();

/**
 * Endpoint para consultar o saldo da conta.
 * Recebe como parâmetro a “agência” e o número da “conta”, retorna “balance”.
 * Caso a conta informada não exista, retorna um erro
 */
appRouter.get('/query/:agency/:account', async (req, res) => {
  try {
    const account = await accountModel.find({
      agencia: req.params.agency,
      conta: req.params.account,
    });
    res.send(account);
  } catch (error) {
    res.status(500).send(error);
  }
});

/**
 * Endpoint para registrar um depósito em uma conta.
 * Este endpoint recebe como parâmetros a “agencia”,
 * o número da “conta” e o valor do depósito.
 * Atualiza “balance”, somando-o com o parâmetro recebido.
 * Valida se a conta informada existe, retorna um erro se
 * não existir, caso exista retorna o saldo atual da conta.
 */
appRouter.patch('/deposit/');

export { appRouter as bankRouter };
