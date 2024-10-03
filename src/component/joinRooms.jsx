import React, { useEffect } from "react";
import io from 'socket.io-client';

const JoinRoome = ()=>{
    const SOCKET_SERVER_URL = "http://localhost:3001";
    const gameId = 'gameid'
    const handleJoinRoom = () => {
        const socket = io(SOCKET_SERVER_URL);
        socket.emit('joinRoom', gameId);
    };

    useEffect(() => {
        const socket = io(SOCKET_SERVER_URL);

        socket.on('connect', () => {
            console.log('Connected to the server');
        });

        socket.on('startGame', (message) => {
            console.log(message); // Handle game start
        });

        socket.on('botJoined', (message) => {
            console.log(message); // Handle bot joining
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from the server');
        });

        return () => {
            socket.disconnect();
        };
    }, []);
    return(
        <button onClick={handleJoinRoom}>Join Room</button>
    )
};
export default JoinRoome