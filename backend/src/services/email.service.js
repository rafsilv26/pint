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

const { renderEmail } = require('./emailTemplate.service');

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
const enviarEmail = async (para, assunto, html, { fetchImplementation = fetch } = {}) => {
  try {
    verificarConfig();
    const res = await fetchImplementation('https://api.brevo.com/v3/smtp/email', {
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
    const result = await res.json().catch(() => ({}));
    console.log(`✅ Email enviado para ${para}`);
    return { id: result.messageId || null, to: para };
  } catch (erro) {
    console.error(`❌ Erro ao enviar email para ${para}:`, erro.message);
    throw erro;
  }
};

// Envia um email de um tipo do registo de templates: resolve o template
// efetivo (override do Admin ou padrão), substitui as variáveis e envia.
const enviarComTemplate = async (code, para, vars) => {
  const { assunto, html } = await renderEmail(code, vars);
  return enviarEmail(para, assunto, html);
};

// Email ao consultor quando submete candidatura
const emailCandidaturaSubmetida = async (consultor, badge) => {
  await enviarComTemplate('candidatura-submetida', consultor.email, {
    consultor: consultor.nome,
    badge: badge.nome,
    nivel: badge.nivel
  });
};

// Email ao Talent Manager quando há nova candidatura
const emailNovaSubmissao = async (talentManager, consultor, badge) => {
  await enviarComTemplate('nova-submissao', talentManager.email, {
    consultor: consultor.nome,
    badge: badge.nome,
    nivel: badge.nivel
  });
};

// Email ao consultor quando Talent Manager aprova
const emailEnviadoParaServiceLine = async (consultor, badge) => {
  await enviarComTemplate('enviado-service-line', consultor.email, {
    consultor: consultor.nome,
    badge: badge.nome
  });
};

// Email ao Service Line Leader quando o Talent Manager valida uma
// candidatura e esta fica à espera da decisão final dele
const emailNovaValidacaoSLL = async (serviceLineLeader, consultor, badge) => {
  await enviarComTemplate('nova-validacao-sll', serviceLineLeader.email, {
    consultor: consultor.nome,
    badge: badge.nome,
    nivel: badge.nivel || badge.Level?.nome || ''
  });
};

// Email ao consultor quando badge aprovado
const emailBadgeAprovado = async (consultor, badge, uuid) => {
  return enviarComTemplate('badge-aprovado', consultor.email, {
    consultor: consultor.nome,
    badge: badge.nome,
    nivel: badge.nivel || badge.Level?.nome || '',
    pontos: badge.ponto ?? badge.pontos ?? 0,
    link: `${(process.env.FRONTEND_URL || process.env.APP_URL || '').replace(/\/$/, '')}/badge/${uuid}`
  });
};

// Email ao consultor quando rejeitado
const emailBadgeRejeitado = async (consultor, badge, motivo) => {
  await enviarComTemplate('badge-rejeitado', consultor.email, {
    consultor: consultor.nome,
    badge: badge.nome,
    motivo
  });
};

// Email com o link de recuperação de password (fluxo "esqueci-me da password")
const emailRecuperarPassword = async (user, link) => {
  await enviarComTemplate('recuperar-password', user.email, {
    nome: user.nome,
    link
  });
};

// Email de boas-vindas quando o Admin regista um novo utilizador.
// confirmLink (opcional): link para confirmar o endereço de email.
const emailBoasVindas = async (user, loginLink, confirmLink, tempPassword) => {
  await enviarComTemplate('boas-vindas', user.email, {
    nome: user.nome,
    email: user.email,
    loginLink,
    blocoPassword: tempPassword
      ? `<p style="margin: 8px 0 0;"><strong>Password temporária:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;">${tempPassword}</code></p>`
      : '',
    instrucoes: tempPassword
      ? 'Usa a password temporária acima no primeiro acesso. Vais ser convidado(a) a definir uma nova password.'
      : 'No primeiro acesso vais entrar com a password que definiste.',
    blocoConfirmar: confirmLink ? `
        <p style="text-align: center; margin: 30px 0 10px;">
          <a href="${confirmLink}"
             style="background-color: #2e7d32; color: white; padding: 12px 24px;
                    text-decoration: none; border-radius: 5px;">
            Confirmar o meu email
          </a>
        </p>
        <p style="color: #666; font-size: 13px; text-align: center;">Confirma que este endereço de email é teu.</p>
        ` : ''
  });
};

// Alerta de SLA ultrapassado, enviado a Talent Managers / Service Line
// Leaders com a lista de candidaturas em atraso que lhes dizem respeito.
const emailAlertaSLA = async (user, atrasadas, responseDays) => {
  const linhas = atrasadas.map((c) => `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0;">${c.badgeNome}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0;">${c.consultorNome}</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #c62828; font-weight: bold;">${c.diasEmEspera}</td>
        </tr>`).join('');

  await enviarComTemplate('alerta-sla', user.email, {
    nome: user.nome,
    total: atrasadas.length,
    dias: responseDays,
    tabela: linhas
  });
};

// Email ao consultor quando send back
const emailSendBack = async (consultor, badge, comentario) => {
  await enviarComTemplate('send-back', consultor.email, {
    consultor: consultor.nome,
    badge: badge.nome,
    comentario
  });
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
  emailBoasVindas,
  emailAlertaSLA
};
