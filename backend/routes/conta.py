from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Conta, StatusConta, CategoriaConta, Frequencia, Historico, Fatura
from utils import get_usuario_logado
from datetime import datetime, date, timedelta
from dateutil.relativedelta import relativedelta
from sqlalchemy import func

contas_bp = Blueprint('contas', __name__)

def calcular_primeiro_vencimento(conta, data_referencia=None):
    """Calcula a lógica da data de vencimento com base na frequência"""
    if data_referencia is None:
        data_referencia = date.today()

    if conta.frequencia == Frequencia.UNICA:
        return data_referencia
    elif conta.frequencia == Frequencia.MENSAL:
        if conta.dia_vencimento is None:
            raise ValueError("Conta mensal precisa ter o dia de vencimento")

        dia = conta.dia_vencimento
        ano = data_referencia.year
        mes = data_referencia.month
        try:
            vencimento = date(ano, mes, dia)
        except ValueError:
            vencimento = date(ano, mes, 1) + relativedelta(months=1, days=-1)
        if vencimento < data_referencia:
            vencimento += relativedelta(months=1)
        return vencimento
    elif conta.frequencia == Frequencia.ANUAL:
        if conta.mes_vencimento is None or conta.dia_vencimento is None:
            raise ValueError ("Conta anual precisa ter o dia e o mês de vencimento")

        ano = data_referencia.year
        mes = conta.mes_vencimento
        dia = conta.dia_vencimento
        try:
            vencimento = date(ano, mes, dia)
        except ValueError:
            vencimento = date(ano, mes, 1) + relativedelta(months=1, days=-1)
        if vencimento < data_referencia:
            vencimento = vencimento.replace(year=ano+1)
        return vencimento
    else:
        raise ValueError("Frequência não suportada")

def gerar_proxima_fatura(fatura_atual):
    """Cria a próxima fatura da conta"""
    conta = fatura_atual.conta
    if not conta or conta.frequencia == Frequencia.UNICA or not conta.ativo:
        return None

    data_base = fatura_atual.vencimento
    if conta.frequencia == Frequencia.MENSAL:
        if conta.dia_vencimento is None:
            raise ValueError("Conta mensal precisa ter o dia de vencimento")

        proximo_mes = data_base + relativedelta(months=1)
        ano = proximo_mes.year
        mes = proximo_mes.month
        dia = conta.dia_vencimento
        try:
            proximo_vencimento = date(ano, mes, dia)
        except ValueError:
            proximo_vencimento = date(ano, mes, 1) + relativedelta(months=1, days=-1)
    elif conta.frequencia == Frequencia.ANUAL:
        if conta.mes_vencimento is None or conta.dia_vencimento is None:
            raise ValueError("Conta anual precisa ter o dia e o mês de vencimento")

        proximo_ano = data_base.year + 1
        mes = conta.mes_vencimento
        dia = conta.dia_vencimento
        try:
            proximo_vencimento = date(proximo_ano, mes, dia)
        except ValueError:
            proximo_vencimento = date(proximo_ano, mes, 1) + relativedelta(months=1, days=-1)
    else:
        return None

    nova_fatura = Fatura(
        conta_id=conta.id,
        vencimento=proximo_vencimento,
        valor=conta.valor_base,
        status=StatusConta.PENDENTE,
        observacao=fatura_atual.observacao
    )
    return nova_fatura

def aplicar_filtros_faturas(query, params):
    """Aplica filtros nas requisições das faturas"""
    try:
        if params.get('vencimento_apos'):
            query = query.filter(Fatura.vencimento >= datetime.strptime(params['vencimento_apos'], '%Y-%m-%d').date())
        if params.get('vencimento_ate'):
            query = query.filter(Fatura.vencimento <= datetime.strptime(params['vencimento_ate'], '%Y-%m-%d').date())
    except ValueError:
        raise ValueError("Formato de data inválido")
    if params.get('status'):
        query = query.filter(Fatura.status == StatusConta(params['status']))
    if params.get('categoria'):
        query = query.filter(Conta.categoria == CategoriaConta(params['categoria']))
    if params.get('pago_por'):
        subquery = db.session.query(Historico.fatura_id).filter(Historico.usuario_id == params['pago_por'])
        query = query.filter(Fatura.id.in_(subquery))
    return query

def aplica_ordenacao(query, params, default_ordem='vencimento', default_direcao='desc'):
    """Aplica ordenação nas requisição da faturas"""
    coluna = params.get('ordenar_por', default_ordem)
    if coluna not in ['vencimento', 'valor', 'data_pagamento', 'status']:
        coluna = default_ordem

    direcao = params.get('ordem', default_direcao)

    if coluna == 'data_pagamento':
        subquery = db.session.query(
            Historico.fatura_id,
            func.max(Historico.data_pagamento).label('ultima_data')
        ).group_by(Historico.fatura_id).subquery()

        query = query.outerjoin(subquery, Fatura.id == subquery.c.fatura_id)
        
        if direcao == 'desc':
            query = query.order_by(subquery.c.ultima_data.desc())
        else:
            query = query.order_by(subquery.c.ultima_data.asc())
    else:
        if direcao == 'desc':
            query = query.order_by(getattr(Fatura, coluna).desc())
        else:
            query = query.order_by(getattr(Fatura, coluna).asc())
    return query

