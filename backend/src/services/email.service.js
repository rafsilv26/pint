require('dotenv').config();

// O Render bloqueia ligações SMTP diretas de saída (confirmado: mesmo sem
// IPv6 e com a porta 587, o pedido nunca chega a lugar nenhum e dá sempre
// "Connection timeout"). A alternativa fiável nestas plataformas é enviar
// por HTTPS via uma API de email transacional, em vez de SMTP puro — por
// isso trocámos o nodemailer/Gmail por uma chamada direta à API do Resend.
//
// IMPORTANTE: sem verificares um domínio próprio no Resend, só é possível
// enviar para o email da própria conta Resend (limitação deles, não nossa).
// Assim que tiveres um domínio verificado, basta mudar RESEND_FROM.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || 'Softinsa Badges <onboarding@resend.dev>';

// Função base
const enviarEmail = async (para, assunto, html) => {
  try {
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY não está definida nas variáveis de ambiente.');
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: para,
        subject: assunto,
        html
      })
    });

    if (!res.ok) {
      const corpo = await res.text().catch(() => '');
      throw new Error(`Resend respondeu ${res.status}: ${corpo}`);
    }

    console.log(`✅ Email enviado para ${para}`);
  } catch (erro) {
    console.error('❌ Erro ao enviar email:', erro.message);
    throw erro;
  }
};

// Email ao consultor quando submete candidatura
const emailCandidaturaSubmetida = async (consultor, badge) => {
  await enviarEmail(
    consultor.email,
    '✅ Candidatura submetida com sucesso',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003087; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">SOFTINSA</h1>
        <p style="color: #cccccc; margin: 5px 0;">Plataforma de Badges</p>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Olá ${consultor.nome}!</h2>
        <p>A tua candidatura ao badge <strong>${badge.nome}</strong> foi submetida com sucesso.</p>
        <p>Aguarda a validação do Talent Manager. Serás notificado por email.</p>
        <div style="background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Badge:</strong> ${badge.nome}</p>
          <p style="margin: 5px 0;"><strong>Nível:</strong> ${badge.nivel}</p>
          <p style="margin: 5px 0;"><strong>Estado:</strong> Submetido</p>
        </div>
        <p>Equipa Softinsa Badges</p>
      </div>
    </div>
    `
  );
};

// Email ao Talent Manager quando há nova candidatura
const emailNovaSubmissao = async (talentManager, consultor, badge) => {
  await enviarEmail(
    talentManager.email,
    '🔔 Nova candidatura para validar',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003087; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">SOFTINSA</h1>
        <p style="color: #cccccc; margin: 5px 0;">Plataforma de Badges</p>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Nova candidatura recebida</h2>
        <p>O consultor <strong>${consultor.nome}</strong> submeteu uma candidatura.</p>
        <div style="background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Consultor:</strong> ${consultor.nome}</p>
          <p style="margin: 5px 0;"><strong>Badge:</strong> ${badge.nome}</p>
          <p style="margin: 5px 0;"><strong>Nível:</strong> ${badge.nivel}</p>
        </div>
        <p>Acede à plataforma para validar as evidências.</p>
      </div>
    </div>
    `
  );
};

// Email ao consultor quando Talent Manager aprova
const emailEnviadoParaServiceLine = async (consultor, badge) => {
  await enviarEmail(
    consultor.email,
    '🔄 Candidatura em validação final',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003087; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">SOFTINSA</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Olá ${consultor.nome}!</h2>
        <p>A tua candidatura ao badge <strong>${badge.nome}</strong> foi validada pelo Talent Manager.</p>
        <p>Está agora em validação final pelo Service Line Leader.</p>
      </div>
    </div>
    `
  );
};

// Email ao Service Line Leader quando o Talent Manager valida uma
// candidatura e esta fica à espera da decisão final dele
const emailNovaValidacaoSLL = async (serviceLineLeader, consultor, badge) => {
  await enviarEmail(
    serviceLineLeader.email,
    '🔔 Candidatura à espera da tua aprovação final',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003087; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">SOFTINSA</h1>
        <p style="color: #cccccc; margin: 5px 0;">Plataforma de Badges</p>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Candidatura validada pelo Talent Manager</h2>
        <p>A candidatura do consultor <strong>${consultor.nome}</strong> foi validada pelo Talent Manager e está agora à espera da tua aprovação final.</p>
        <div style="background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Consultor:</strong> ${consultor.nome}</p>
          <p style="margin: 5px 0;"><strong>Badge:</strong> ${badge.nome}</p>
          <p style="margin: 5px 0;"><strong>Nível:</strong> ${badge.nivel || ''}</p>
        </div>
        <p>Acede à plataforma para tomar a decisão final.</p>
      </div>
    </div>
    `
  );
};

// Email ao consultor quando badge aprovado
const emailBadgeAprovado = async (consultor, badge, uuid) => {
  await enviarEmail(
    consultor.email,
    '🎉 Badge aprovado!',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003087; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">SOFTINSA</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Parabéns ${consultor.nome}! 🎉</h2>
        <p>O teu badge <strong>${badge.nome}</strong> foi aprovado!</p>
        <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Badge:</strong> ${badge.nome}</p>
          <p style="margin: 5px 0;"><strong>Nível:</strong> ${badge.nivel}</p>
          <p style="margin: 5px 0;"><strong>Pontos:</strong> ${badge.pontos}</p>
        </div>
        <a href="${process.env.APP_URL}/api/relatorios/verificar/${uuid}" 
           style="background-color: #003087; color: white; padding: 10px 20px; 
                  text-decoration: none; border-radius: 5px;">
          Ver Badge
        </a>
      </div>
    </div>
    `
  );
};

// Email ao consultor quando rejeitado
const emailBadgeRejeitado = async (consultor, badge, motivo) => {
  await enviarEmail(
    consultor.email,
    '❌ Candidatura rejeitada',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003087; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">SOFTINSA</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Olá ${consultor.nome}</h2>
        <p>A tua candidatura ao badge <strong>${badge.nome}</strong> foi rejeitada.</p>
        <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Motivo:</strong> ${motivo}</p>
        </div>
        <p>Podes submeter uma nova candidatura com as evidências corretas.</p>
      </div>
    </div>
    `
  );
};

// Email ao consultor quando send back
const emailSendBack = async (consultor, badge, comentario) => {
  await enviarEmail(
    consultor.email,
    '↩️ Candidatura devolvida para correção',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003087; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">SOFTINSA</h1>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Olá ${consultor.nome}</h2>
        <p>A tua candidatura ao badge <strong>${badge.nome}</strong> foi devolvida para correção.</p>
        <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Comentário:</strong> ${comentario}</p>
        </div>
        <p>Por favor corrige as evidências e volta a submeter.</p>
      </div>
    </div>
    `
  );
};

module.exports = {
  emailCandidaturaSubmetida,
  emailNovaSubmissao,
  emailEnviadoParaServiceLine,
  emailNovaValidacaoSLL,
  emailBadgeAprovado,
  emailBadgeRejeitado,
  emailSendBack
};