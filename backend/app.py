from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, Residencia, Usuario,Conta, Historico, CategoriaConta, StatusConta, Frequencia
import os
from datetime import datetime, date, timedelta
from dotenv import load_dotenv
from routes.usuario import auth_bp
from routes.conta import contas_bp
from routes.historico import historico_bp

load_dotenv()
app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///financeiro.db'
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
app.register_blueprint(auth_bp, url_prefix='/api')
app.register_blueprint(contas_bp, url_prefix='/api')
app.register_blueprint(historico_bp, url_prefix='/api')

def seed_db():
    if Residencia.query.first() is None:
        print("Populando o banco de dados com dados iniciais...")
        
        hoje = date.today()
        
        dreamhouse = Residencia(nome="DreamHouse")
        db.session.add(dreamhouse)
        db.session.flush()
        
        barbie = Usuario(nome="Barbie", email="barbie@email.com", residencia_id=dreamhouse.id)
        barbie.set_senha("senha")
        skipper = Usuario(nome="Skipper", email="skipper@email.com", residencia_id=dreamhouse.id)
        skipper.set_senha("senha")
        stacie = Usuario(nome="Stacie", email="stacie@email.com", residencia_id=dreamhouse.id)
        stacie.set_senha("senha")
        chelsea = Usuario(nome="Chelsea", email="chelsea@email.com", residencia_id=dreamhouse.id)
        chelsea.set_senha("senha")

        db.session.add_all([barbie, skipper, stacie, chelsea])
        db.session.flush()
        
        contas_dreamhouse = [
            Conta(
                nome="Energia",
                valor=920.50,
                vencimento=hoje - timedelta(days=20),
                categoria=CategoriaConta.LUZ,
                frequencia=Frequencia.MENSAL,
                status=StatusConta.PAGO,
                residencia_id=dreamhouse.id,
                observacao="Básica da casa"
            ),
            Conta(
                nome="Internet Gamer da Skipper",
                valor=320.00,
                vencimento=hoje - timedelta(days=12),
                categoria=CategoriaConta.INTERNET,
                frequencia=Frequencia.MENSAL,
                status=StatusConta.PAGO,
                residencia_id=dreamhouse.id,
                observacao="Internet exclusiva"
            ),
            Conta(
                nome="Reposição de Glitter",
                valor=480.90,
                vencimento=hoje - timedelta(days=8),
                categoria=CategoriaConta.OUTROS,
                frequencia=Frequencia.MENSAL,
                status=StatusConta.PAGO,
                residencia_id=dreamhouse.id,
                observacao="Glitter rosa premium"
            ),
            Conta(
                nome="Piscina Aquecida",
                valor=1250.00,
                vencimento=hoje - timedelta(days=3),
                categoria=CategoriaConta.AGUA,
                frequencia=Frequencia.MENSAL,
                status=StatusConta.ATRASADO,
                residencia_id=dreamhouse.id,
                observacao="Aquecimento da piscina"
            ),
            Conta(
                nome="Compras",
                valor=2100.00,
                vencimento=hoje + timedelta(days=5),
                categoria=CategoriaConta.OUTROS,
                frequencia=Frequencia.UNICA,
                status=StatusConta.PENDENTE,
                residencia_id=dreamhouse.id,
                observacao="Redocorações"
            ),
            Conta(
                nome="Luzes do Closet",
                valor=650.75,
                vencimento=hoje - timedelta(days=1),
                categoria=CategoriaConta.LUZ,
                frequencia=Frequencia.MENSAL,
                status=StatusConta.PAGO,
                residencia_id=dreamhouse.id,
                observacao="Especificamente a luz rosa"
            )
        ]
        
        db.session.add_all(contas_dreamhouse)
        db.session.flush()
        
        historicos_dreamhouse = [
            Historico(
                conta_id=contas_dreamhouse[0].id,
                usuario_id=barbie.id,
                valor_pago=920.50,
                data_pagamento=datetime.utcnow() - timedelta(days=19)
            ),
            Historico(
                conta_id=contas_dreamhouse[1].id,
                usuario_id=skipper.id,
                valor_pago=320.00,
                data_pagamento=datetime.utcnow() - timedelta(days=11)
            ),
            Historico(
                conta_id=contas_dreamhouse[2].id,
                usuario_id=barbie.id,
                valor_pago=480.90,
                data_pagamento=datetime.utcnow() - timedelta(days=7)
            ),
            Historico(
                conta_id=contas_dreamhouse[5].id,
                usuario_id=stacie.id,
                valor_pago=650.75,
                data_pagamento=datetime.utcnow() - timedelta(hours=18)
            )
        ]
        
        db.session.add_all(historicos_dreamhouse)
        
        watterson = Residencia(nome="A Incrível Casa dos Wattersons")
        db.session.add(watterson)
        db.session.flush()
        
        nicole = Usuario(nome="Nicole Watterson", email="nicole@email.com", residencia_id=watterson.id)
        nicole.set_senha("senha")
        richard = Usuario(nome="Richard Watterson", email="richard@email.com", residencia_id=watterson.id)
        richard.set_senha("senha")
        gumball = Usuario(nome="Gumball Watterson", email="gumball@email.com", residencia_id=watterson.id)
        gumball.set_senha("senha")
        darwin = Usuario(nome="Darwin Watterson", email="darwin@email.com", residencia_id=watterson.id)
        darwin.set_senha("senha")
        anais = Usuario(nome="Anais Watterson", email="anais@email.com", residencia_id=watterson.id)
        anais.set_senha("senha")
        
        db.session.add_all([nicole, richard, gumball, darwin, anais])
        db.session.flush()
        
        contas_watterson = [
            Conta(
                nome="Conta de Água",
                valor=980.00,
                vencimento=hoje - timedelta(days=25),
                categoria=CategoriaConta.AGUA,
                frequencia=Frequencia.MENSAL,
                status=StatusConta.PAGO,
                residencia_id=watterson.id,
                observacao="Casa inundada pelo Darwin"
            ),
            Conta(
                nome="Conserto da TV",
                valor=540.00,
                vencimento=hoje - timedelta(days=14),
                categoria=CategoriaConta.OUTROS,
                frequencia=Frequencia.UNICA,
                status=StatusConta.PAGO,
                residencia_id=watterson.id,
                observacao="Richard caiu na televisão"
            ),
            Conta(
                nome="Conta de Luz",
                valor=720.45,
                vencimento=hoje - timedelta(days=6),
                categoria=CategoriaConta.LUZ,
                frequencia=Frequencia.MENSAL,
                status=StatusConta.ATRASADO,
                residencia_id=watterson.id,
                observacao="Videogame ligado o dia inteiro"
            ),
            Conta(
                nome="Internet",
                valor=199.90,
                vencimento=hoje - timedelta(days=2),
                categoria=CategoriaConta.INTERNET,
                frequencia=Frequencia.MENSAL,
                status=StatusConta.PAGO,
                residencia_id=watterson.id,
                observacao="Nicole trabalha remotamente"
            ),
            Conta(
                nome="Pizza Gigante",
                valor=310.00,
                vencimento=hoje + timedelta(days=4),
                categoria=CategoriaConta.OUTROS,
                frequencia=Frequencia.UNICA,
                status=StatusConta.PENDENTE,
                residencia_id=watterson.id,
                observacao="Pedido feito pelo Richard"
            ),
            Conta(
                nome="Conta de Gás",
                valor=150.00,
                vencimento=hoje - timedelta(days=18),
                categoria=CategoriaConta.GAS,
                frequencia=Frequencia.MENSAL,
                status=StatusConta.PAGO,
                residencia_id=watterson.id,
                observacao="Geralmente explodido"
            )
        ]
        
        db.session.add_all(contas_watterson)
        db.session.flush()
        
        historicos_watterson = [
            Historico(
                conta_id=contas_watterson[0].id,
                usuario_id=nicole.id,
                valor_pago=980.00,
                data_pagamento=datetime.utcnow() - timedelta(days=24)
            ),
            Historico(
                conta_id=contas_watterson[1].id,
                usuario_id=nicole.id,
                valor_pago=540.00,
                data_pagamento=datetime.utcnow() - timedelta(days=13)
            ),
            Historico(
                conta_id=contas_watterson[3].id,
                usuario_id=gumball.id,
                valor_pago=199.90,
                data_pagamento=datetime.utcnow() - timedelta(days=1)
            ),
            Historico(
                conta_id=contas_watterson[5].id,
                usuario_id=nicole.id,
                valor_pago=150.00,
                data_pagamento=datetime.utcnow() - timedelta(days=17)
            )
        ]
        
        db.session.add_all(historicos_watterson)
        db.session.commit()
        print("Banco populado")

with app.app_context():
    db.create_all()
    seed_db()

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)