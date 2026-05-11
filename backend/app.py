from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from models import db, Residencia, Usuario
import os
from dotenv import load_dotenv
from backend.routes.usuario import auth_bp

load_dotenv()
app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///financeiro.db'
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
jwt = JWTManager(app)
app.register_blueprint(auth_bp)

def seed_db():
    if Residencia.query.first() is None:
        print("Populando o banco de dados...")

with app.app_context():
    db.create_all()
    seed_db()

if __name__ == "__main__":
    app.run(debug=True)