@contas_bp.route('/', methods=['POST'])
@jwt_required()
def criar_conta():
    usuario = get_usuario_logado()
    if not usuario.residencia_id:
        return jsonify({"msg": "Você não está em uma residência"}), 403
    
    data = request.get_json()
    if not data.get('nome') or not data.get('categoria') or not data.get('valor_base'):
        return jsonify({"msg": "Os campos nome, categoria e valor base são obrigatórios"}), 400

    try:
        conta = Conta(
            nome=data['nome'],
            categoria=CategoriaConta(data['categoria']),
            frequencia=Frequencia(data.get('frequencia', 'unica')),
            valor_base=data['valor_base'],
            dia_vencimento=data.get('dia_vencimento'),
            mes_vencimento=data.get('mes_vencimento'),
            observacao=data.get('observacao'),
            residencia_id=usuario.residencia_id,
            ativo=True
        )
        db.session.add(conta)
        db.session.flush() # pega o id

        if data.get('gerar_primeira', True):
            primeiro_vencimento = calcular_primeiro_vencimento(conta)
            fatura = Fatura(
                conta_id=conta.id,
                vencimento=primeiro_vencimento,
                valor=conta.valor_base,
                status=StatusConta.PENDENTE,
                observacao=data.get('observacao')
            )
            db.session.add(fatura)
            db.session.flush()

        db.session.commit()

        return jsonify({
            'conta': conta.to_dict(),
            'primeira_fatura': fatura.to_dict() if data.get('gerar_primeira', True) else None
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"erro": str(e)}), 400

@contas_bp.route('/', methods=['GET'])
@jwt_required()
def listar_contas():
    usuario = get_usuario_logado()
    if not usuario.residencia_id:
        return jsonify({"msg": "Você não está em uma residência"}), 403

    query = Conta.query.filter_by(residencia_id=usuario.residencia_id)

    #Filtros
    categoria = request.args.get('categoria')
    if categoria:
        query = query.filter(Conta.categoria == CategoriaConta(categoria))
    frequencia = request.args.get('frequencia')
    if frequencia:
        query = query.filter(Conta.frequencia == Frequencia(frequencia))
    ativo = request.args.get('ativo')
    if ativo:
        query = query.filter(Conta.ativo == (ativo.lower() == 'true'))

    #Ordenação
    ordenar_por = request.args.get('ordenar_por', 'nome')
    if ordenar_por not in ['nome', 'categoria', 'valor_base']:
        ordenar_por = 'nome'
    ordem = request.args.get('ordem', 'asc')
    if ordem == 'desc':
        query = query.order_by(getattr(Conta, ordenar_por).desc())
    else:
        query = query.order_by(getattr(Conta, ordenar_por).asc())

    contas = query.all()
    return jsonify([c.to_dict() for c in contas]), 200
    
@contas_bp.route('/faturas/<int:id>/pagar', methods=['POST'])
@jwt_required()
def pagar_fatura(id):
    usuario = get_usuario_logado()
    fatura = Fatura.query.get(id)
    if not fatura:
        return jsonify({"msg": "Fatura não encontrada"}), 404

    # Ve se a fatura é de uma conta ligada a residência do usuário
    if fatura.conta.residencia_id != usuario.residencia_id:
        return jsonify({"msg": "Acesso negado"}), 403
    
    if fatura.status == StatusConta.PAGO:
        return jsonify({"msg": "Esta fatura já foi paga"}), 400
    
    data = request.get_json()
    valor_pago = data.get('valor_pago', fatura.valor)
    if valor_pago <= 0:
        return jsonify({"msg": "O valor pago deve ser positivo"}), 400
    
    novo_historico = Historico(
        fatura_id=fatura.id,
        usuario_id=usuario.id,
        valor_pago=valor_pago,
        data_pagamento=datetime.utcnow()
    )
    db.session.add(novo_historico)
    fatura.calcula_status()
    db.session.commit()

    proxima = None
    if fatura.status == StatusConta.PAGO and fatura.conta.frequencia != Frequencia.UNICA:
        proxima = gerar_proxima_fatura(fatura)
        if proxima:
            db.session.add(proxima)
            db.session.commit()
    
    return jsonify({
        "msg": "Pagamento registrado com sucesso",
        "fatura": fatura.to_dict(),
        "proxima_fatura": proxima.to_dict() if proxima else None,
        "historico": novo_historico.to_dict()
    }), 201

