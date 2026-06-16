import React from 'react';
import './ConfirmAnswerModal.css';

interface ConfirmAnswerModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmAnswerModal: React.FC<ConfirmAnswerModalProps> = ({ onConfirm, onCancel }) => {
  return (
    <div className="confirm-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="confirm-answer-title">
      <div className="confirm-modal-box">
        <p id="confirm-answer-title" className="confirm-modal-title">
          È la tua ultima risposta? L&apos;accendiamo?
        </p>
        <div className="confirm-modal-actions">
          <button
            type="button"
            onClick={onConfirm}
            className="confirm-modal-btn confirm-modal-btn--confirm"
          >
            Confermo
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="confirm-modal-btn confirm-modal-btn--cancel"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmAnswerModal;
