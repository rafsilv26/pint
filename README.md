# softinsa_badges_mobile

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.
# 🏅 Softinsa Badge Platform

Plataforma de gestão de badges digitais e competências para a Softinsa. Este projeto permite a submissão de evidências por consultores, validação por Talent Managers e aprovação final por Service Line Leaders.

---

## 🚀 Tecnologias Utilizadas

- **Back-end:** Node.js, Express, Sequelize (ORM)
- **Base de Dados:** PostgreSQL (Hospedado no Neon.tech)
- **Autenticação:** JWT (JSON Web Tokens) e Bcrypt para hashing de passwords
- **Frontend (Web):** React + Vite (Pasta: `/frontend`)
- **Mobile:** Flutter (Pasta: `/mobile`)

---

## 🛠️ Pré-requisitos

Antes de começares, certifica-te de que tens instalado:
- [Node.js](https://nodejs.org/) (Versão 18 ou superior recomendada)
- [NPM](https://www.npmjs.com/) ou [Yarn](https://yarnpkg.com/)

---

## 📦 Instalação e Configuração (Backend)

1. **Clonar o Repositório:**
   ```bash
   git clone "https://github.com/rafsilv26/pint.git"
   cd teu-repositorio/backend

2. **Instalar Dependências:**
   ```bash
   npm install

3. **Variáveis de Ambiente**
   - Crie um ficheiro .env na raiz da pasta `/backend` com a seguinte estrutura: <br><br>
        ```bash
        #Ligação à Base de Dados (Neon)
        DATABASE_URL=postgres://<USER>:<PASSWORD>@<HOST>/neondb?sslmode=require

        # Configurações do Servidor
        PORT=3000

        # Segurança
        JWT_SECRET=<TUA_CHAVE_MESTRA_AQUI>


## 🚦 Como Executar e Iniciar o Servidor:
- Dentro da pasta `/backend`<br><br>
    ```bash 
        node src/app.js
