const { getMobileDataVersion } = require('../services/mobileSync.service');

exports.getStatus = async (req, res) => {
  try {
    const version = await getMobileDataVersion();
    const clientVersion = String(req.query.version || '').trim();

    return res.json({
      status: 'success',
      changed: clientVersion.length === 0 || clientVersion !== version,
      version,
      publicWebUrl: (process.env.FRONTEND_URL || '').replace(/\/$/, '')
    });
  } catch (error) {
    console.error('Erro ao calcular versao dos dados mobile:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Nao foi possivel verificar atualizacoes.'
    });
  }
};
