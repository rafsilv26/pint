const assert = require('node:assert/strict');
const { test } = require('node:test');

const { TEMPLATE_DEFS, render, layoutEmail } = require('../src/services/emailTemplate.service');

test('render substitui as variáveis e limpa as desconhecidas', () => {
  assert.equal(
    render('Olá {{nome}}, o badge {{badge}} foi {{estado}}.', { nome: 'Maria', badge: 'Azure' }),
    'Olá Maria, o badge Azure foi .'
  );
});

test('todos os templates têm os campos obrigatórios e exemplos para as variáveis', () => {
  for (const [code, def] of Object.entries(TEMPLATE_DEFS)) {
    assert.ok(def.nome, `${code}: falta nome`);
    assert.ok(def.assunto, `${code}: falta assunto`);
    assert.ok(def.corpo, `${code}: falta corpo`);
    for (const variavel of Object.keys(def.variaveis || {})) {
      assert.ok(variavel in def.exemplo, `${code}: falta exemplo para {{${variavel}}}`);
    }
    // Nenhuma variável usada no corpo/assunto pode ficar fora do registo.
    const usadas = [...`${def.assunto} ${def.corpo}`.matchAll(/\{\{(\w+)\}\}/g)].map((m) => m[1]);
    for (const usada of usadas) {
      assert.ok(usada in def.variaveis, `${code}: variável {{${usada}}} não documentada`);
    }
  }
});

test('layoutEmail embrulha o corpo no cabeçalho Softinsa', () => {
  const html = layoutEmail('<p>conteúdo</p>');
  assert.match(html, /SOFTINSA/);
  assert.match(html, /<p>conteúdo<\/p>/);
});
