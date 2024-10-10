import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import io from 'socket.io-client';
import './index.css'
import TrumpBtn from "./trumpBtn";

const PlayGround = ({ socketValue, TrumpSelected, setTrumpSelected, setSocketValue, setremaningCards, Opponents, selfPlayer, roomId, userName, socket, setSelfPlayer, setOpponents, remaningCards, }) => {
    // const SOCKET_SERVER_URL = "http://localhost:3001";
    // const socket = io(SOCKET_SERVER_URL);

    const [playedCards, setPlayedCards] = useState([])
    const [players, setplayers] = useState([])
    const [playedGame, setplayedGame] = useState()


    const useQuery = () => {
        return new URLSearchParams(useLocation().search);
    };

    const selectedSymboles = (item) => {

        try {
            socket.emit('TrumpCardLogoSelected', { roomId, card: item });


            socket.on('roomUpdates', async (e) => {
                console.log('eeeee', e)
                setSocketValue(e?.roomData)
                if (e?.roomData) {
                    const selfPlay = e?.roomData?.players.find((p) => p?.userName === userName);
                    setSelfPlayer(selfPlay);

                    // Filter out the self player to get the opponents
                    const opponents = e?.roomData?.players.filter((p) => p?.userName !== userName);
                    setOpponents(opponents);
                    setplayers(e?.roomData?.players)



                    console.log('eddddddddddddddddddddd', e?.roomData)
                    if (e?.roomData?.playedCards) {
                        setPlayedCards(e?.roomData?.playedCards)
                    }
                    if (e?.roomData?.totalCards) {
                        setremaningCards(e?.roomData?.totalCards)
                    }
                    if (e?.roomData?.status == 'playing') {
                        console.log('playing updated')
                    }

                    setplayedGame(false)

                }
            });
        } catch (error) {
            console.log(error)
        }

    }
    const removeExtraCard = (item) => {

        try {
            socket.emit('removeExtraCard', { roomId, card: item });


            socket.on('roomUpdates', async (e) => {
                console.log('eeeee', e)
                setSocketValue(e?.roomData)
                if (e?.roomData) {
                    const selfPlay = e?.roomData?.players.find((p) => p?.userName === userName);
                    setSelfPlayer(selfPlay);

                    // Filter out the self player to get the opponents
                    const opponents = e?.roomData?.players.filter((p) => p?.userName !== userName);
                    setOpponents(opponents);
                    setplayers(e?.roomData?.players)



                    console.log('eddddddddddddddddddddd', e?.roomData)
                    if (e?.roomData?.playedCards) {
                        setPlayedCards(e?.roomData?.playedCards)
                    }
                    if (e?.roomData?.totalCards) {
                        setremaningCards(e?.roomData?.totalCards)
                    }
                    if (e?.roomData?.status == 'playing') {
                        console.log('playing updated')
                    }

                    setplayedGame(false)

                }
            });
        } catch (error) {
            console.log(error)
        }

    }
    const PlayedGame = (item) => {
        try {
            setplayedGame(true)
            socket.emit('gamPlayed', { roomId, card: item });


            socket.on('roomUpdates', async (e) => {
                console.log('eeeee', e)
                setSocketValue(e?.roomData)
                if (e?.roomData) {
                    const selfPlay = e?.roomData?.players.find((p) => p?.userName === userName);
                    setSelfPlayer(selfPlay);

                    // Filter out the self player to get the opponents
                    const opponents = e?.roomData?.players.filter((p) => p?.userName !== userName);
                    setOpponents(opponents);
                    setplayers(e?.roomData?.players)



                    console.log('eddddddddddddddddddddd', e?.roomData)
                    if (e?.roomData?.playedCards) {
                        setPlayedCards(e?.roomData?.playedCards)
                    }
                    if (e?.roomData?.totalCards) {
                        setremaningCards(e?.roomData?.totalCards)
                    }
                    if (e?.roomData?.status == 'playing') {
                        console.log('playing updated')
                    }

                    setplayedGame(false)

                }
            });
        } catch (error) {

        } finally {
            setplayedGame(false)
        }
    }
    // const query = useQuery();
    // const roomId = query.get("roomId");
    // const userName = query.get("userName");

    useEffect(() => {






    }, [roomId]);
    socket.on('roomUpdates', async (e) => {
        console.log('eeeee', e)
        setSocketValue(e?.roomData)
        if (e?.roomData) {
            const selfPlay = e?.roomData?.players.find((p) => p?.userName === userName);
            setSelfPlayer(selfPlay);

            // Filter out the self player to get the opponents
            const opponents = e?.roomData?.players.filter((p) => p?.userName !== userName);
            setOpponents(opponents);
            setplayers(e?.roomData?.players)



            console.log('eddddddddddddddddddddd', e?.roomData)
            if (e?.roomData?.playedCards) {
                setPlayedCards(e?.roomData?.playedCards)
            }
            if (e?.roomData?.totalCards) {
                setremaningCards(e?.roomData?.totalCards)
            }
            if (e?.roomData?.status == 'playing') {
                console.log('playing updated')
            }


        }
    });
    return (
        <div class="">
            <div class="pontTable">
                {
                    players ?
                        players && players.map((p) => {

                            return (
                                p ?
                                    <div style={{ display: 'flex', color: "white", justifyContent: 'start', gap: "20px", margin: '5px 0px' }}>
                                        <p style={{ color: 'white' }}>{p?.userName}</p> :
                                        <p style={{ color: 'white' }}>{p?.points} Points</p>
                                    </div>
                                    : null
                            )
                        })
                        : null
                }
            </div>
            <div class="table">
                <p>Table</p>
            </div>
            <div class="remaningCards">
                {
                    socketValue.isTrumpSelected && socketValue.trumpSymbole 
                    ?
                    <p>{socketValue?.trumpSymbole}</p>
                    :
                    <p>{remaningCards[0]}</p>

                }
            </div>
            {
                playedCards && playedCards.map((item, i) => {
                    // Define the marginLeft values based on the index
                    const marginLeftValues = ['-120px', '-80px', '-40px', '-0px', '40px', '80px', '120px', '160px'];
                    const marginLeft = marginLeftValues[i] || '0px'; // Default to '0px' if the index is out of range

                    return (
                        item
                            ?
                            <div key={i} style={{ marginLeft }} className="playedCards">
                                <p>{item?.card ? item?.card : item}</p>
                            </div> : null


                    );
                })

            }

            <div class="player player1">
                {
                    selfPlayer?.isDealer ?
                        (
                            <div>
                                <p style={{ background: "white", color: "black", padding: '10px', fontSize: "18px" }}>D</p>
                            </div>
                        ) : null
                }

                <div style={{ color: 'white' }}>
                    {
                        selfPlayer?.isTurn && socketValue?.isStarted ? 'Your Turn' : null
                    }
                </div>
                <div class="cards">
                    {selfPlayer?.cards.length > 5 ? (
                        <div >
                            <p style={{ color: "white", fontSize: "18px" }}>Please Remove one Card</p>
                            <div class="cards">
                                {
                                    selfPlayer?.cards && selfPlayer?.cards.map((item) => (
                                        item !== 0 && item ?
                                            (
                                                <button onClick={() => removeExtraCard(item)} class="card">{item?.card ? item?.card : item}</button>
                                            ) : ''
                                    ))
                                }</div> 
                                </div>) :
                        selfPlayer?.cards && selfPlayer?.cards.map((item) => (
                            item !== 0 && item ?
                                (
                                    <button onClick={() => PlayedGame(item)} disabled={socketValue.isStarted == true && (playedGame) || !selfPlayer.isTurn || !selfPlayer?.userName == userName} class="card">{item?.card ? item?.card : item}</button>
                                ) : ''
                        ))
                    }
                </div>
                <p className="playerName">Player : {selfPlayer?.userName}</p>
            </div>

            <div class="player player2">
                {
                    Opponents[0]?.isDealer ?
                        (
                            <div>
                                <p style={{ background: "white", color: "black", padding: '10px', fontSize: "18px" }}>D</p>
                            </div>
                        ) : null
                }
                <div style={{ color: 'white' }}>
                    {
                        Opponents[0]?.isTurn ? 'Playing..' : null
                    }
                </div>
                <div class="cards">
                    {
                        Opponents[0]?.cards && Opponents[0].cards.map((item) => (
                            item !== 0 && item ?
                                (
                                    <button onClick={() => PlayedGame(item)} disabled={ socketValue.isStarted == false && (playedGame) || !Opponents[0].isTurn || !Opponents[0]?.userName == userName} class="card">{item?.card ? item?.card : item}</button>
                                ) : ''
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {Opponents[0]?.userName || 'Waiting...'}
                </p>
            </div>

            <div class="player player3">
                {
                    Opponents[1]?.isDealer ?
                        (
                            <div>
                                <p style={{ background: "white", color: "black", padding: '10px', fontSize: "18px" }}>D</p>
                            </div>
                        ) : null
                }
                <div style={{ color: 'white' }}>
                    {
                        Opponents[1]?.isTurn ? 'Playing..' : null
                    }
                </div>
                <div class="cards">
                    {
                        Opponents[1]?.cards && Opponents[1].cards.map((item) => (
                            item !== 0 && item ?
                                (
                                    <button onClick={() => PlayedGame(item)} disabled={ socketValue.isStarted == true && (playedGame) || !Opponents[1].isTurn || !Opponents[1]?.userName == userName} class="card">{item?.card ? item?.card : item}</button>
                                ) : ''
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {Opponents[1]?.userName || 'Waiting...'}
                </p>
            </div>

            <div class="player player4">
                {
                    Opponents[2]?.isDealer ?
                        (
                            <div>
                                <p style={{ background: "white", color: "black", padding: '10px', fontSize: "18px" }}>D</p>
                            </div>
                        ) : null
                }
                <div style={{ color: 'white' }}>
                    {
                        Opponents[2]?.isTurn ? 'Playing..' : null
                    }
                </div>
                <div class="cards">
                    {
                        Opponents[2]?.cards && Opponents[2].cards.map((item) => (
                            item !== 0 && item ?
                                (
                                    <button onClick={() => PlayedGame(item)} disabled={ socketValue.isStarted == true && (playedGame) || !Opponents[2].isTurn || !Opponents[2]?.userName == userName} class="card">{item?.card ? item?.card : item}</button>
                                ) : ''
                        ))
                    }
                </div>
                <p className="playerName">
                    Player : {Opponents[2]?.userName || 'Waiting...'}
                </p>
            </div>
            <div style={{ position: "absolute", top: "60px", left: '38%' }}>
                {selfPlayer?.isTrumpShow && !TrumpSelected ? (<TrumpBtn trumpRound={socketValue?.trumpRound} selectedSymboles={selectedSymboles} TrumpSelected={TrumpSelected} setTrumpSelected={setTrumpSelected} remaningCards={remaningCards} socket={socket} roomId={roomId} />) : null}
            </div>
        </div>
    );
};
export default PlayGround;
