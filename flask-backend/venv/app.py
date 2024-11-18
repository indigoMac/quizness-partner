from openai import OpenAI
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# Set OpenAI API key
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    data = request.json
    text = data.get('text', '')
    difficulty = data.get('difficulty', 'Medium')  # Default to 'Medium'
    num_questions = data.get('numQuestions', 5)  # Default to 5 questions

    try:
        # Using the `ChatCompletion` method for the `gpt-3.5-turbo` model with an improved prompt
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": (
                    f"Create {num_questions} multiple-choice questions from the following text:\n\n{text}\n\n"
                    f"Make the questions {difficulty.lower()} in difficulty.\n"
                    "For each question, include:\n"
                    "1. The question text.\n"
                    "2. Four answer options (A, B, C, D).\n"
                    "3. Indicate the correct answer.\n"
                    "4. Provide a brief explanation for the correct answer."
                )}
            ],
            max_tokens=1500
        )
        questions_text = response.choices[0].message.content
        
        # Improved parsing logic (same as before)
        questions = []
        lines = questions_text.split("\n")
        current_question = None
        current_options = []
        correct_answer = None
        explanation = None

        for line in lines:
            line = line.strip()
            if line.startswith(tuple(str(i) + "." for i in range(1, 10))):
                if current_question and current_options and correct_answer:
                    questions.append({
                        "question": current_question,
                        "options": current_options,
                        "answer": correct_answer,
                        "explanation": explanation or ""
                    })
                current_question = line
                current_options = []
                correct_answer = None
                explanation = None
            elif line.startswith(("A)", "B)", "C)", "D)")):
                current_options.append(line)
            elif line.lower().startswith("correct answer:"):
                correct_answer = line.split(":")[1].strip()
            elif line.lower().startswith("explanation:"):
                explanation = line.split(":")[1].strip()
        if current_question and current_options and correct_answer:
            questions.append({
                "question": current_question,
                "options": current_options,
                "answer": correct_answer,
                "explanation": explanation or ""
            })

        return jsonify({"questions": questions})
    except Exception as e:
        return jsonify({"error": str(e), "questions": []})

if __name__ == '__main__':
    app.run(debug=True)
