// =============================================================
//  Diagnóstico do envio de emails (SMTP/Gmail)
//
//  Uso (a partir da pasta backend/):
//    node scripts/test-email.js                      -> envia para o próprio EMAIL_USER
//    node scripts/test-email.js alguem@exemplo.com   -> envia para o destinatário indicado
//
//  Requer EMAIL_USER e EMAIL_PASS no backend/.env (ver .env.example).
//  No Render, corre como one-off job ou confirma as env vars no dashboard.
// =============================================================
require('dotenv').config();

const { transporter, enviarEmail } = require('../src/services/email.service');

const DICAS_POR_ERRO = {
  EAUTH: [
    'Autenticação recusada pelo Gmail.',
    'A EMAIL_PASS tem de ser uma "App Password" (16 letras) criada em',
    'https://myaccount.google.com/apppasswords — exige verificação em 2 passos ativa.',
    'A password normal da conta Google NÃO funciona por SMTP.'
  ],
  ETIMEDOUT: ['Timeout a ligar ao smtp.gmail.com:587 — a rede/host está a bloquear a porta de saída.'],
  ECONNECTION: ['Não foi possível ligar ao smtp.gmail.com:587 — verifica firewall/rede.'],
  EDNS: ['Falha de DNS a resolver smtp.gmail.com — verifica a ligação à internet.']
};

(async () => {
  console.log('--- Diagnóstico de email ---');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '(NÃO DEFINIDO)');
  console.log(
    'EMAIL_PASS:',
    process.env.EMAIL_PASS ? `definida (${process.env.EMAIL_PASS.length} caracteres)` : '(NÃO DEFINIDA)'
  );

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('\n❌ Define EMAIL_USER e EMAIL_PASS no backend/.env (ver backend/.env.example).');
    process.exit(1);
  }

  try {
    await transporter.verify();
    console.log('\n✅ Ligação e autenticação SMTP OK.');
  } catch (erro) {
    console.error(`\n❌ Falha na ligação SMTP (${erro.code || 'sem código'}): ${erro.message}`);
    for (const dica of DICAS_POR_ERRO[erro.code] || []) console.error('   ' + dica);
    process.exit(1);
  }

  const destinatario = process.argv[2] || process.env.EMAIL_USER;
  try {
    await enviarEmail(
      destinatario,
      '✅ Teste de email — Plataforma de Badges Softinsa',
      '<p>Se estás a ler isto, o envio de emails do backend está a funcionar. 🎉</p>'
    );
    console.log(`\n✅ Email de teste enviado para ${destinatario}. Confirma a caixa de entrada (e o spam).`);
    process.exit(0);
  } catch (erro) {
    console.error(`\n❌ Ligação OK mas o envio falhou (${erro.code || 'sem código'}): ${erro.message}`);
    process.exit(1);
  }
})();
