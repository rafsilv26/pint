// src/services/email.service.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail', // ou SendGrid
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const enviarEmail = async (para, assunto, html) => {
  await transporter.sendMail({
    from: '"Softinsa Badges" <badges@softinsa.pt>',
    to: para,
    subject: assunto,
    html
  });
};

// Emails específicos do projeto
const emailCandidaturaSubmetida = (consultor, badge) => {
  return enviarEmail(
    consultor.email,
    'Candidatura submetida com sucesso',
    `<h2>Olá ${consultor.nome}!</h2>
     <p>A tua candidatura ao badge <strong>${badge.nome}</strong> foi submetida.</p>
     <p>Aguarda validação do Talent Manager.</p>`
  );
};

const emailAprovado = (consultor, badge) => {
  return enviarEmail(
    consultor.email,
    '🎉 Badge aprovado!',
    `<h2>Parabéns ${consultor.nome}!</h2>
     <p>O teu badge <strong>${badge.nome}</strong> foi aprovado!</p>
     <p>Já podes consultar o teu badge em: <a href="${process.env.APP_URL}/badge/${badge.uuid}">Ver Badge</a></p>`
  );
};

const emailRejeitado = (consultor, badge, motivo) => {
  return enviarEmail(
    consultor.email,
    'Candidatura rejeitada',
    `<h2>Olá ${consultor.nome}</h2>
     <p>A tua candidatura ao badge <strong>${badge.nome}</strong> foi rejeitada.</p>
     <p><strong>Motivo:</strong> ${motivo}</p>`
  );
};

const emailTalentManager = (talentManager, consultor, badge) => {
  return enviarEmail(
    talentManager.email,
    'Nova candidatura para validar',
    `<h2>Nova candidatura recebida</h2>
     <p>O consultor <strong>${consultor.nome}</strong> submeteu candidatura ao badge <strong>${badge.nome}</strong>.</p>
     <p><a href="${process.env.APP_URL}/talent/candidaturas">Ver candidatura</a></p>`
  );
};

module.exports = {
  emailCandidaturaSubmetida,
  emailAprovado,
  emailRejeitado,
  emailTalentManager
};