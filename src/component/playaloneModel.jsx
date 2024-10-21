import React from 'react';
import './index.css'; // Import CSS for styling

const PlayerAloneModel = ({ roomId, userName, setplayaloneShow, trumpRound, TrumpSelected, setTrumpSelected, socket, remaningCards, selectedSymboles }) => {
    const userIds = [
        'U2nQCVwr1mFcD4RmIpGJnzSbObfx',
        'U2nQCOIp4azwAxDCyCXsChugatAs',
        'U2nQB0aoFr5si3HhQvECZYGRTPjg',
        'U2nQARBMcaXllwLmiIGIPR2DbEN0'
    ]
    const isSelected = () => {
        console.log('cleked')
        const userId = userIds[userName];
        socket.emit('playAlone', { roomId, userId });
        console.log('complete')
        socket.on('lastAction', async (e) => {
            console.log('dddddddddddddddddddddddddddddddddddddddddddd', e)
        })
        setplayaloneShow(false)

    }
    const isPassed = () => {
        const userId = userIds[userName];
        console.log('cleked')
        socket.emit('playWithPartner', { roomId, userId });

        socket.on('lastAction', async (e) => {
            console.log('dddddddddddddddddddddddddddddddddddddddddddd', e)
        })
        console.log('complete');
        setplayaloneShow(false)
    }

    return (
        <div className="card-container" >
            <button onClick={isPassed} className="pass-button">with partner</button>
            <button disabled={trumpRound == 1} onClick={isSelected} className="pass-button">Play Alone</button>
        </div>
    );
};

export default PlayerAloneModel;
