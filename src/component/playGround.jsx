import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client';
import './index.css'

const PlayGround = ({roomId, userName, socket}) => {
    // const SOCKET_SERVER_URL = "http://localhost:3001";
    // const socket = io(SOCKET_SERVER_URL);

    const [socketValue, setSocketValue] = useState(null)
    const [selfPlayer, setSelfPlayer] = useState({})
    const [Opponents, setOpponents] = useState([])
    const [remaningCards, setremaningCards] = useState([])

    const useQuery = () => {
        return new URLSearchParams(useLocation().search);
    };

    // const query = useQuery();
    // const roomId = query.get("roomId");
    // const userName = query.get("userName");

    useEffect(() => {



        if (roomId) {
            // Emit to the server that the user has joined a room
            socket.emit('joinedRoom', { roomId });

            // Listen for room updates from the server
            socket.on('roomUpdates', (e) => {
                setSocketValue(e.roomData)
                if (e.roomData) {
                    const selfPlay = e.roomData.players.find((p) => p.userName === userName);
                    setSelfPlayer(selfPlay);

                    // Filter out the self player to get the opponents
                    const opponents = e.roomData.players.filter((p) => p.userName !== userName);
                    setOpponents(opponents);

                  

                        console.log('e',e.roomData)
                        if(e.roomData?.totalCards){
                            setremaningCards(e.roomData.totalCards)
                        }
                        if(e.roomData.status == 'playing' ){
                            console.log('suffelcards')
                            const body = {userName: userName, roomData: e.roomData}
                            socket.emit('suffelCards', body);
                        }
                       
                  
                }
            });
        }

        return () => {
            socket.off('roomUpdates');
        };
    }, [roomId]);

    return (
        <div class="">
            <div class="table">
                <p>Table</p>
            </div>
            <div class="remaningCards">
                <p>{remaningCards[0]}</p>
            </div>

            <div class="player player1">
                <div class="cards">
                    {
                        selfPlayer?.cards && selfPlayer?.cards.map((item)=>(
                            <div class="card">{item}</div>
                        ))
                    }
                </div>
                <p className="playerName">Player : {selfPlayer?.userName}</p>
            </div>

            <div class="player player2">
                <div class="cards">
                {
                        Opponents[0]?.cards && Opponents[0].cards.map((item)=>(
                            <div class="card">{item}</div>
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {Opponents[0]?.userName || 'Waiting...'}
                </p>
            </div>

            <div class="player player3">
                <div class="cards">
                {
                        Opponents[1]?.cards && Opponents[1].cards.map((item)=>(
                            <div class="card">{item}</div>
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {Opponents[1]?.userName || 'Waiting...'}
                </p>
            </div>

            <div class="player player4">
                <div class="cards">
                {
                        Opponents[2]?.cards && Opponents[2].cards.map((item)=>(
                            <div class="card">{item}</div>
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {Opponents[2]?.userName || 'Waiting...'}
                </p>
            </div>
        </div>
    );
};
export default PlayGround;
