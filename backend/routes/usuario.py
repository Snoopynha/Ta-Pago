from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from models import db, Usuario
from utils import get_usuario_logado

usuario_bp = Blueprint('usuario', __name__)

@usuario_bp.route('/registrar', methods=['POST'])
def registrar_perfil():
    data = request.get_json()

    if Usuario.query.filter_by(email=data.get('email')).first():
        return jsonify({"msg": "Email já cadastrado"}), 400

    novo_usuario = Usuario(
        nome=data.get('nome'), 
        email=data.get('email'), 
        residencia_id=None
    )
    novo_usuario.set_senha(data.get('senha'))

    db.session.add(novo_usuario)
    db.session.commit()

    return jsonify({
        "msg": "Usuário criado com sucesso",
        "usuario": novo_usuario.to_dict()
    }), 201

@usuario_bp.route('/eu', methods=['GET'])
@jwt_required()
def get_perfil():
    usuario = get_usuario_logado()
    return jsonify(usuario.to_dict()), 200

@usuario_bp.route('/eu', methods=['PUT'])
@jwt_required()
def atualizar_perfil():
    usuario = get_usuario_logado()
    data = request.get_json()

    if 'nome' in data:
        usuario.nome = data['nome']
    if 'email' in data:
        if Usuario.query.filter(Usuario.email == data['email'], Usuario.id != usuario.id).first():
            return jsonify({"msg": "Esse email já está em uso"}), 400

        usuario.email = data['email']
    if 'senha' in data:
        usuario.set_senha(data['senha'])

    db.session.commit()
    return jsonify(usuario.to_dict()), 200

@usuario_bp.route('/logar', methods=['POST'])
def logar_perfil():
    data = request.get_json()
    usuario = Usuario.query.filter_by(email=data.get('email')).first()

    if usuario and usuario.verificar_senha(data.get('senha')):
        access_token = create_access_token(identity=str(usuario.id))
        return jsonify({
            "token": access_token,
            "usuario": usuario.to_dict()
        }), 200
    
    return jsonify({"msg": "Email ou senha inválidos"}), 401