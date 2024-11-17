import React, { useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizResults, setQuizResults] = useState([]); // New state to store quiz results

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
        explanation: isCorrect
          ? ""
          : "Here's why your answer is incorrect... " + q.explanation,
      };
    });
    setQuizResults(results); // Save the results in the state
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/generate-quiz", {
        text,
      });
      console.log("API Response:", response.data); // Debugging: Check the response
      const fetchedQuestions = response.data.questions;
      if (Array.isArray(fetchedQuestions)) {
        setQuestions(fetchedQuestions);
      } else {
        setQuestions([]); // Fallback to an empty array if questions is not an array
      }
    } catch (error) {
      console.error("Error generating quiz:", error);
      setQuestions([]); // Fallback in case of an error
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
