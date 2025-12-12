import React from 'react';

export default function ScrollTest() {
  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Scrollbar Test</h2>
      <div 
        style={{
          height: '300px',
          width: '400px',
          border: '1px solid #ccc',
          overflowY: 'scroll',
          overflowX: 'hidden',
          padding: '10px'
        }}
      >
        {Array.from({ length: 50 }, (_, i) => (
          <div key={i} style={{ padding: '10px', borderBottom: '1px solid #eee' }}>
            Message {i + 1}: This is a test message to create scrollable content. 
            The scrollbar should be visible and functional.
          </div>
        ))}
      </div>
    </div>
  );
}