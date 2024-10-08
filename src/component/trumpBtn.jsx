import React from 'react';
import './index.css'; // Import CSS for styling

const TrumpBtn = ({ roomId , socket}) => {

    const isPassed = () =>{
        console.log('cleked')
        socket.emit('passTrumpBox', { roomId });
        console.log('complete')

    }
  return (
    <div className="card-container" >
      <div className="cardssss">
        ac
      </div>
      <div className="suits">
        <div className="suit">♣</div>
        <div className="suit">♦</div>
        <div className="suit">♥</div>
        <div className="suit">♠</div>
      </div>
      <button onClick={isPassed} className="pass-button">PASS</button>
    </div>
  );
};

export default TrumpBtn;
