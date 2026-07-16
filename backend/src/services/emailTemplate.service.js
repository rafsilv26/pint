// =============================================================
// Templates de email configuráveis (guião — bónus Consultor 23:
// "Configuração de template de email"; req. Admin 7: "Configuração
// de notificações").
//
// Cada tipo de email tem aqui um template por omissão (assunto +
// corpo HTML interior com variáveis {{...}}). O Admin pode gravar
// um override na tabela EMAIL_TEMPLATE; quando existe e está ativo,
// substitui o padrão. Apagar o override repõe o padrão.
//
// O cabeçalho/rodapé (layout) é fixo para manter a identidade visual;
// o Admin edita apenas o conteúdo interior.
// =============================================================

const TEMPLATE_DEFS = {
  'candidatura-submetida': {
    nome: 'Candidatura submetida',
    descricao: 'Enviado ao consultor quando submete uma candidatura a badge.',
    assunto: '✅ Candidatura submetida com sucesso',
    variaveis: { consultor: 'Nome do consultor', badge: 'Nome do badge', nivel: 'Nível do badge' },
    exemplo: { consultor: 'Maria Santos', badge: 'Azure Fundamentals', nivel: 'Júnior' },
    corpo: `
      <h2>Olá {{consultor}}!</h2>
      <p>A tua candidatura ao badge <strong>{{badge}}</strong> foi submetida com sucesso.</p>
      <p>Aguarda a validação do Talent Manager. Serás notificado por email.</p>
      <div style="background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Badge:</strong> {{badge}}</p>
        <p style="margin: 5px 0;"><strong>Nível:</strong> {{nivel}}</p>
        <p style="margin: 5px 0;"><strong>Estado:</strong> Submetido</p>
      </div>
      <p>Equipa Softinsa Badges</p>`
  },
  'nova-submissao': {
    nome: 'Nova candidatura (Talent Manager)',
    descricao: 'Enviado aos Talent Managers quando entra uma candidatura nova para validar.',
    assunto: '🔔 Nova candidatura para validar',
    variaveis: { consultor: 'Nome do consultor', badge: 'Nome do badge', nivel: 'Nível do badge' },
    exemplo: { consultor: 'Maria Santos', badge: 'Azure Fundamentals', nivel: 'Júnior' },
    corpo: `
      <h2>Nova candidatura recebida</h2>
      <p>O consultor <strong>{{consultor}}</strong> submeteu uma candidatura.</p>
      <div style="background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Consultor:</strong> {{consultor}}</p>
        <p style="margin: 5px 0;"><strong>Badge:</strong> {{badge}}</p>
        <p style="margin: 5px 0;"><strong>Nível:</strong> {{nivel}}</p>
      </div>
      <p>Acede à plataforma para validar as evidências.</p>`
  },
  'enviado-service-line': {
    nome: 'Candidatura em validação final',
    descricao: 'Enviado ao consultor quando o Talent Manager valida e o pedido segue para o Service Line Leader.',
    assunto: '🔄 Candidatura em validação final',
    variaveis: { consultor: 'Nome do consultor', badge: 'Nome do badge' },
    exemplo: { consultor: 'Maria Santos', badge: 'Azure Fundamentals' },
    corpo: `
      <h2>Olá {{consultor}}!</h2>
      <p>A tua candidatura ao badge <strong>{{badge}}</strong> foi validada pelo Talent Manager.</p>
      <p>Está agora em validação final pelo Service Line Leader.</p>`
  },
  'nova-validacao-sll': {
    nome: 'Candidatura para aprovação (Service Line Leader)',
    descricao: 'Enviado ao Service Line Leader quando uma candidatura validada fica à espera da decisão final.',
    assunto: '🔔 Candidatura à espera da tua aprovação final',
    variaveis: { consultor: 'Nome do consultor', badge: 'Nome do badge', nivel: 'Nível do badge' },
    exemplo: { consultor: 'Maria Santos', badge: 'Azure Fundamentals', nivel: 'Júnior' },
    corpo: `
      <h2>Candidatura validada pelo Talent Manager</h2>
      <p>A candidatura do consultor <strong>{{consultor}}</strong> foi validada pelo Talent Manager e está agora à espera da tua aprovação final.</p>
      <div style="background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Consultor:</strong> {{consultor}}</p>
        <p style="margin: 5px 0;"><strong>Badge:</strong> {{badge}}</p>
        <p style="margin: 5px 0;"><strong>Nível:</strong> {{nivel}}</p>
      </div>
      <p>Acede à plataforma para tomar a decisão final.</p>`
  },
  'badge-aprovado': {
    nome: 'Badge aprovado',
    descricao: 'Enviado ao consultor quando o badge é aprovado, com link para a página pública.',
    assunto: '🎉 Badge aprovado!',
    variaveis: { consultor: 'Nome do consultor', badge: 'Nome do badge', nivel: 'Nível do badge', pontos: 'Pontos do badge', link: 'Link público do badge' },
    exemplo: { consultor: 'Maria Santos', badge: 'Azure Fundamentals', nivel: 'Júnior', pontos: 100, link: 'https://exemplo.com/badge/abc' },
    corpo: `
      <h2>Parabéns {{consultor}}! 🎉</h2>
      <p>O teu badge <strong>{{badge}}</strong> foi aprovado!</p>
      <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Badge:</strong> {{badge}}</p>
        <p style="margin: 5px 0;"><strong>Nível:</strong> {{nivel}}</p>
        <p style="margin: 5px 0;"><strong>Pontos:</strong> {{pontos}}</p>
      </div>
      <a href="{{link}}"
         style="background-color: #003087; color: white; padding: 10px 20px;
                text-decoration: none; border-radius: 5px;">
        Ver Badge
      </a>`
  },
  'badge-rejeitado': {
    nome: 'Candidatura rejeitada',
    descricao: 'Enviado ao consultor quando a candidatura é rejeitada, com o motivo.',
    assunto: '❌ Candidatura rejeitada',
    variaveis: { consultor: 'Nome do consultor', badge: 'Nome do badge', motivo: 'Motivo da rejeição' },
    exemplo: { consultor: 'Maria Santos', badge: 'Azure Fundamentals', motivo: 'As evidências não cobrem os requisitos obrigatórios.' },
    corpo: `
      <h2>Olá {{consultor}}</h2>
      <p>A tua candidatura ao badge <strong>{{badge}}</strong> foi rejeitada.</p>
      <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Motivo:</strong> {{motivo}}</p>
      </div>
      <p>Podes submeter uma nova candidatura com as evidências corretas.</p>`
  },
  'send-back': {
    nome: 'Candidatura devolvida',
    descricao: 'Enviado ao consultor quando a candidatura é devolvida para correção.',
    assunto: '↩️ Candidatura devolvida para correção',
    variaveis: { consultor: 'Nome do consultor', badge: 'Nome do badge', comentario: 'Comentário de quem devolveu' },
    exemplo: { consultor: 'Maria Santos', badge: 'Azure Fundamentals', comentario: 'Falta o certificado do módulo 2.' },
    corpo: `
      <h2>Olá {{consultor}}</h2>
      <p>A tua candidatura ao badge <strong>{{badge}}</strong> foi devolvida para correção.</p>
      <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Comentário:</strong> {{comentario}}</p>
      </div>
      <p>Por favor corrige as evidências e volta a submeter.</p>`
  },
  'recuperar-password': {
    nome: 'Recuperação de password',
    descricao: 'Enviado com o link para repor a password (válido 1 hora).',
    assunto: '🔑 Recuperação de password',
    variaveis: { nome: 'Nome do utilizador', link: 'Link de reposição da password' },
    exemplo: { nome: 'Maria Santos', link: 'https://exemplo.com/atualizar-password?token=abc' },
    corpo: `
      <h2>Olá {{nome}}!</h2>
      <p>Recebemos um pedido para repor a password da tua conta.</p>
      <p>Clica no botão abaixo para definires uma nova password. O link é válido durante <strong>1 hora</strong>.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="{{link}}"
           style="background-color: #003087; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 5px;">
          Definir nova password
        </a>
      </p>
      <p style="color: #666; font-size: 13px;">Se não pediste esta recuperação, ignora este email — a tua password mantém-se igual.</p>
      <p>Equipa Softinsa Badges</p>`
  },
  'boas-vindas': {
    nome: 'Boas-vindas (conta criada)',
    descricao: 'Enviado quando o Admin cria uma conta nova, com os dados de acesso.',
    assunto: '👋 A tua conta na Plataforma de Badges foi criada',
    variaveis: {
      nome: 'Nome do utilizador',
      email: 'Email de acesso',
      blocoPassword: 'Bloco HTML com a password temporária (vazio se não houver)',
      instrucoes: 'Instruções de primeiro acesso',
      blocoConfirmar: 'Bloco HTML com o botão de confirmação de email (vazio se não houver)',
      loginLink: 'Link de acesso à plataforma'
    },
    exemplo: {
      nome: 'Maria Santos',
      email: 'maria.santos@exemplo.com',
      blocoPassword: '<p style="margin: 8px 0 0;"><strong>Password temporária:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;">Xy7#kQ21</code></p>',
      instrucoes: 'Usa a password temporária acima no primeiro acesso. Vais ser convidado(a) a definir uma nova password.',
      blocoConfirmar: '',
      loginLink: 'https://exemplo.com/login'
    },
    corpo: `
      <h2>Bem-vindo(a), {{nome}}!</h2>
      <p>Foi criada uma conta para ti na Plataforma de Badges da Softinsa.</p>
      <div style="background-color: #e8f0fe; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0;"><strong>Email de acesso:</strong> {{email}}</p>
        {{blocoPassword}}
      </div>
      <p>{{instrucoes}}</p>
      {{blocoConfirmar}}
      <p style="text-align: center; margin: 20px 0 30px;">
        <a href="{{loginLink}}"
           style="background-color: #003087; color: white; padding: 12px 24px;
                  text-decoration: none; border-radius: 5px;">
          Aceder à plataforma
        </a>
      </p>
      <p>Equipa Softinsa Badges</p>`
  },
  'alerta-sla': {
    nome: 'Alerta de SLA ultrapassado',
    descricao: 'Enviado a Talent Managers / Service Line Leaders com as candidaturas em atraso.',
    assunto: '⏰ SLA ultrapassado: {{total}} candidatura(s) em atraso',
    variaveis: {
      nome: 'Nome do destinatário',
      total: 'Número de candidaturas em atraso',
      dias: 'Dias do SLA definido',
      tabela: 'Linhas HTML da tabela de candidaturas em atraso'
    },
    exemplo: {
      nome: 'Maria Santos',
      total: 2,
      dias: 5,
      tabela: `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0;">Azure Fundamentals</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0;">João Silva</td>
          <td style="padding: 6px 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: #c62828; font-weight: bold;">8</td>
        </tr>`
    },
    corpo: `
      <h2>Olá {{nome}}</h2>
      <p>Há <strong>{{total}} candidatura(s)</strong> à espera de decisão há mais de <strong>{{dias}} dia(s)</strong> (SLA definido):</p>
      <table style="width: 100%; border-collapse: collapse; background: white; margin: 20px 0; font-size: 14px;">
        <tr style="background-color: #e8f0fe;">
          <th style="padding: 8px 10px; text-align: left;">Badge</th>
          <th style="padding: 8px 10px; text-align: left;">Consultor</th>
          <th style="padding: 8px 10px;">Dias em espera</th>
        </tr>
        {{tabela}}
      </table>
      <p>Acede à plataforma para tomares as decisões pendentes.</p>
      <p>Equipa Softinsa Badges</p>`
  }
};