@contas_bp.route('/faturas', methods=['GET'])
@jwt_required()
def listar_faturas():
    usuario = get_usuario_logado()
    if not usuario.residencia_id:
        return jsonify({"msg": "Você não está em uma residência"}), 403
    
    query = Fatura.query.join(Conta).filter(Conta.residencia_id == usuario.residencia_id)
    # Filtros
    query = aplicar_filtros_faturas(query, request.args)
    query = aplica_ordenacao(query, request.args)
    
    # Paginação
    pagina = request.args.get('pagina', 1, type=int)
    por_pagina = request.args.get('por_pagina', 20, type=int)
    paginacao = query.paginate(page=pagina, per_page=por_pagina, error_out=False)

    for fatuta in paginacao.items:
        fatuta.calcula_status()
    db.session.commit()

    return jsonify({
        "faturas": [f.to_dict() for f in paginacao.items],
        "total": paginacao.total,
        "pagina": pagina,
        "por_pagina": por_pagina
    }), 200

@contas_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def editar_conta(id):
    usuario = get_usuario_logado()
    conta = Conta.query.filter_by(id=id, residencia_id=usuario.residencia_id).first()
    if not conta:
        return jsonify({"msg": "Conta não encontrada ou acesso negado"}), 404

    data = request.get_json()
    if 'nome' in data: conta.nome = data['nome']
    if 'categoria' in data: conta.categoria = CategoriaConta(data['categoria'])
    if 'valor_base' in data: conta.valor_base = data['valor_base']
    if 'dia_vencimento' in data: conta.dia_vencimento = data['dia_vencimento']
    if 'mes_vencimento' in data: conta.mes_vencimento = data['mes_vencimento']
    if 'observacao' in data: conta.observacao = data['observacao']
    if 'ativo' in data: conta.ativo = data['ativo']
    
    db.session.commit()
    return jsonify(conta.to_dict()), 200

@contas_bp.route('/<int:id>/status', methods=['PATCH'])
@jwt_required()
def alterar_status_conta(id):
    usuario = get_usuario_logado()
    conta = Conta.query.filter_by(id=id, residencia_id=usuario.residencia_id).first()
    if not conta:
        return jsonify({"msg": "Conta não encontrada"}), 404

    conta.ativo = not conta.ativo
    db.session.commit()
    status_str = "ativa" if conta.ativo else "desativada"
    return jsonify({
        "msg": f"Conta {status_str} com sucesso",
        "conta": conta.to_dict()
    }), 200

@contas_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    usuario = get_usuario_logado()
    residencia_id = usuario.residencia_id
    if not residencia_id:
        return jsonify({"msg": "Você não está em uma residência"}), 403
    
    # Busca a contagem e a soma dos valores por status
    resumo_status = db.session.query(
        Fatura.status,
        func.count(Fatura.id).label('quantidade'),
        func.sum(Fatura.valor).label('total_valor')
    ).join(Conta).filter(Conta.residencia_id == residencia_id).group_by(Fatura.status).all()
    
    stats_contas = {s.value: {"quantidade": 0, "total": "0.00"} for s in StatusConta}
    for status, qtd, total in resumo_status:
        stats_contas[status.value] = {"quantidade": qtd, "total": str(total or 0.00)}

    # Gastos por categoria
    gastos_categoria = db.session.query(
        Conta.categoria,
        func.sum(Historico.valor_pago).label('total')
    ).join(Fatura, Historico.fatura_id == Fatura.id).join(Conta, Fatura.conta_id == Conta.id).filter(Conta.residencia_id == residencia_id).group_by(Conta.categoria).all()
    
    stats_categorias = [{"categoria": cat.value, "total": str(total)} for cat, total in gastos_categoria]
    
    # Gastos no mês
    hoje = date.today()
    total_mes_atual = db.session.query(func.sum(Historico.valor_pago))\
        .join(Fatura).join(Conta)\
            .filter(Conta.residencia_id == residencia_id, func.extract('month', Historico.data_pagamento) == hoje.month, func.extract('year', Historico.data_pagamento) == hoje.year).scalar()
     
    return jsonify({
        "resumo_status": stats_contas, 
        "gastos_por_categoria": stats_categorias, 
        "total_pago_mes_atual": str(total_mes_atual or 0.00), 
        "nome_residencia": usuario.residencia.nome if usuario.residencia else None
    }), 200

@contas_bp.route('/dashboard/mensal', methods=['GET'])
@jwt_required()
def get_dashboard_mensal():
    usuario = get_usuario_logado()
    if not usuario.residencia_id:
        return jsonify({"msg": "Você não está em uma residência"}), 403

    meses = request.args.get('meses', 12, type=int)
    data_inicio =  (date.today()) - relativedelta(months=meses)

    resultados = db.session.query(
        func.strftime('%Y', Historico.data_pagamento).label('ano'),
        func.strftime('%m', Historico.data_pagamento).label('mes'),
        func.sum(Historico.valor_pago).label('total')
    ).join(Fatura).join(Conta).filter(Conta.residencia_id == usuario.residencia_id,Historico.data_pagamento >= data_inicio).group_by('ano', 'mes').order_by('ano', 'mes').all()

    dados = [{'periodo': f"{int(r.ano)}-{int(r.mes):02d}", 'total': str(r.total or 0.00)} for r in resultados]
    return jsonify({"gastos_por_mes": dados}), 200