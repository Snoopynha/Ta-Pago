import enum
import string
import random
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class Frequencia(enum.Enum):
    UNICA = "unica"
    MENSAL = "mensal"
    SEMANAL = "semanal"
    ANUAL = "anual"

class CategoriaConta(enum.Enum):
    AGUA = "agua"
    LUZ = "luz"
    INTERNET = "internet"
    ALUGUEL = "aluguel"
    GAS = "gas"
    CONDOMINIO = "condominio"
    STREAMING = "streaming"
    TELEFONE = "telefone"
    OUTROS = "outros"

class StatusConta(enum.Enum):
    PENDENTE = "pendente"
    PAGO = "pago"
    ATRASADO = "atrasado"

def gerar_codigo_convite():
    caracteres = string.ascii_uppercase + string.digits
    return ''.join(random.choice(caracteres) for _ in range(6))

class Residencia(db.Model):
    __tablename__ = 'residencia'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    codigo_convite = db.Column(db.String(8), unique=True, nullable=False, default=gerar_codigo_convite)
    usuarios = db.relationship('Usuario', backref='residencia', lazy=True, cascade='all, delete-orphan')
    contas = db.relationship('Conta', backref='residencia', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'codigo_convite': self.codigo_convite,
            'usuarios': [u.to_dict() for u in self.usuarios],
            'contas': [c.to_dict() for c in self.contas]
        }

class Usuario(db.Model):
    __tablename__ = 'usuario'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha = db.Column(db.String(255), nullable=False)
    residencia_id = db.Column(db.Integer, db.ForeignKey('residencia.id'), nullable=False)
    historicos_pagamentos = db.relationship('Historico', backref='usuario', lazy=True)
    criado_em = db.Column(db.DateTime, default=datetime.utcnow)

    def set_senha(self, senha):
        self.senha = generate_password_hash(senha)

    def verificar_senha(self, senha):
        return check_password_hash(self.senha, senha)
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'residencia_id': self.residencia_id,
            'criado_em': self.criado_em.isoformat(),
            'codigo_convite': self.residencia.codigo_convite if self.residencia else None
        }

class Conta(db.Model):
    __tablename__ = 'conta'

    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    frequencia = db.Column(db.Enum(Frequencia), nullable=False, default=Frequencia.UNICA)
    categoria = db.Column(db.Enum(CategoriaConta), nullable=False)
    status = db.Column(db.Enum(StatusConta), nullable=False, default=StatusConta.PENDENTE, index=True)
    valor = db.Column(db.Numeric(10,2), nullable=False)
    vencimento = db.Column(db.Date, nullable=False, index=True)
    observacao = db.Column(db.String(200))
    residencia_id = db.Column(db.Integer, db.ForeignKey('residencia.id'), nullable=False)
    historicos = db.relationship('Historico', backref='conta', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'frequencia': self.frequencia.value,
            'categoria': self.categoria.value,
            'status': self.status.value,
            'valor': str(self.valor),
            'vencimento': self.vencimento.isoformat(),
            'observacao': self.observacao,
            'residencia_id': self.residencia_id,
            'historicos': [h.to_dict() for h in self.historicos]
        }

class Historico(db.Model):
    __tablename__ = 'historico'

    id = db.Column(db.Integer, primary_key=True)
    conta_id = db.Column(db.Integer, db.ForeignKey('conta.id'), nullable=False)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=False)
    data_pagamento = db.Column(db.DateTime, default=datetime.utcnow)
    valor_pago = db.Column(db.Numeric(10,2), nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'conta_id': self.conta_id,
            'nome_conta': self.conta.nome if self.conta else "Conta Removida",
            'usuario_id': self.usuario_id,
            'usuario': self.usuario.nome,
            'data_pagamento': self.data_pagamento.isoformat(),
            'valor_pago': str(self.valor_pago)
        }
    