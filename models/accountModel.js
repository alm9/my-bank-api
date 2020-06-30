import mongoose from 'mongoose';

const accountSchema = mongoose.Schema({
  agencia: { type: Number, required: true },
  conta: { type: Number, required: true },
  name: { type: String, required: true },
  balance: {
    type: Number,
    min: 0,
    required: true,
    /*validate(balance) {
      if (balance < 0) throw new Error('Erro: proibido saldo negativo.');
    },*/
  },
});

const accountModel = mongoose.model('accounts', accountSchema);

export { accountModel };
