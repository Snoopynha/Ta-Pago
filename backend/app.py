from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from models import db, Residencia, Usuario,Conta, Historico, CategoriaConta, StatusConta, Frequencia
import os
from datetime import datetime, date, timedelta
from dotenv import load_dotenv
from backend.routes.usuario import auth_bp
from backend.routes.conta import contas_bp
from backend.routes.historico import historico_bp

load_dotenv()
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///financeiro.db'
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
app.register_blueprint(auth_bp)
app.register_blueprint(contas_bp, url_prefix='/api')
app.register_blueprint(historico_bp, url_prefix='/api')

def seed_db():
    if Residencia.query.first() is None:
        print("Populando o banco de dados com dados iniciais...")
        
        hoje = date.today()
        agora = datetime.utcnow()
        
        # 1. Cria a Residência
        residencia = Residencia(nome="Largo de Bangu")
        db.session.add(residencia)
        db.session.flush()
        
        # 2. Cria Usuários
        user_1 = Usuario(nome="Little Tody", email="toddynho@email.com", residencia_id=residencia.id)
        user_1.set_senha("senha")
        user_2 = Usuario(nome="Malévola", email="umlitro@email.com", residencia_id=residencia.id)
        user_2.set_senha("senha")
        
        db.session.add_all([user_1, user_2])
        db.session.flush()

        # 3. Cria Contas com status diferentes
        conta_aluguel = Conta(
            nome="Aluguel", valor=5500.00, vencimento=hoje + timedelta(days=10),
            categoria=CategoriaConta.ALUGUEL, frequencia=Frequencia.MENSAL,
            status=StatusConta.PENDENTE, residencia_id=residencia.id
        )
        conta_luz = Conta(
            nome="Luz", valor=1080.50, vencimento=hoje - timedelta(days=5),
            categoria=CategoriaConta.LUZ, frequencia=Frequencia.MENSAL,
            status=StatusConta.PAGO, residencia_id=residencia.id
        )
        conta_internet = Conta(
            nome="Internet Fibra", valor=199.90, vencimento=hoje - timedelta(days=2),
            categoria=CategoriaConta.INTERNET, frequencia=Frequencia.MENSAL,
            status=StatusConta.ATRASADO, residencia_id=residencia.id
        )

        db.session.add_all([conta_aluguel, conta_luz, conta_internet])
        db.session.flush()

        # 4. Cria o Histórico para a conta paga
        historico_luz = Historico(
            conta_id=conta_luz.id,
            usuario_id=user_2.id,
            valor_pago=1080.50,
            data_pagamento=agora - timedelta(days=3)
        )
        
        db.session.add(historico_luz)
        db.session.commit()
        print("Banco populado")

with app.app_context():
    db.create_all()
    seed_db()

if __name__ == "__main__":
    app.run(debug=True)