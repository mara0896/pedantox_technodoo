import json
from pathlib import Path
from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__)

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
LEVELS_JSON_PATH = DATA_DIR / "levels.json"

@api_bp.route("/levels")
def get_levels():
    with LEVELS_JSON_PATH.open("r", encoding="utf-8") as levels_file:
        levels = json.load(levels_file)
    return jsonify(levels)

@api_bp.route("/levels/<int:level_id>")
def get_level(level_id):
    with LEVELS_JSON_PATH.open("r", encoding="utf-8") as levels_file:
        levels = json.load(levels_file)
    level = next((l for l in levels if l["id"] == level_id), None)
    if level:
        return jsonify(level)
    return jsonify({"error": "Level not found"}), 404
