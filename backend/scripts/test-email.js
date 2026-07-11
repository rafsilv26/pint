// =============================================================
//  Diagnóstico do envio de emails
//
//  Uso (a partir da pasta backend/):
//    node scripts/test-email.js                      -> envia para o próprio EMAIL_USER
//    node scripts/test-email.js alguem@exemplo.com   -> envia para o destinatário indicado
//
//  Modos (ver backend/.env.example):
//    - BREVO_API_KEY definida -> envio pela API HTTPS do Brevo (obrigatório
//      no Render free, que bloqueia as portas SMTP 25/465/587)
//    - sem BREVO_API_KEY      -> SMTP Gmail (EMAIL_USER + EMAIL_PASS),
//      só funciona em desenvolvimento local
// =============================================================
require('dotenv').config();

const { verificarLigacao, enviarEmail } = require('../src/services/email.service');

const DICAS_POR_ERRO = {
  EAUTH: [
    'Autenticação recusada pelo Gmail.',
    'A EMAIL_PASS tem de ser uma "App Password" (16 letras) criada em',
    'https://myaccount.google.com/apppasswords — exige verificação em 2 passos ativa.',
    'A password normal da conta Google NÃO funciona por SMTP.'
  ],
  ETIMEDOUT: [
    'Timeout a ligar ao smtp.gmail.com:587 — a rede/host está a bloquear a porta de saída.',
    'NOTA: o Render FREE bloqueia todas as portas SMTP desde 26/09/2025.',
    'Em produção usa a API do Brevo: define BREVO_API_KEY (ver .env.example).'
  ],
  ECONNECTION: ['Não foi possível ligar ao smtp.gmail.com:587 — verifica firewall/rede.'],
  EDNS: ['Falha de DNS a resolver smtp.gmail.com — verifica a ligação à internet.']
};

(async () => {
  console.log('--- Diagnóstico de email ---');
  console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? 'definida (modo API HTTPS)' : '(não definida — modo SMTP Gmail)');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '(NÃO DEFINIDO)');
  console.log(
    'EMAIL_PASS:',
    process.env.EMAIL_PASS ? `definida (${process.env.EMAIL_PASS.length} caracteres)` : '(NÃO DEFINIDA)'
  );

  if (!process.env.EMAIL_USER) {
    console.error('\n❌ Define EMAIL_USER no backend/.env — é usado como remetente nos dois modos.');
    process.exit(1);
  }
  if (!process.env.BREVO_API_KEY && !process.env.EMAIL_PASS) {
    console.error('\n❌ Define BREVO_API_KEY (produção) ou EMAIL_PASS (SMTP local) no backend/.env.');
    process.exit(1);
  }

  try {
    const { modo } = await verificarLigacao();
    console.log(`\n✅ Ligação/autenticação OK (modo: ${modo}).`);
  } catch (erro) {
    console.error(`\n❌ Falha na verificação (${erro.code || 'sem código'}): ${erro.message}`);
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
    console.error('   Se o modo é brevo-api: confirma que o remetente (EMAIL_USER) está verificado em Brevo -> Settings -> Senders.');
    process.exit(1);
  }
})();
