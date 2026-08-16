from flask_jwt_extended import get_jwt_identity
from models import Usuario

def get_usuario_logado():
    """Identifica o usuário que esta no aplicativo"""
    user_id = get_jwt_identity()
    return Usuario.query.get(user_id)