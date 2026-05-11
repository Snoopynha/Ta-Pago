from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from models import db, Usuario, Residencia

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/registrar', methods=['POST'])
def registrar():
    data = request.get_json()

    if Usuario.query.filter_by(email=data.get('email')).first():
        return jsonify({"msg": "Email já cadastrado"}), 400

    codigo_convite = data.get('codigo_convite')
    nome_residencia = data.get('nome_residencia') 
    residencia = None

    # Entra em uma residência
    if codigo_convite:
        residencia = Residencia.query.filter_by(codigo_convite=codigo_convite.upper()).first()
        if not residencia:
            return jsonify({"msg": "Código de convite inválido ou não encontrado"}), 404
    
    # Cria uma residência
    elif nome_residencia:
        residencia = Residencia(nome=nome_residencia)
        db.session.add(residencia)
        db.session.flush()
    
    else:
        return jsonify({"msg": "Informe um código de convite ou nome da residência para entrar ou criar uma residência"})
    
    novo_usuario = Usuario(nome=data.get('nome'), email=data.get('email'), residencia_id=residencia.id)
    novo_usuario.set_senha(data.get('senha'))

    db.session.add(novo_usuario)
    db.session.commit()

    return jsonify({"msg": "Usuário criado com sucesso", "residencia_id": residencia.id, "codigo_convite": residencia.codigo_convite}), 201

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