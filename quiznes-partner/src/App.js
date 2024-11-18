import React, { useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResults, setQuizResults] = useState([]);
  const [difficulty, setDifficulty] = useState("Medium");
  const [numQuestions, setNumQuestions] = useState(5);
  const [file, setFile] = useState(null); // New state for the uploaded file

  const handleAnswerSelect = (questionIndex, selectedOption) => {
    setUserAnswers((prevAnswers) => ({
      ...prevAnswers,
      [questionIndex]: selectedOption,
    }));
  };

  const handleSubmitQuiz = () => {
    const results = questions.map((q, index) => {
      const isCorrect = userAnswers[index] === q.answer;
      return {
        question: q.question,
        selected: userAnswers[index],
        correct: q.answer,
        isCorrect,
        explanation: isCorrect ? "" : q.explanation,
      };
    });
    setQuizResults(results);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post(
        "http://localhost:5000/upload-pdf",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setText(response.data.text); // Set extracted text from PDF
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/generate-quiz", {
        text,
        difficulty,
        numQuestions,
      });
      const fetchedQuestions = response.data.questions;
      if (Array.isArray(fetchedQuestions)) {
        setQuestions(fetchedQuestions);
      } else {
        setQuestions([]);
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      setQuestions([]);
    }
  };

  return (
    <div className="App">
      <h1>AI-Powered Quiz Generator</h1>
      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text here..."
        ></textarea>
        <div>
          <label>Difficulty: </label>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
          >
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div>
          <label>Number of Questions: </label>
          <input
            type="number"
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            min="1"
            max="20"
          />
        </div>
        <div>
          <label>Upload PDF: </label>
          <input type="file" onChange={handleFileChange} />
          <button type="button" onClick={handleFileUpload}>
            Extract Text from PDF
          </button>
        </div>
        <button type="submit">Generate Quiz</button>
      </form>
      <div>
        <h2>Generated Questions:</h2>
        {Array.isArray(questions) &&
          questions.map((q, index) => (
            <div key={index} className="question-card">
              <p>{q.question}</p>
              {q.options.map((option, idx) => (
                <label key={idx}>
                  <input
                    type="radio"
                    name={`question-${index}`}
                    value={option}
                    onChange={(e) => handleAnswerSelect(index, e.target.value)}
                  />
                  {option}
                </label>
              ))}
            </div>
          ))}
      </div>
      {questions.length > 0 && (
        <button onClick={handleSubmitQuiz}>Submit Quiz</button>
      )}
      <div>
        <h2>Quiz Results:</h2>
        {quizResults.map((result, index) => (
          <div key={index} className="result-card">
            <p>{result.question}</p>
            <p>
              Your Answer: {result.selected} -{" "}
              {result.isCorrect
                ? "Correct"
                : "Incorrect. Correct Answer: " + result.correct}
            </p>
            {!result.isCorrect && <p>{result.explanation}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
