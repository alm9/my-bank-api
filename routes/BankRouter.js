import express from 'express';
import { accountModel } from '../models/accountModel.js';
const appRouter = express();

/**
 * Endpoint para consultar o saldo da conta.
 * Recebe como parâmetro a “agência” e o número da “conta”, retorna “balance”.
 * Caso a conta informada não exista, retorna um erro
 */
appRouter.get('/:agency/:account', async (req, res) => {
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

    if (accountFind.length === 0)
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
      { $inc: { balance: +deposit } }
    );

    if (accountFind === null)
      res.status(404).send('Agência e/ou conta incorreta(s).');

    res.send(
      `Depósito feito. Saldo atual: ${(
        Number(accountFind.balance) + Number(deposit)
      ).toString()}`
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

/**
 * Endpoint para registrar um saque em uma conta.
 * Recebe como parâmetros a “agência”, o número da “conta” e o valor do saque.
 * Atualiza o “balance” da conta, decrementando-o com o valor recebido e
 * cobrando uma tarifa de saque de (1).
 * É verificado se a conta informada existe, caso não exista retorna um erro,
 * caso exista retorna o saldo atual da conta. Também valida se a conta possui
 * saldo suficiente para o saque, retornando um erro caso contrário.
 */
appRouter.patch('/withdrawal/:agency/:account/:value', async (req, res) => {
  try {
    const { agency, account, value } = req.params;

    const accountFind = await accountModel.find({
      agencia: agency,
      conta: account,
    });

    if (accountFind.length === 0)
      res.status(404).send('Agência e/ou conta incorreta(s).');

    const balanceFind = await accountModel.findOneAndUpdate(
      {
        agencia: agency,
        conta: account,
        balance: { $gte: value },
      },
      {
        $inc: { balance: -value },
      }
    );
    if (balanceFind === null)
      res.status(404).send('Erro: não há saldo suficiente para essa conta.');

    res.send(
      `Saque feito. Saldo atual: ${(
        Number(balanceFind.balance) - Number(value)
      ).toString()}`
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

/**
 * Endpoint para excluir uma conta.
 * Recebe como parâmetro a “agência” e o número da “conta” da conta e retorna
 * o número de contas ativas para esta agência.
 */
appRouter.delete('/:agency/:account', async (req, res) => {
  try {
    const { agency, account } = req.params;
    const accountToDelete = await accountModel.findOneAndDelete({
      agencia: agency,
      conta: account,
    });

    if (!accountToDelete)
      res.status(404).send('Agência e/ou conta incorreta(s).');

    const quantity = await accountModel.countDocuments({
      agencia: agency,
    });

    res.send(
      `Conta apagada. A agência ${agency} ainda possui ${quantity} contas ativas.`
    );
  } catch (error) {
    res.status(500).send(error);
  }
});

export { appRouter as bankRouter };
