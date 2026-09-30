# Ta-Pago

![React native](https://img.shields.io/badge/react-native?style=for-the-badge&logo=react&logoColor=white&color=%2320B2AA)
![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=white&color=%2320B2AA)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white&color=%2320B2AA)
![Expo](https://img.shields.io/badge/expo-000020?style=for-the-badge&logo=expo&color=%2320B2AA)
![Flask](https://img.shields.io/badge/flask-000000?style=for-the-badge&logo=flask&logoColor=white&color=%2320B2AA)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white&color=%2320B2AA)


É um aplicativo completo de gestão financeira doméstica, projetado para ajudar famílias e colegas de casa a controlar contas e pagamentos compartilhados. Ele permite que os usuários criem uma nova família ou participem de uma já existente usando um código de convite. Uma vez integrados à família, os usuários podem adicionar, visualizar e gerenciar contas compartilhadas, marcá-las como pagas e consultar o histórico de todos os pagamentos realizados na residência.

## Funcionalidades

- **Autenticação do usuário**: Cadastro seguro do usuário e login baseado em JWT.
- **Gerenciamento de famílias**: Os usuários podem criar uma nova família ou ingressar em uma já existente por meio de um código de convite exclusivo.
- **Acompanhamento de contas**: Adicione, visualize, edite e exclua contas da família com detalhes como nome, valor, data de vencimento, categoria e frequência.
- **Gerenciamento de pagamentos**: Marque as contas como pagas, o que as transfere para o histórico de pagamentos.
- **Filtro por status**: As contas são automaticamente categorizadas como `Pendente`, `Pago` ou `Atrasado`.
- **Dashboard**: Um painel central fornece um resumo das despesas do mês atual e uma divisão das contas por status.
- **Histórico de pagamentos**: Um registro completo de todas as contas pagas, incluindo quem pagou e quando.
- **Página de perfil**: Exibe informações do usuário e o código de convite exclusivo da família para compartilhamento.

## Tecnologias

- **Frontend**: React Native, Expo, TypeScript, React Navigation, Axios
- **Backend**: Python, Flask, Flask-SQLAlchemy, Flask-JWT-Extended, SQLite

## Estrutura do repositório

```
.
├── backend/
│   ├── app.py          # Ponto de entrada do Flask e seed do DB
│   ├── models.py       # Modelos do DB em SQLAlchemy
│   └── routes/         # Endpoints da API
└── frontend/
    ├── app/            # Rotas de telas do Expo router
    ├── src/
    │   ├── api/api.ts  # Configuração do cliente Axios
    │   └── contexts/   # AuthContext
    └── package.json    # Dependências frontend
```

## Configuração do ambiente

### Pré-requisitos

- Python 3.8+ e `pip`
- Node.js e `npm`
- [Expo Go app](https://expo.dev/go) para testar pelo celular

### Backend Setup

1. **Clonar o repositório**
    ```bash
    git clone https://github.com/snoopynha/Ta-Pago.git
    cd Ta-Pago/backend
    ```

2. **Cria e ativa o virtual environment**
    ```bash
    # Para macOS/Linux
    python3 -m venv venv
    source venv/bin/activate

    # Para Windows
    python -m venv venv
    .\venv\Scripts\activate
    ```

3. **Instalar dependências**
    ```bash
    pip install -r requirements.txt
    ```

4. **Configurar variáveis de ambiente**
    Criar um arquivo `.env` na pasta `backend` e adicionar uma chave secreta para o JWT:
    ```env
    JWT_SECRET_KEY='sua-chave-secreta'
    ```

5. **Rodar o backend:**
    ```bash
    flask run
    ```
   O servidor será iniciado em `http://localhost:5000`. Na primeira execução, ele criará um banco de dados SQLite (`financeiro.db`) e o preencherá com dados de exemplo.

### Frontend Setup

1. **Navegar até a pasta frontend**
    ```bash
    cd ..
    cd frontend
    ```

2. **Instalar dependências:**
    ```bash
    npm install
    ```
    
3. **Configurar variáveis de ambiente**
    Para que o aplicativo móvel se comunique com o seu servidor de backend local, é necessário informar o endereço IP da rede local do seu computador.

    Criar o `.env` na pasta `frontend`
    ```bash
    touch .env
    ```
    Descubra o endereço IP local do seu computador (ex, `192.168.1.10`) e adicione ao arquivo `.env`
    ```env
    IP_DA_REDE='SEU_ENDERECO_IP'
    ```

4. **Rodar o frontend**
    ```bash
    npx expo start
    ```

5. Um código QR aparecerá no seu terminal. O escaneie usando o aplicativo **Expo Go** no seu celular para iniciar o aplicativo. Certifique-se de que seu celular esteja conectado à mesma rede Wi-Fi que o seu computador.