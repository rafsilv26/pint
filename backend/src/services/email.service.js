require('dotenv').config();

// ---------------------------------------------------------------
// Envio de emails pela API HTTPS do Brevo (https://www.brevo.com).
//
// Porquê API e não SMTP: desde 26/09/2025 o Render bloqueia TODO o
// tráfego SMTP de saída (portas 25/465/587) nos serviços gratuitos,
// pelo que Gmail/SMTP dava sempre "ETIMEDOUT CONN". A API do Brevo
// usa a porta 443 (HTTPS), que não é bloqueada. Grátis: 300 emails/dia.
// https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports
//
// Config necessária (ver .env.example):
//   BREVO_API_KEY - chave da aba "API Keys" (começa por xkeysib-)
//   EMAIL_USER    - remetente; tem de estar verificado em Brevo -> Senders
// ---------------------------------------------------------------

const verificarConfig = () => {
  if (!process.env.BREVO_API_KEY) throw new Error('BREVO_API_KEY não está definida no ambiente.');
  if (!process.env.EMAIL_USER) throw new Error('EMAIL_USER não está definido no ambiente (é o remetente).');
};

// Verificação da configuração (usada pelo diagnóstico): valida a chave
// contra a conta Brevo sem enviar nada.
const verificarLigacao = async () => {
  verificarConfig();
  const res = await fetch('https://api.brevo.com/v3/account', {
    headers: { 'api-key': process.env.BREVO_API_KEY, accept: 'application/json' }
  });
  if (!res.ok) {
    const corpo = await res.text().catch(() => '');
    throw new Error(`Chave Brevo inválida (HTTP ${res.status}): ${corpo}`);
  }
  return { modo: 'brevo-api' };
};

// Função base
const enviarEmail = async (para, assunto, html) => {
  try {
    verificarConfig();
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json'
      },
      body: JSON.stringify({
        sender: { name: 'Softinsa Badges', email: process.env.EMAIL_USER },
        to: [{ email: para }],
        subject: assunto,
        htmlContent: html
      })
    });
    if (!res.ok) {
      const corpo = await res.text().catch(() => '');
      throw new Error(`Brevo respondeu ${res.status}: ${corpo}`);
    }
    console.log(`✅ Email enviado para ${para}`);
  } catch (erro) {
    console.error(`❌ Erro ao enviar email para ${para}:`, erro.message);
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

// Email com o link de recuperação de password (fluxo "esqueci-me da password")
const emailRecuperarPassword = async (user, link) => {
  await enviarEmail(
    user.email,
    '🔑 Recuperação de password',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003087; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">SOFTINSA</h1>
        <p style="color: #cccccc; margin: 5px 0;">Plataforma de Badges</p>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Olá ${user.nome}!</h2>
        <p>Recebemos um pedido para repor a password da tua conta.</p>
        <p>Clica no botão abaixo para definires uma nova password. O link é válido durante <strong>1 hora</strong>.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${link}"
             style="background-color: #003087; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 5px;">
            Definir nova password
          </a>
        </p>
        <p style="color: #666; font-size: 13px;">Se não pediste esta recuperação, ignora este email — a tua password mantém-se igual.</p>
        <p>Equipa Softinsa Badges</p>
      </div>
    </div>
    `
  );
};

// Email de boas-vindas quando o Admin regista um novo utilizador
const emailBoasVindas = async (user, loginLink) => {
  await enviarEmail(
    user.email,
    '👋 A tua conta na Plataforma de Badges foi criada',
    `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003087; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">SOFTINSA</h1>
        <p style="color: #cccccc; margin: 5px 0;">Plataforma de Badges</p>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        <h2>Bem-vindo(a), ${user.nome}!</h2>
        <p>Foi criada uma conta para ti na Plataforma de Badges da Softinsa.</p>
        <div style="background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Email de acesso:</strong> ${user.email}</p>
        </div>
        <p>A password inicial é comunicada pelo administrador. No primeiro acesso vais ser convidado(a) a definir uma nova password.</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${loginLink}"
             style="background-color: #003087; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 5px;">
            Aceder à plataforma
          </a>
        </p>
        <p>Equipa Softinsa Badges</p>
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
  // exportados para diagnóstico (scripts/test-email.js) e usos genéricos
  verificarLigacao,
  enviarEmail,
  emailCandidaturaSubmetida,
  emailNovaSubmissao,
  emailEnviadoParaServiceLine,
  emailNovaValidacaoSLL,
  emailBadgeAprovado,
  emailBadgeRejeitado,
  emailSendBack,
  emailRecuperarPassword,
  emailBoasVindas
};