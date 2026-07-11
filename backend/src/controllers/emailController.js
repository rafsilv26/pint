const {
  enviarEmail,
  getEmailConfiguration
} = require('../services/email.service');

exports.status = (_req, res) => {
  try {
    const configuration = getEmailConfiguration();
    return res.json({
      provider: 'resend',
      configured: true,
      from: configuration.from,
      appUrlConfigured: Boolean(process.env.APP_URL?.trim()),
      testRecipientConfigured: Boolean(process.env.EMAIL_TEST_TO?.trim())
    });
  } catch (error) {
    return res.status(503).json({
      provider: 'resend',
      configured: false,
      code: error.code || 'EMAIL_CONFIG_INVALID',
      message: error.message,
      appUrlConfigured: Boolean(process.env.APP_URL?.trim()),
      testRecipientConfigured: Boolean(process.env.EMAIL_TEST_TO?.trim())
    });
  }
};

exports.sendTest = async (req, res) => {
  const recipient = process.env.EMAIL_TEST_TO?.trim() || req.user?.data?.email;

  try {
    const result = await enviarEmail(
      recipient,
      'Teste de email - Softinsa Badges',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #003087;">Softinsa Badges</h1>
          <p>Este email confirma que a integração com o Resend está configurada e operacional.</p>
          <p><strong>Data do teste:</strong> ${new Date().toISOString()}</p>
        </div>
      `
    );

    return res.json({
      message: 'Email de teste aceite pelo Resend.',
      email: { enviado: true, id: result.id, destinatario: result.to }
    });
  } catch (error) {
    return res.status(502).json({
      message: 'Não foi possível enviar o email de teste.',
      email: {
        enviado: false,
        code: error.code || 'EMAIL_DELIVERY_ERROR',
        providerStatus: error.status || null
      },
      details: error.message
    });
  }
};
