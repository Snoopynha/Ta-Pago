from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required
from models import Usuario, db, Residencia
from utils import get_usuario_logado

residencia_bp = Blueprint('residencia', __name__)

@residencia_bp.route('/', methods=['POST'])
@jwt_required()
def criar_residencia():
    usuario = get_usuario_logado()
    data = request.get_json()
    nome = data.get('nome')
    if not nome:
        return jsonify({"msg": "O nome da residência é obrigatório"}), 400

    if usuario.residencia_id:
        return jsonify({"msg": "Você já possui uma residência"}), 400

    nova = Residencia(nome=nome)
    db.session.add(nova)
    db.session.flush()

    usuario.residencia_id = nova.id
    db.session.commit()

    return jsonify({
        "residencia": nova.to_dict(),
        "codigo_convite": nova.codigo_convite
    }), 201


@residencia_bp.route('/entrar', methods=['POST'])
@jwt_required()
def entrar_residencia():
    usuario = get_usuario_logado()
    data = request.get_json()
    codigo = data.get('codigo_convite')
    if not codigo:
        return jsonify({"msg": "O código de convite é obrigatório"}), 400

    residencia = Residencia.query.filter_by(codigo_convite=codigo.upper()).first()
    if not residencia:
        return jsonify({"msg": "Código inválido"}), 404

    if usuario.residencia_id:
        return jsonify({"msg": "Você já está em uma residência"}), 400

    usuario.residencia_id = residencia.id
    db.session.commit()
    return jsonify({"msg": f"Bem vindo à {residencia.nome}"}), 200

@residencia_bp.route('/sair', methods=['POST'])
@jwt_required()
def sair_residencia():
    usuario = get_usuario_logado()
    if not usuario.residencia_id:
        return jsonify({"msg": "Você não está em nenhuma residência"}), 400

    usuario.residencia_id = None
    db.session.commit()
    return jsonify({"msg": "Você saiu da residência"}), 200

@residencia_bp.route('/membros', methods=['GET'])
@jwt_required()
def listar_membros():
    usuario = get_usuario_logado()
    if not usuario.residencia_id:
        return jsonify({"msg": "Você não está em nenhuma residência"}), 403

    residencia = Residencia.query.get(usuario.residencia_id)
    membros = Usuario.query.filter_by(residencia_id=residencia.id).all()
    return jsonify([u.to_dict() for u in membros]), 200