// Substitui {{variavel}} pelos valores; variáveis desconhecidas ficam vazias.
const render = (texto, vars = {}) =>
  String(texto || '').replace(/\{\{(\w+)\}\}/g, (_m, chave) => (vars[chave] != null ? String(vars[chave]) : ''));

// Layout fixo (cabeçalho Softinsa) aplicado a todos os emails.
const layoutEmail = (corpoInterior) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #003087; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">SOFTINSA</h1>
        <p style="color: #cccccc; margin: 5px 0;">Plataforma de Badges</p>
      </div>
      <div style="padding: 30px; background-color: #f9f9f9;">
        ${corpoInterior}
      </div>
    </div>
    `;

// Override do Admin, se existir e estiver ativo. O require é lazy e qualquer
// falha (BD indisponível, tabela ainda não criada) cai no template padrão —
// o envio de emails nunca fica bloqueado pela personalização.
const getOverride = async (code) => {
  try {
    const { EmailTemplate } = require('../models');
    return await EmailTemplate.findOne({ where: { code, active: true } });
  } catch (erro) {
    console.error(`Erro ao ler template personalizado '${code}':`, erro.message);
    return null;
  }
};

// Assunto e corpo efetivos (override ou padrão), ainda com {{variáveis}}.
const getTemplateEfetivo = async (code) => {
  const def = TEMPLATE_DEFS[code];
  if (!def) throw new Error(`Template de email desconhecido: ${code}`);
  const override = await getOverride(code);
  return {
    assunto: override?.subject || def.assunto,
    corpo: override?.body || def.corpo,
    personalizado: Boolean(override)
  };
};

// Renderiza o email completo (assunto + HTML final) para um tipo e variáveis.
const renderEmail = async (code, vars) => {
  const { assunto, corpo } = await getTemplateEfetivo(code);
  return {
    assunto: render(assunto, vars),
    html: layoutEmail(render(corpo, vars))
  };
};

module.exports = { TEMPLATE_DEFS, render, layoutEmail, getTemplateEfetivo, renderEmail };
