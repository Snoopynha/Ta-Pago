from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Conta, Usuario, StatusConta, CategoriaConta, Frequencia, Historico
from datetime import datetime, date
from sqlalchemy import func

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

@contas_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    usuario = get_usuario_logado()
    residencia_id = usuario.residencia_id
    atualizar_contas_atrasadas(residencia_id)
    
    # Busca a contagem e a soma dos valores por status
    resumo_status = db.session.query(
        Conta.status,
        func.count(Conta.id).label('quantidade'),
        func.sum(Conta.valor).label('total_valor')
    ).filter(Conta.residencia_id == residencia_id).group_by(Conta.status).all()
    
    stats_contas = {s.value: {"quantidade": 0, "total": "0.00"} for s in StatusConta}
    for status, qtd, total in resumo_status:
        stats_contas[status.value] = {"quantidade": qtd, "total": str(total or 0.00)}

    # Pagamentos por categoria
    gastos_categoria = db.session.query(
        Conta.categoria,
        func.sum(Historico.valor_pago).label('total')
    ).join(Historico, Conta.id == Historico.conta_id)\
        .filter(Conta.residencia_id == residencia_id)\
        .group_by(Conta.categoria).all()
    
    stats_categorias = [
        {"categoria": cat.value, "total": str(total)} 
        for cat, total in gastos_categoria
    ]
    
    # Gastos no mês
    hoje = datetime.utcnow()
    total_mes_atual = db.session.query(func.sum(Historico.valor_pago))\
        .join(Conta)\
        .filter(
            Conta.residencia_id == residencia_id,
            func.extract('month', Historico.data_pagamento) == hoje.month,
            func.extract('year', Historico.data_pagamento) == hoje.year
        ).scalar()
    
    return jsonify({"resumo_status": stats_contas, "gastos_por_categoria": stats_categorias, "total_pago_mes_atual": str(total_mes_atual or 0.00), "nome_residencia": usuario.residencia.nome}), 200