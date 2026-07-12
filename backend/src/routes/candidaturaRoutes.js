const express = require('express');
const router = express.Router();
const candidaturaController = require('../controllers/candidaturaController');
const upload = require('../middlewares/upload.middleware');
const { protect, authorize } = require('../middlewares/authMiddleware');


router.post('/', authorize('Consultor'), upload.array('evidencias', 10), candidaturaController.submeterCandidatura);
router.get('/minhas', candidaturaController.listarMinhasCandidaturas);
// Rascunho/candidatura editável do consultor para um badge (retomar/adicionar)
router.get('/rascunho', authorize('Consultor'), candidaturaController.getRascunho);
// Remover uma evidência (trocar/apagar) enquanto a candidatura é editável
router.delete('/evidencias/:id', authorize('Consultor'), candidaturaController.apagarEvidencia);

// ADMIN: todos os pedidos de badges, em qualquer estado do workflow (não só
// os pendentes de validação/aprovação, ao contrário dos endpoints abaixo)
router.get('/admin/todas', authorize('Admin'), candidaturaController.listarTodasCandidaturas);

// TALENT MANAGER (Admin também pode consultar/gerir, ex: página de Pedidos do admin)
router.get('/talent/pendentes', authorize('TalentManager', 'Admin'), candidaturaController.listarCandidaturasTalent);
router.put('/talent/:id/validar', authorize('TalentManager', 'Admin'), candidaturaController.validarTalentManager);

// Validação individual de uma evidência (passo obrigatório antes de aprovar a candidatura)
router.put('/evidencias/:id/validar', authorize('TalentManager', 'Admin'), candidaturaController.validarEvidencia);

// SERVICE LINE LEADER (Admin também pode consultar/gerir; TalentManager pode
// consultar em modo leitura as candidaturas que já validou, ex: tab "Validadas")
router.get('/serviceline/pendentes', authorize('ServiceLineLeader', 'Admin', 'TalentManager'), candidaturaController.listarCandidaturasServiceLine);
router.get('/serviceline/todas', authorize('ServiceLineLeader', 'Admin', 'TalentManager'), candidaturaController.listarTodasCandidaturasServiceLine);
router.put('/serviceline/:id/validar', authorize('ServiceLineLeader', 'Admin'), candidaturaController.validarServiceLine);

// Estatística para o gráfico "Pedidos Fechados" do painel de controlo
router.get('/fechadas-semana', authorize('TalentManager', 'ServiceLineLeader', 'Admin'), candidaturaController.getFechadasPorSemana);

// Estatística para o gráfico "Badges Atribuídos" do painel de controlo do SLL
router.get('/badges-semana', authorize('ServiceLineLeader', 'Admin'), candidaturaController.getBadgesAtribuidosPorSemana);

// Histórico de candidaturas de um consultor (o próprio, ou TM/SLL/Admin)
router.get('/consultor/:id', candidaturaController.listarCandidaturasPorConsultor);

router.get('/:id', candidaturaController.detalhesCandidatura);

module.exports = router;
