const assert = require('node:assert/strict');
const { test } = require('node:test');

const {
  attemptEmail,
  missingEmailRecipient,
  emailDeliveryResponse
} = require('../src/services/email-notification.service');

test('resume envios confirmados e inclui os IDs do Resend', async () => {
  const result = await attemptEmail(
    'candidatura_submetida',
    async () => ({ id: 'email-1' })
  );
  const response = emailDeliveryResponse([result]);

  assert.deepEqual(response, {
    notificacoesEmail: {
      tentativas: 1,
      enviadas: 1,
      falhadas: 0,
      resultados: [
        {
          tipo: 'candidatura_submetida',
          enviado: true,
          id: 'email-1'
        }
      ]
    }
  });
});

test('uma falha de configuração fica visível na resposta da API', async () => {
  const error = new Error('RESEND_FROM em falta');
  error.code = 'EMAIL_CONFIG_FROM_MISSING';
  const result = await attemptEmail('badge_aprovada', async () => {
    throw error;
  });
  const response = emailDeliveryResponse([result]);

  assert.equal(response.notificacoesEmail.enviadas, 0);
  assert.equal(response.notificacoesEmail.falhadas, 1);
  assert.equal(
    response.notificacoesEmail.resultados[0].codigo,
    'EMAIL_CONFIG_FROM_MISSING'
  );
  assert.match(response.aviso, /não foram enviadas/);
});

test('destinatários funcionais em falta também são reportados', () => {
  const response = emailDeliveryResponse([
    missingEmailRecipient('nova_submissao_talent_manager')
  ]);

  assert.equal(response.notificacoesEmail.falhadas, 1);
  assert.equal(
    response.notificacoesEmail.resultados[0].codigo,
    'EMAIL_RECIPIENT_NOT_FOUND'
  );
});
