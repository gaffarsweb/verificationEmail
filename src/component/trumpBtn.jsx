import React from 'react';
import './index.css'; // Import CSS for styling

const TrumpBtn = ({ roomId ,trumpRound, TrumpSelected,setTrumpSelected, socket, remaningCards, selectedSymboles}) => {

    const isPassed = () =>{
        console.log('cleked')
        socket.emit('passTrumpBox', { roomId });
        console.log('complete')

    }
    const isSelected = () =>{
        console.log('cleked')
        const selectedCard = remaningCards[0];
        socket.emit('TrumpSelected', { roomId, selectedCard });
        console.log('complete')

    }
    const cardsLogos = [
      {
        name:'h',
        value:'♥'
      },
      {
        name:'d',
        value:'♦'
      },
      {
        name:'s',
        value:'♣'
      },
      {
        name:'c',
        value:'♠'
      },
    ]
  return (
    <div className="card-container" >
      <div className="cardssss">
        {remaningCards[0]}
      </div>
      <div className="suits">
        {
          cardsLogos && cardsLogos.map((item, index)=>(
            <button disabled={trumpRound == 0} className="suit" onClick={()=>selectedSymboles(item?.name)}>{item?.value}</button>
          ))
        }
      </div>
      <button onClick={isPassed} className="pass-button">PASS</button>
      <button disabled={trumpRound == 1} onClick={isSelected} className="pass-button">SELECT</button>
    </div>
  );
};

export default TrumpBtn;
