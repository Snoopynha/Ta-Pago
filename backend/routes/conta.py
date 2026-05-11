from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Conta, Usuario, StatusConta, CategoriaConta, Frequencia, Historico
from datetime import datetime, date

contas_bp = Blueprint('contas', __name__)

def get_usuario_logado():
    user_id = get_jwt_identity()
    return Usuario.query.get(user_id)

def atualizar_contas_atrasadas(residencia_id):
    hoje = date.today()
    
    Conta.query.filter(
        Conta.residencia_id == residencia_id,
        Conta.status == StatusConta.PENDENTE,
        Conta.vencimento < hoje
    ).update(
        {Conta.status: StatusConta.ATRASADO},
        synchronize_session=False
    )

    db.session.commit()

@contas_bp.route('/contas', methods=['POST'])
@jwt_required()
def criar_conta():
    usuario = get_usuario_logado()
    data = request.get_json()

    try:
        nova_conta = Conta(
            nome=data.get('nome'),
            valor=data.get('valor'),
            vencimento=datetime.strptime(data.get('vencimento'), '%Y-%m-%d').date(),
            categoria=CategoriaConta(data.get('categoria')),
            frequencia=Frequencia(data.get('frequencia', 'mensal')),
            status=StatusConta.PENDENTE,
            observacao=data.get('observacao'),
            residencia_id=usuario.residencia_id
        )

        db.session.add(nova_conta)
        db.session.commit()
        
        return jsonify(nova_conta.to_dict()), 201
    
    except Exception as e:
        return jsonify({"erro": str(e)}), 400
    
@contas_bp.route('/contas/<int:id>/pagar', methods=['POST'])
@jwt_required()
def pagar_conta(id):
    usuario_id = get_jwt_identity()
    usuario = Usuario.query.get(usuario_id)
    conta = Conta.query.filter_by(id=id, residencia_id=usuario.residencia_id).first()
    
    if not conta:
        return jsonify({"msg": "Conta não encontrada ou acesso negado"}), 404
    
    if conta.status == StatusConta.PAGO:
        return jsonify({"msg": "Esta conta já foi marcada como paga"}), 400

    data = request.get_json()
    valor_pago = data.get('valor_pago', conta.valor)
    conta.status = StatusConta.PAGO
    
    novo_historico = Historico(
        conta_id=conta.id,
        usuario_id=usuario.id,
        valor_pago=valor_pago,
        data_pagamento=datetime.utcnow()
    )
    
    db.session.add(novo_historico)
    db.session.commit()
    
    return jsonify({"msg": "Pagamento registrado com sucesso", "historico": novo_historico.to_dict()}), 201

@contas_bp.route('/contas', methods=['GET'])
@jwt_required()
def listar_contas():
    usuario = get_usuario_logado()
    atualizar_contas_atrasadas(usuario.residencia_id)
    query = Conta.query.filter_by(residencia_id=usuario.residencia_id)

    # Captura os filtros enviados na URL
    status_filter = request.args.get('status')
    categoria_filter = request.args.get('categoria')
    frequencia_filter = request.args.get('frequencia')

    # Aplica os filtros que foram enviados na requisição
    if status_filter:
        try:
            query = query.filter_by(status=StatusConta(status_filter))
        except ValueError:
            return jsonify({"erro": f"Status '{status_filter}' inválido"}), 400
                
    if categoria_filter:
        try:
            query = query.filter_by(categoria=CategoriaConta(categoria_filter))
        except ValueError:
            return jsonify({"erro": f"Categoria '{categoria_filter}' inválida"}), 400
            
    if frequencia_filter:
        try:
            query = query.filter_by(frequencia=Frequencia(frequencia_filter))
        except ValueError:
            return jsonify({"erro": f"Frequência '{frequencia_filter}' inválida"}), 400
        
    contas = query.all()    
    return jsonify([conta.to_dict() for conta in contas]), 200


@contas_bp.route('/contas/<int:id>', methods=['PUT'])
@jwt_required()
def editar_conta(id):
    usuario = get_usuario_logado()
    conta = Conta.query.filter_by(id=id, residencia_id=usuario.residencia_id).first()

    if not conta:
        return jsonify({"msg": "Conta não encontrada ou acesso negado"}), 404

    data = request.get_json()
    if 'nome' in data: conta.nome = data['nome']
    if 'valor' in data: conta.valor = data['valor']
    if 'status' in data: conta.status = StatusConta(data['status'])
    if 'categoria' in data: conta.categoria = CategoriaConta(data['categoria'])
    
    db.session.commit()
    return jsonify(conta.to_dict()), 200

@contas_bp.route('/contas/<int:id>', methods=['DELETE'])
@jwt_required()
def deletar_conta(id):
    usuario = get_usuario_logado()
    conta = Conta.query.filter_by(id=id, residencia_id=usuario.residencia_id).first()

    if not conta:
        return jsonify({"msg": "Conta não encontrada"}), 404

    db.session.delete(conta)
    db.session.commit()

    return jsonify({"msg": "Conta excluída com sucesso"}), 200
