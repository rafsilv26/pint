// =============================================================
//  Diagnóstico do envio de emails (API Brevo)
//
//  Uso (a partir da pasta backend/):
//    node scripts/test-email.js                      -> envia para o próprio EMAIL_USER
//    node scripts/test-email.js alguem@exemplo.com   -> envia para o destinatário indicado
//
//  Requer no backend/.env (ver .env.example):
//    BREVO_API_KEY - chave da aba "API Keys" do Brevo (começa por xkeysib-)
//    EMAIL_USER    - remetente verificado em Brevo -> Settings -> Senders
// =============================================================
require('dotenv').config();

const { verificarLigacao, enviarEmail } = require('../src/services/email.service');

(async () => {
  console.log('--- Diagnóstico de email (Brevo) ---');
  console.log('BREVO_API_KEY:', process.env.BREVO_API_KEY ? `definida (${process.env.BREVO_API_KEY.length} caracteres)` : '(NÃO DEFINIDA)');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || '(NÃO DEFINIDO)');

  try {
    await verificarLigacao();
    console.log('\n✅ Chave válida — ligação à conta Brevo OK.');
  } catch (erro) {
    console.error(`\n❌ Falha na verificação: ${erro.message}`);
    if (erro.message.includes('401')) {
      console.error('   A chave tem de ser da aba "API Keys" do Brevo (começa por xkeysib-),');
      console.error('   não da aba SMTP. Gera uma em Settings -> SMTP & API -> API Keys.');
    }
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
    console.error(`\n❌ Chave OK mas o envio falhou: ${erro.message}`);
    console.error('   Confirma que o remetente (EMAIL_USER) está verificado em Brevo -> Settings -> Senders.');
    process.exit(1);
  }
})();
