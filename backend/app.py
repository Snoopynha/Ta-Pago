from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from models import db, Residencia, Usuario, Conta, Fatura, Historico, CategoriaConta, StatusConta, Frequencia
import os
from datetime import datetime, date, timedelta
from dotenv import load_dotenv
from routes.usuario import usuario_bp
from routes.conta import contas_bp
from routes.historico import historico_bp
from routes.residencia import residencia_bp

load_dotenv()
app = Flask(__name__)
CORS(app)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///financeiro.db'
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
app.register_blueprint(usuario_bp, url_prefix='/api')
app.register_blueprint(contas_bp, url_prefix='/api')
app.register_blueprint(historico_bp, url_prefix='/api')
app.register_blueprint(residencia_bp, url_prefix='/api')

def seed_db():
    if Residencia.query.first() is None:
        print("Populando o banco de dados com dados iniciais...")
        
        hoje = date.today()
        
        dreamhouse = Residencia(nome="DreamHouse Malibu")
        db.session.add(dreamhouse)
        db.session.flush()
        
        barbie = Usuario(nome="Barbie", email="barbie@mattel.com", residencia_id=dreamhouse.id)
        barbie.set_senha("senha")
        skipper = Usuario(nome="Skipper", email="barbie2@mattel.com", residencia_id=dreamhouse.id)
        skipper.set_senha("senha")
        stacie = Usuario(nome="Stacie", email="barbie3@mattel.com", residencia_id=dreamhouse.id)
        stacie.set_senha("senha")
        chelsea = Usuario(nome="Chelsea", email="barbie4@mattel.com", residencia_id=dreamhouse.id)
        chelsea.set_senha("senha")

        db.session.add_all([barbie, skipper, stacie, chelsea])
        db.session.flush()
        
        contas_dreamhouse = [
            Conta(
                nome="Manutenção da Piscina de Borda Infinita",
                categoria=CategoriaConta.OUTROS,
                frequencia=Frequencia.MENSAL,
                valor_base=1850.00,
                dia_vencimento=10,
                residencia_id=dreamhouse.id,
                observacao="Tratamento especial da água com reflexos rosados."
            ),
            Conta(
                nome="Energia Solar do Complexo de Mansões",
                categoria=CategoriaConta.LUZ,
                frequencia=Frequencia.MENSAL,
                valor_base=3420.90,
                dia_vencimento=15,
                residencia_id=dreamhouse.id,
                observacao="Conta alta por conta do ar-condicionado central do closet gigante."
            ),
            Conta(
                nome="Internet Satelital 10G da Torre Gamer",
                categoria=CategoriaConta.INTERNET,
                frequencia=Frequencia.MENSAL,
                valor_base=450.00,
                dia_vencimento=5,
                residencia_id=dreamhouse.id,
                observacao="Exclusiva para os streamings da Skipper sem lag."
            ),
            Conta(
                nome="Assinatura da Revista 'Chic & Glamour'",
                categoria=CategoriaConta.OUTROS,
                frequencia=Frequencia.MENSAL,
                valor_base=120.00,
                dia_vencimento=20,
                residencia_id=dreamhouse.id,
                observacao="Edição colecionável impressa em papel holográfico."
            ),
            Conta(
                nome="Abastecimento de Glitter Biodegradável",
                categoria=CategoriaConta.OUTROS,
                frequencia=Frequencia.MENSAL,
                valor_base=980.50,
                dia_vencimento=25,
                residencia_id=dreamhouse.id,
                observacao="Estoque mensal para os jardins e eventos da mansão."
            ),
            Conta(
                nome="Seguro Total do Conversível Rosa Choque",
                categoria=CategoriaConta.OUTROS,
                frequencia=Frequencia.ANUAL,
                valor_base=5600.00,
                dia_vencimento=1,
                mes_vencimento=6,
                residencia_id=dreamhouse.id,
                observacao="Proteção premium contra arranhões em qualquer lugar do mundo."
            )
        ]
        
        db.session.add_all(contas_dreamhouse)
        db.session.flush()

        faturas_dreamhouse = [
            Fatura(
                conta_id=contas_dreamhouse[0].id,
                vencimento=hoje - timedelta(days=5),
                valor=contas_dreamhouse[0].valor_base,
                status=StatusConta.ATRASADO,
                observacao="Fatura referente ao mês passado (vencida)"
            ),
            Fatura(
                conta_id=contas_dreamhouse[1].id,
                vencimento=hoje - timedelta(days=18),
                valor=contas_dreamhouse[1].valor_base,
                status=StatusConta.PAGO,
                observacao="Quitada com antecedência pela Barbie"
            ),
            Fatura(
                conta_id=contas_dreamhouse[2].id,
                vencimento=hoje - timedelta(days=10),
                valor=contas_dreamhouse[2].valor_base,
                status=StatusConta.PAGO,
                observacao="Patrocinada e paga pela Skipper"
            ),
            Fatura(
                conta_id=contas_dreamhouse[3].id,
                vencimento=hoje + timedelta(days=4),
                valor=contas_dreamhouse[3].valor_base,
                status=StatusConta.PENDENTE,
                observacao="Aguardando liberação de verba"
            ),
            Fatura(
                conta_id=contas_dreamhouse[4].id,
                vencimento=hoje - timedelta(days=2),
                valor=contas_dreamhouse[4].valor_base,
                status=StatusConta.PAGO,
                observacao="Comprei no PIX com desconto"
            ),
            Fatura(
                conta_id=contas_dreamhouse[5].id,
                vencimento=hoje + timedelta(days=15),
                valor=contas_dreamhouse[5].valor_base,
                status=StatusConta.PENDENTE,
                observacao="Renovação anual do conversível"
            )
        ]
        
        db.session.add_all(faturas_dreamhouse)
        db.session.flush()
        
        historicos_dreamhouse = [
            Historico(
                fatura_id=faturas_dreamhouse[1].id,
                usuario_id=barbie.id,
                valor_pago=3420.90,
                data_pagamento=datetime.utcnow() - timedelta(days=17)
            ),
            Historico(
                fatura_id=faturas_dreamhouse[2].id,
                usuario_id=skipper.id,
                valor_pago=450.00,
                data_pagamento=datetime.utcnow() - timedelta(days=9)
            ),
            Historico(
                fatura_id=faturas_dreamhouse[4].id,
                usuario_id=stacie.id,
                valor_pago=980.50,
                data_pagamento=datetime.utcnow() - timedelta(days=1)
            )
        ]
        
        db.session.add_all(historicos_dreamhouse)
        db.session.commit()
        print("Banco populado")

with app.app_context():
    db.create_all()
    seed_db()

if __name__ == "__main__":
    app.run(debug=True, host='0.0.0.0', port=5000)