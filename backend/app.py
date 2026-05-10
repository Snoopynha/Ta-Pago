from flask import Flask, jsonify

app = Flask(__name__)

@app.route("/")
def home():
    return jsonify({
        "Eu": "You know what he said to me?"
    })

@app.route("/what")
def what():
    return jsonify({
        "Eu": [
            "He was like,",
            "'You are so rude'",
            "",
            "And I was like,",
            "'Boy, does it look like I could care?'",
            "I couldn't even care less!"
        ]
    })

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)