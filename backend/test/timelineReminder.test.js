const test = require('node:test');
const assert = require('node:assert/strict');

const notices = [];
let query = 0;
const dateOffset = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const mockModule = (relativePath, exports) => {
  const resolved = require.resolve(relativePath);
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
};

mockModule('../src/models', {
  NotificationConfig: { findOne: async () => ({ daysBefore: 5 }) },
  Notice: {
    findOne: async ({ where }) => notices.find((notice) =>
      notice.userId === where.userId && notice.title === where.title && notice.message === where.message
    ) || null
  },
  ConsultorTimeline: {
    findAll: async () => {
      query++;
      return query % 2 === 1
        ? [{ consultorId: 7, title: 'Concluir formação Azure', expectedDate: dateOffset(-1) }]
        : [{ consultorId: 7, title: 'Concluir Scrum', expectedDate: dateOffset(3) }];
    }
  }
});
mockModule('../src/services/notification.service', {
  criarNotificacao: async (notice) => { notices.push(notice); return notice; }
});

const { verificarLembretesTimeline } = require('../src/services/timelineReminder.service');

test.beforeEach(() => {
  notices.length = 0;
  query = 0;
});

test('cria um lembrete de prazo e um aviso de atraso, sem duplicar ao repetir a verificação', async () => {
  const first = await verificarLembretesTimeline(7);
  const second = await verificarLembretesTimeline(7);

  assert.deepEqual(first, { daysBefore: 5, overdue: 1, upcoming: 1, noticesCreated: 2 });
  assert.deepEqual(second, { daysBefore: 5, overdue: 1, upcoming: 1, noticesCreated: 0 });
  assert.equal(notices.length, 2);
  assert.equal(notices[0].title, 'Objetivo com prazo ultrapassado');
  assert.equal(notices[1].title, 'Lembrete de objetivo');
});
