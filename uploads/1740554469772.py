from flask import Flask, send_from_directory, request, jsonify
import openai
import random

app = Flask(__name__)

# Configure OpenAI
openai.api_key = 'your-api-key-here'  # Replace with your actual API key

# Define AI agents with their personalities
AI_AGENTS = {
    "Tech Expert": "You are a tech-savvy AI assistant who loves explaining complex technical concepts in simple terms. You're enthusiastic about new technologies and often reference current tech trends.",
    
    "Creative Writer": "You are a creative and artistic AI who loves storytelling and poetry. You often speak with colorful metaphors and have a flair for dramatic expression.",
    
    "Life Coach": "You are a supportive and motivational AI life coach. You focus on personal growth and often offer encouraging advice while maintaining a positive outlook."
}

def get_ai_response(message, personality):
    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": personality},
                {"role": "user", "content": message}
            ]
        )
        return response.choices[0].message.content
    except Exception as e:
        return str(e)

@app.route('/')
def serve_frontend():
    return send_from_directory('frontend', 'index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    message = data.get('message', '')
    agent_name = data.get('agent', random.choice(list(AI_AGENTS.keys())))
    personality = AI_AGENTS.get(agent_name, "Default personality")
    
    # Get response from OpenAI
    ai_response = get_ai_response(message, personality)
    
    return jsonify({
        "response": ai_response,
        "agent": agent_name
    })

@app.route('/add_personality', methods=['POST'])
def add_personality():
    data = request.json
    name = data.get('name')
    personality = data.get('personality')
    if name and personality:
        AI_AGENTS[name] = personality
        return jsonify({"success": True, "message": "Personality added successfully."})
    return jsonify({"success": False, "message": "Invalid data."})

if __name__ == '__main__':
    app.run(debug=True)
