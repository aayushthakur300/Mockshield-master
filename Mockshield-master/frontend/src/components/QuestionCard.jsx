import React from 'react';

const QuestionCard = ({ question, index, total }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-600 mb-6">
      <h3 className="text-gray-500 font-bold text-sm mb-2">QUESTION {index + 1} OF {total}</h3>
      <p className="text-xl text-gray-800">{question}</p>
    </div>
  );
};

export default QuestionCard;