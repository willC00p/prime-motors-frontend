import React from 'react';
import InteractivePresentation from '../components/InteractivePresentation';

const PresentationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <InteractivePresentation />
      </div>
    </div>
  );
};

export default PresentationPage;
