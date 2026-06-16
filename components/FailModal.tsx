import React from 'react';
import './FailModal.css';

interface FailModalProps {
  onOk: () => void;
}

const FailModal: React.FC<FailModalProps> = ({ onOk }) => {
  return (
    <div className="fail-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="fail-modal-title">
      <div className="fail-modal-box">
        <p id="fail-modal-title" className="fail-modal-title">
          HAI FALLITO LA SCALATA
        </p>
        <button type="button" onClick={onOk} className="fail-modal-btn">
          OK
        </button>
      </div>
    </div>
  );
};

export default FailModal;
