from flask import Flask, jsonify
from .routes import api_bp

def create_app():
    app = Flask(__name__)

    @app.after_request
    def add_cors_headers(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        return response

    @app.route("/")
    def healthcheck():
        return jsonify({"status": "ok", "service": "pedentox-api"})

    app.register_blueprint(api_bp, url_prefix='/api')

    return app
