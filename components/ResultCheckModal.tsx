import React from 'react';
import './ResultCheckModal.css';

type ResultCheckStatus = 'checking' | 'correct';

interface ResultCheckModalProps {
  status: ResultCheckStatus;
}

const ResultCheckModal: React.FC<ResultCheckModalProps> = ({ status }) => {
  return (
    <div className="result-check-overlay" role="dialog" aria-modal="true" aria-live="polite">
      <div className="result-check-box">
        {status === 'checking' ? (
          <>
            <div className="result-check-spinner" />
            <p className="result-check-title">Verifico la risposta...</p>
          </>
        ) : (
          <p className="result-check-title result-check-title--correct">RISPOSTA ESATTA</p>
        )}
      </div>
    </div>
  );
};

export default ResultCheckModal;
