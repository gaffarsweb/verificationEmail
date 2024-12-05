import React, { useState } from 'react';
import axios from 'axios';
import './Lucky6.css'; // Import the CSS file

function Lucky6() {
    const [gameData, setGameData] = useState(null);
    const [showExistedCards, setShowExistedCards] = useState(null); // To show cards of a specific player
    const [results, setResults] = useState([]);
    const [cardInput, setCardInput] = useState('');
    const [evaluateResult, setEvaluateResult] = useState(null);
    const [isLoading, setIsLoading] = useState(false); // For loading state

    // Helper function to handle API call errors
    const handleApiError = (error) => {
        console.error('API Error:', error);
        alert('An error occurred, please try again later.');
    };

    // Shuffle cards (start game)
    const handleShuffle = async () => {
        setGameData(null);
        setIsLoading(true);
        try {
            const response = await axios.post('https://bullbullapi.onrender.com/lucky-shuffle');
            setGameData(response.data);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Finish game and calculate results
    const handleFinish = async () => {
        setIsLoading(true);
        try {
            const payload = {
                players: gameData?.players
            }
            const response = await axios.post('https://bullbullapi.onrender.com/lucky-finish', payload);
            console.log('res', response)
            setGameData(response.data);
            setResults(response.data.results);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Evaluate player's hand
    const handleEvaluate = async () => {
        const cards = cardInput.split(',').map(card => {
            const [value, suit] = card.trim().split(' ');
            return { value, suit };
        });
        setIsLoading(true);
        try {
            const response = await axios.post('https://bullbullapi.onrender.com/evaluate', { cards });
            setEvaluateResult(response.data.result);
        } catch (error) {
            handleApiError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Add selected card to the player's position
    const handleAddCardInPosition = (card, index, playerId) => {
        // Don't mutate state directly, update it properly
        console.log(playerId)
        if (gameData?.players[index]) {
            const updatedPlayers = [...gameData.players];
            const player = updatedPlayers[index];

            // Safely update the player's position
            const newPosition = player.position ? [...player.position, card] : [card];
            player.position = newPosition;
            console.log('updatedPlayers', updatedPlayers)
            // Update the state with the new players list
            setGameData({ ...gameData, players: updatedPlayers });
        }
    };

    return (
        <div className="game-container">
            <div className="game-box">
                <h1 className="game-title">Lucky Six Poker Game</h1>
                <span style={{color:"red"}}>Note: Please carefully click on each player's card name only once. Do not click multiple times. After three clicks, you will see the three cards you selected in position.</span>
                <div className="game-controls">
                    <button onClick={handleShuffle} className="shuffle-button" disabled={isLoading}>
                        {isLoading ? 'Shuffling...' : 'Shuffle Cards'}
                    </button>
                    <button onClick={handleFinish} className="finish-button" disabled={isLoading}>
                        {isLoading ? 'Finishing...' : 'Finish Game'}
                    </button>
                </div>

                {gameData && (
                    <div className="cards-section">
                        <div className="players-cards">
                            <h2 className="cards-title">Players' Cards</h2>
                            <div className="players-list">
                                {gameData.players.map((player, index) => (
                                    <div key={player.id} className="player-card">
                                        <h3 className="player-name">Player {player.id}</h3>
                                        {/* <div
                                            style={{ cursor: 'pointer', backgroundColor: 'red', textAlign: 'center', color: 'white' }}
                                            onClick={() => setShowExistedCards(player.id)}
                                            className='cards-list'>
                                            Show Existed Cards
                                        </div> */}
                                        {true && (
                                            // {showExistedCards === player.id && (
                                            <div className="cards-list">
                                                {player.cards && player.cards.map((card) => (
                                                    <p style={{ cursor: "pointer" }}
                                                        onClick={() => handleAddCardInPosition(card, index, player.id)}
                                                        key={card.value}
                                                        className="card-detail">
                                                        {card.value} of {card.suit}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                        <div>
                                            <h4>Position:</h4>
                                            {/* Show card at position[5] if it exists */}
                                            <div>
                                                {gameData.players[index]?.position?.[5]?.value ? (
                                                    `${gameData.players[index].position[5].value} of ${gameData.players[index].position[5].suit}`
                                                ) : null}
                                            </div>

                                            {/* Show cards at position[3] and position[4] if they exist */}
                                            <div>
                                                {gameData.players[index]?.position?.[3]?.value && gameData.players[index]?.position?.[4]?.value ? (
                                                    `${gameData.players[index].position[3].value} of ${gameData.players[index].position[3].suit}, ${gameData.players[index].position[4].value} of ${gameData.players[index].position[4].suit}`
                                                ) : null}
                                            </div>

                                            {/* Show cards at position[0], position[1], and position[2] if they exist */}
                                            <div>
                                                {gameData.players[index]?.position?.[0]?.value && gameData.players[index]?.position?.[1]?.value && gameData.players[index]?.position?.[2]?.value ? (
                                                    `${gameData.players[index].position[0].value} of ${gameData.players[index].position[0].suit}, 
            ${gameData.players[index].position[1].value} of ${gameData.players[index].position[1].suit}, 
            ${gameData.players[index].position[2].value} of ${gameData.players[index].position[2].suit}`
                                                ) : null}
                                            </div>
                                        </div>



                                        <div>
                                            <h4>Result:</h4>
                                            {/* Show card at position[5] if it exists */}
                                            <div>
                                                front : {player?.front}
                                            </div>
                                            <div>
                                                Middle : {player?.middle}
                                            </div>
                                            <div>
                                                back : {player?.back}
                                            </div>
                                        </div>

                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {results.length > 0 && (
                    <div className="results-section">
                        <h2 className="results-title">Game Results</h2>
                        {results.map(result => (
                            <div key={result.player} className="result-item">
                                <p className="result-name">{result.player}</p>
                                <p className="result-detail">{result.result}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Card Evaluation Section */}
                {/* <div className="evaluate-section" style={{ display: 'flex', flexDirection: "column" }}>
                    <h2 className="evaluate-title">Evaluate Cards</h2>
                    <span className='' style={{ color: "red", fontSize: "11px" }}>
                        Note: Enter 5 Cards Like (10 Hearts, J Diamonds, 3 Clubs, 2 Spades, Q Hearts)
                    </span>
                    <input
                        type="text"
                        value={cardInput}
                        onChange={e => setCardInput(e.target.value)}
                        placeholder="Enter cards (e.g. 10 Hearts, J Diamonds, 3 Clubs, 2 Spades, Q Hearts)"
                        className="evaluate-input"
                    />
                    <button onClick={handleEvaluate} className="evaluate-button" disabled={isLoading}>
                        {isLoading ? 'Evaluating...' : 'Evaluate'}
                    </button>
                    {evaluateResult && (
                        <div className="evaluate-result">
                            <h3>Result: {evaluateResult}</h3>
                        </div>
                    )}
                </div> */}
            </div>
        </div >
    );
}

export default Lucky6;
