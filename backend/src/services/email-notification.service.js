const attemptEmail = async (type, emailFunction, ...args) => {
  try {
    const result = await emailFunction(...args);
    return {
      tipo: type,
      enviado: true,
      id: result?.id || null
    };
  } catch (error) {
    const code = error?.code || 'EMAIL_DELIVERY_ERROR';
    console.error(`[email] falhou tipo=${type} codigo=${code}: ${error.message}`);
    return {
      tipo: type,
      enviado: false,
      codigo: code
    };
  }
};

const missingEmailRecipient = (type) => ({
  tipo: type,
  enviado: false,
  codigo: 'EMAIL_RECIPIENT_NOT_FOUND'
});

const emailDeliveryResponse = (results) => {
  const attempts = results.filter(Boolean);
  const sent = attempts.filter((result) => result.enviado);
  const failed = attempts.filter((result) => !result.enviado);

  const response = {
    notificacoesEmail: {
      tentativas: attempts.length,
      enviadas: sent.length,
      falhadas: failed.length,
      resultados: attempts
    }
  };

  if (failed.length > 0) {
    response.aviso =
      'A operação foi concluída, mas uma ou mais notificações por email não foram enviadas.';
  }

  return response;
};

module.exports = { attemptEmail, missingEmailRecipient, emailDeliveryResponse };
