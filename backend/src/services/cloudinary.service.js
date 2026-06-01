const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET
});

const uploadFicheiro = async (ficheiro) => {
  try {
    if (ficheiro.buffer) {
      return await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'softinsa/evidencias',
            resource_type: 'auto'
          },
          (erro, resultado) => {
            if (erro) {
              reject(new Error('Erro ao fazer upload do ficheiro: ' + erro.message));
              return;
            }

            resolve(resultado.secure_url);
          }
        );

        Readable.from(ficheiro.buffer).pipe(uploadStream);
      });
    }

    const resultado = await cloudinary.uploader.upload(ficheiro.path, {
      folder: 'softinsa/evidencias',
      resource_type: 'auto'
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