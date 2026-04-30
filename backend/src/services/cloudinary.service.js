const cloudinary = require('cloudinary').v2;
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const uploadFicheiro = async (ficheiro) => {
  try {
    const resultado = await cloudinary.uploader.upload(ficheiro.path, {
      folder: 'softinsa/evidencias',
      resource_type: 'auto' // aceita PDF e imagens
    });
    return resultado.secure_url;
  } catch (erro) {
    throw new Error('Erro ao fazer upload do ficheiro: ' + erro.message);
  }
};

const apagarFicheiro = async (url) => {
  try {
    const publicId = url.split('/').pop().split('.')[0];
    await cloudinary.uploader.destroy(publicId);
  } catch (erro) {
    throw new Error('Erro ao apagar ficheiro: ' + erro.message);
  }
};

module.exports = { uploadFicheiro, apagarFicheiro };