import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client';
import './index.css'

const PlayGround = ({socketValue, setSocketValue, setremaningCards, Opponents, selfPlayer, roomId, userName, socket, setSelfPlayer, setOpponents, remaningCards}) => {
    // const SOCKET_SERVER_URL = "http://localhost:3001";
    // const socket = io(SOCKET_SERVER_URL);

  

    const useQuery = () => {
        return new URLSearchParams(useLocation().search);
    };
    const PlayedGame = ()=>{
        socket.emit('gamPlayed',{roomId});
        
        socket.on('roomUpdates', (e) => {
            console.log('eeeee',e)
            setSocketValue(e.roomData)
            if (e.roomData) {
                const selfPlay = e.roomData.players.find((p) => p.userName === userName);
                setSelfPlayer(selfPlay);

                // Filter out the self player to get the opponents
                const opponents = e.roomData.players.filter((p) => p.userName !== userName);
                setOpponents(opponents);



                console.log('e', e.roomData)
                if (e.roomData?.totalCards) {
                    setremaningCards(e.roomData.totalCards)
                }
                if (e.roomData.status == 'playing') {
                    console.log('playing updated')
                }


            }
        });
    }
    // const query = useQuery();
    // const roomId = query.get("roomId");
    // const userName = query.get("userName");

    useEffect(() => {



        

       
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
                <div style={{ color: 'white' }}>
                    {
                        selfPlayer?.isTurn ? 'Your Turn' : null
                    }
                </div>
                <div class="cards">
                    {
                        selfPlayer?.cards && selfPlayer?.cards.map((item) => (
                            <button onClick={PlayedGame} disabled={!selfPlayer.isTurn} class="card">{item}</button>
                        ))
                    }
                </div>
                <p className="playerName">Player : {selfPlayer?.userName}</p>
            </div>

            <div class="player player2">
                <div style={{ color: 'white' }}>
                    {
                        Opponents[0]?.isTurn ? 'Playing..' : null
                    }
                </div>
                <div class="cards">
                    {
                        Opponents[0]?.cards && Opponents[0].cards.map((item) => (
                            <button onClick={PlayedGame} disabled={!Opponents[0].isTurn} class="card">{item}</button>
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {Opponents[0]?.userName || 'Waiting...'}
                </p>
            </div>

            <div class="player player3">
            <div style={{ color: 'white' }}>
                    {
                        Opponents[1]?.isTurn ? 'Playing..' : null
                    }
                </div>
                <div class="cards">
                    {
                        Opponents[1]?.cards && Opponents[1].cards.map((item) => (
                            <button onClick={PlayedGame} disabled={!Opponents[1].isTurn} class="card">{item}</button>
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {Opponents[1]?.userName || 'Waiting...'}
                </p>
            </div>

            <div class="player player4">
            <div style={{ color: 'white' }}>
                    {
                        Opponents[2]?.isTurn ? 'Playing..' : null
                    }
                </div>
                <div class="cards">
                    {
                        Opponents[2]?.cards && Opponents[2].cards.map((item) => (
                            <button onClick={PlayedGame} disabled={!Opponents[2].isTurn} class="card">{item}</button>
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
