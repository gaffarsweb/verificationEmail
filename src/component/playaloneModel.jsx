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
        const userId = userIds[userName];
        socket.emit('playAlone', { roomId, userId });
        socket.on('lastAction', async (e) => {
        })
        setplayaloneShow(false)

    }
    const isPassed = () => {
        const userId = userIds[userName];
        socket.emit('playWithPartner', { roomId, userId });

        socket.on('lastAction', async (e) => {
        })
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
