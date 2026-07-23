import json
from pathlib import Path

from flask import Flask, jsonify

app = Flask(__name__)

DATA_DIR = Path(__file__).resolve().parent / "data"
LEVELS_JSON_PATH = DATA_DIR / "levels.json"


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
    return response


@app.route("/")
def healthcheck():
    return jsonify({"status": "ok", "service": "pedentox-api"})


@app.route("/api/levels")
def get_levels():
    with LEVELS_JSON_PATH.open("r", encoding="utf-8") as levels_file:
        levels = json.load(levels_file)
    return jsonify(levels)