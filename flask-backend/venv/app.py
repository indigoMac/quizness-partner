from openai import OpenAI
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pdfplumber

app = Flask(__name__)
CORS(app)

# Set OpenAI API key
api_key = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=api_key)

@app.route('/upload-pdf', methods=['POST'])
def upload_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']
    try:
        with pdfplumber.open(file) as pdf:
            text = "".join(page.extract_text() + "\n" for page in pdf.pages if page.extract_text())
        if not text:
            return jsonify({"error": "No text could be extracted from the PDF"}), 400
        return jsonify({"text": text})
    except Exception as e:
        print("Error processing PDF:", str(e))
        return jsonify({"error": f"Failed to extract text from PDF: {str(e)}"}), 500

@app.route('/generate-quiz', methods=['POST'])
def generate_quiz():
    data = request.json
    text = data.get('text', '')
    difficulty = data.get('difficulty', 'Medium')
    num_questions = data.get('numQuestions', 5)

    try:
        # Update the prompt to specify the desired format
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": (
                    f"Create {num_questions} multiple-choice questions from the following text:\n\n{text}\n\n"
                    f"Make the questions {difficulty.lower()} in difficulty.\n"
                    "The format for each question should be as follows:\n"
                    "Question: <The question text>\n"
                    "Options:\n"
                    "   A. <Option A text>\n"
                    "   B. <Option B text>\n"
                    "   C. <Option C text>\n"
                    "   D. <Option D text>\n"
                    "Correct Answer: <Correct answer letter (A, B, C, or D)>\n"
                    "Explanation: <Brief explanation of why the answer is correct>\n\n"
                    "Please follow this format exactly, with no additional text or variations."
                )}
            ],
            max_tokens=1500
        )

        questions_text = response.choices[0].message.content
        questions = []

        # Simplified parsing logic based on the new format
        lines = questions_text.split("\n")
        current_question = None
        current_options = {}
        correct_answer = None
        explanation = None

        for line in lines:
            line = line.strip()
            print(line)
            if line.startswith("Question:"):
                if current_question and current_options and correct_answer:
                    questions.append({
                        "question": current_question,
                        "options": [current_options["A"], current_options["B"], current_options["C"], current_options["D"]],
                        "answer": correct_answer,
                        "explanation": explanation or ""
                    })
                current_question = line.replace("Question:", "").strip()
                current_options = {"A": "", "B": "", "C": "", "D": ""}
                correct_answer = None
                explanation = None
            elif line.startswith("A."):
                current_options["A"] = line[2:].strip()
            elif line.startswith("B."):
                current_options["B"] = line[2:].strip()
            elif line.startswith("C."):
                current_options["C"] = line[2:].strip()
            elif line.startswith("D."):
                current_options["D"] = line[2:].strip()
            elif line.startswith("Correct Answer:"):
                correct_answer = line.replace("Correct Answer:", "").strip()
            elif line.startswith("Explanation:"):
                explanation = line.replace("Explanation:", "").strip()

        # Add the last question if present
        if current_question and current_options and correct_answer:
            questions.append({
                "question": current_question,
                "options": [current_options["A"], current_options["B"], current_options["C"], current_options["D"]],
                "answer": correct_answer,
                "explanation": explanation or ""
            })

        if not questions:
            print("Parsing Error: No questions were extracted.")
            print("Response Content:", questions_text)

        return jsonify({"questions": questions})
    except Exception as e:
        return jsonify({"error": str(e), "questions": []})


if __name__ == '__main__':
    app.run(debug=True)
