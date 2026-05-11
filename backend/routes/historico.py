from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Historico, Usuario, Conta

historico_bp = Blueprint('historico', __name__)

@historico_bp.route('/historico', methods=['GET'])
@jwt_required()
def listar_historico_geral():
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)
    
    # Busca o históricos de todas contas da residência do usuário
    historicos = Historico.query.join(Conta).filter(Conta.residencia_id == usuario.residencia_id).order_by(Historico.data_pagamento.desc()).all()
    
    return jsonify([h.to_dict() for h in historicos]), 200

@historico_bp.route('/contas/<int:conta_id>/historico', methods=['GET'])
@jwt_required()
def historico_por_conta(conta_id):
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)
    conta = Conta.query.filter_by(id=conta_id, residencia_id=usuario.residencia_id).first()
    
    if not conta:
        return jsonify({"msg": "Acesso negado ou conta inexistente"}), 404
    
    return jsonify([h.to_dict() for h in conta.historicos]), 200