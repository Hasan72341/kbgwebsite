import React from 'react';
import './Loading.css';

export const LoadingSpinner = ({ variant = 'dna' }) => {
  return (
    <div className="loading-container">
      {variant === 'dna' ? (
        <div className="dna-loader">
          <div className="dna-connector"></div>
          <div className="dna-strand"></div>
          <div className="dna-strand"></div>
        </div>
      ) : (
        <div className="ring-loader"></div>
      )}
      
      <p className="loading-text">Loading</p>
      
      <div className="loading-dots">
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
        <div className="loading-dot"></div>
      </div>
    </div>
  );
};

export const ErrorState = ({ message, onRetry }) => {
  return (
    <div className="error-container">
      <div className="error-icon">
        <div className="error-icon-circle"></div>
      </div>
      
      <p className="error-text">Oops! Something went wrong</p>
      <p className="error-description">
        {message || 'Failed to load data. Please check your connection and try again.'}
      </p>
      
      {onRetry && (
        <button className="error-retry-button" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
};

export default LoadingSpinner;
