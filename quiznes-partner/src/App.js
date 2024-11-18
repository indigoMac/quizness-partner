import React, { useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResults, setQuizResults] = useState([]);
  const [difficulty, setDifficulty] = useState("Easy"); // New state for difficulty
  const [numQuestions, setNumQuestions] = useState(5); // New state for number of questions

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/generate-quiz", {
        text,
        difficulty,
        numQuestions,
      });
      console.log("API Response:", response.data);
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
              {result.isCorrect ? "Correct" : "Incorrect"}
            </p>
            {!result.isCorrect && <p>{result.explanation}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
