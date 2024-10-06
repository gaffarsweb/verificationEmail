import axios from "axios";
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client';
import PlayGround from "./playGround";

const JoinRoome = () => {
    const SOCKET_SERVER_URL = "http://localhost:3001";
    const [loading, setLoading] = useState(false);
    const [ifapiSuccess, setifapiSuccess] = useState(false);
    const [showPlayGround, setShowPlayGround] = useState(false);
    const [userName, setUserName] = useState('');
    const [socket, setSocket] = useState(null); // Single socket instance
    const [roomId, setroomId] = useState(null); // Single socket instance
    const [remaningCards, setremaningCards] = useState([])
    const [playedCards, setPlayedCards] = useState([])
    const [selfPlayer, setSelfPlayer] = useState({})
    const [Opponents, setOpponents] = useState([])
    const [socketValue, setSocketValue] = useState(null)

    const useQuery = () => {
        return new URLSearchParams(useLocation().search);
    };

    const query = useQuery();
    const gameId = query.get("gameId");

    const handleJoinRoom = async () => {
        if (!userName) {
            alert("Please enter a username");
            return;
        }

        try {
            const response = await axios.post(`http://localhost:3001/v1/playing-room/create-update`, { userName });
            if (response.data.code === 200 || response.data.code === 201) {
                const roomId = response.data.data.data._id;
                setLoading(true);
                setroomId(roomId)
                window.localStorage.setItem('roomId', roomId)
                socket.emit('joinedRoom', { roomId });

                socket.on('roomUpdates', (e) => {
                    console.log('response socket', e);
                    if (e?.roomData?.status === 'playing') {
                        setShowPlayGround(true);
                    }
                });
            }
        } catch (error) {
            console.error("Error joining room:", error);
        }
    };

    useEffect(() => {
        // Initialize the socket connection once
        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);
            // Emit to the server that the user has joined a room
            newSocket.emit('joinedRoom', { roomId });

            // Listen for room updates from the server
            newSocket.on('roomUpdates', (e) => {
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
                    if (e?.roomData?.playedCards) {
                         setPlayedCards(e?.roomData?.playedCards)
                      }
                    if (e.roomData.status == 'playing') {
                        console.log('playing updated')
                    }


                }
            });
        
        // Cleanup on component unmount
        return () => {
            newSocket.disconnect();
        };
    }, [ showPlayGround]);

    return (
        <div>
            {showPlayGround ? (
                <PlayGround playedCards={playedCards} setPlayedCards={setPlayedCards} setSocketValue={setSocketValue} socketValue={socketValue} setremaningCards={setremaningCards} selfPlayer={selfPlayer} Opponents={Opponents} setOpponents={setOpponents} setSelfPlayer={setSelfPlayer} remaningCards={remaningCards}  roomId = {roomId} userName={userName} socket={socket} />
            ) : (
                <div>
                    {loading ? (
                        <p style={{ color: "white", fontSize: '20px' }}>Loading....</p>
                    ) : (
                        <div>
                            <input
                                type="text"
                                placeholder="Enter Username"
                                value={userName}
                                onChange={(e) => setUserName(e.target.value)}
                            />
                            <button onClick={handleJoinRoom}>Join Room</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default JoinRoome;
