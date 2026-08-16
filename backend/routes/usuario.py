from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import db, Usuario

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/registrar', methods=['POST'])
def registrar():
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

@auth_bp.route('/logar', methods=['POST'])
def logar():
    data = request.get_json()
    usuario = Usuario.query.filter_by(email=data.get('email')).first()

    if usuario and usuario.verificar_senha(data.get('senha')):
        access_token = create_access_token(identity=str(usuario.id))
        return jsonify({
            "token": access_token,
            "usuario": usuario.to_dict()
        }), 200
    
    return jsonify({"msg": "Email ou senha inválidos"}), 401