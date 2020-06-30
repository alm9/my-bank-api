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
    const { agency, account } = req.params;
    const accountFind = await accountModel.find(
      {
        agencia: agency,
        conta: account,
      },
      { _id: 0, balance: 1 }
      /*
      function (err, bankAcc) {
        if (err) return handleError(err);
        console.log(
          'Agência: %s; Conta: %s; Saldo: %f',
          agency,
          account,
          bankAcc[0].balance
        );
      }
      */
    );

    if (accountFind.length == 0)
      res.status(404).send('Agência e/ou conta incorreta(s).');

    res.send(accountFind);
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
appRouter.patch('/deposit/:agency/:account/:deposit', async (req, res) => {
  try {
    const { agency, account, deposit } = req.params;

    const accountFind = await accountModel.findOneAndUpdate(
      {
        agencia: agency,
        conta: account,
      },
      { $inc: { balance: deposit } }
    );

    if (accountFind === null)
      res.status(404).send('Agência e/ou conta incorreta(s).');

    res.send('Depósito realizado.');
  } catch (error) {
    res.status(500).send(error);
  }
});

export { appRouter as bankRouter };
