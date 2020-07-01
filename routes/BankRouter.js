import express from 'express';
import { accountModel } from '../models/accountModel.js';
const appRouter = express();

//Fees: (Taxas)
const withdrawalFee = 1;
const trasnferFee = 8;

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
    const total = value + withdrawalFee;

    const accountFind = await accountModel.find({
      agencia: agency,
      conta: account,
    });

    if (accountFind.length === 0)
      res.status(404).send('Erro: agência e/ou conta incorreta(s).');

    const balanceFind = await accountModel.findOneAndUpdate(
      {
        agencia: agency,
        conta: account,
        balance: { $gte: total },
      },
      {
        $inc: { balance: -total },
      }
    );
    if (balanceFind === null)
      res.status(404).send('Erro: não há saldo suficiente para essa conta.');

    res.send(
      `Saque feito. Saldo atual: ${(
        Number(balanceFind.balance) - Number(total)
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
      res.status(404).send('Erro: agência e/ou conta incorreta(s).');

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

/**
 * Endpoint que realiza transferências entre contas.
 * Recebe como parâmetro o número da “conta” origem, o número da “conta”
 * destino e o valor de transferência.
 * Valida se as contas são da mesma agência para realizar a transferência.
 * Caso sejam de agências distintas o valor de tarifa de transferencia (8)
 * deve ser debitado na “conta” origem.
 * O endpoint retorna o saldo da conta origem.
 */
appRouter.post(
  '/:agency1/:account1/:agency2/:account2/:value',
  async (req, res) => {
    try {
      const { agency1, account1, agency2, account2, value } = req.params;

      if (value <= 0) res.status(404).send('Erro: valor menor ou igual a 0.');

      //se agências diferentes, será cobrada tarifa
      const total = agency1 === agency2 ? value : Number(value) + trasnferFee;

      //PROCURA CONTA 1
      const account1Find = await accountModel.find({
        agencia: agency1,
        conta: account1,
      });
      if (account1Find.length === 0)
        res.status(404).send('Erro: dados da conta origem incorretos.');

      //PROCURA CONTA 2
      const account2Find = await accountModel.find({
        agencia: agency2,
        conta: account2,
      });
      if (account2Find.length === 0)
        res.status(404).send('Erro: dados da conta destino incorretos.');

      //VERIFICA SALDO CONTA 1
      const balance1Find = await accountModel.findOneAndUpdate(
        {
          agencia: agency1,
          conta: account1,
          balance: { $gte: total },
        },
        {
          $inc: { balance: -total },
        }
      );
      if (balance1Find === null)
        res.status(404).send('Erro: saldo da conta origem insuficiente.');

      //TRANSFERE DE CONTA 1 À CONTA 2
      const balance2Find = await accountModel.findOneAndUpdate(
        {
          agencia: agency2,
          conta: account2,
          balance: { $gte: value },
        },
        {
          $inc: { balance: value },
        }
      );

      res.send(
        `Transferência feita. Saldo atual da conta origem: ${(
          Number(balance1Find.balance) - Number(total)
        ).toString()}`
      );
    } catch (error) {
      res.status(500).send(error);
    }
  }
);

/**
 * Endpoint que consulta a média do saldo dos clientes de determinada agência.
 * Recebe como parametro a “agência” e retorna o balance médio das contas.
 */
appRouter.get('/:agency', async (req, res) => {
  try {
    const { agency } = req.params;
    // const accountFind = await accountModel.aggregate([
    //   {
    //     $group: {
    //       _id: { agencia: agency },
    //       total: { $sum: 'balance' },
    //     },
    //   },
    // ]);
    const filter = [
      {
        $match: {
          // <passe o filtro por aqui caso tiver>,
          agencia: Number(agency),
        },
      },
      {
        $group: {
          _id: `Média da agência ${agency}`, //'$agencia',
          média: { $avg: '$balance' },
        },
      },
      // { $sort: <para ordenar>},
      // { $limit: <quantidade de retorno>},
    ];
    let result = await accountModel.aggregate(filter);

    console.log('\n\t\t----------------------------\naccountFind:');
    console.log(result);

    if (result.length === 0) res.status(404).send('Agência vazia.');

    res.send(result);
  } catch (error) {
    res.status(500).send(error);
  }
});

/**
 * Endpoint para consulta dos clientes com o menor saldo em conta.
 * Recebe como parâmetro um valor numérico para determinar a quantidade de
 * clientes a serem listados, e retorna em ordem crescente pelo saldo a lista
 * dos clientes (agência, conta, saldo).
 */

export { appRouter as bankRouter };
