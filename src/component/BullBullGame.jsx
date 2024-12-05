import React, { useState } from 'react';
import axios from 'axios';
import './BullBullGame.css'; // Import the CSS file

function BullBullGame() {
    const [gameData, setGameData] = useState(null);
    const [results, setResults] = useState([]);
    const [cardInput, setCardInput] = useState('');
    const [evaluateResult, setEvaluateResult] = useState(null);

    const handleShuffle = async () => {
        try {
            const response = await axios.post('https://bullbullapi.onrender.com/shuffle');
            setGameData(response.data);
        } catch (error) {
            console.error("Error shuffling the deck", error);
        }
    };

    const handleFinish = async () => {
        try {
            const response = await axios.post('https://bullbullapi.onrender.com/finish');
            setResults(response.data.results);
        } catch (error) {
            console.error("Error calculating results", error);
        }
    };

    const handleEvaluate = async () => {
        const cards = cardInput.split(',').map(card => {
            const [value, suit] = card.trim().split(' ');
            return { value, suit };
        });
        try {
            const response = await axios.post('https://bullbullapi.onrender.com/evaluate', { cards });
            setEvaluateResult(response.data.result);
        } catch (error) {
            console.error("Error evaluating cards", error);
        }
    };

    return (
        <div className="game-container">
            <div className="game-box">
                <h1 className="game-title">Bull Bull Poker Game</h1>

                <div className="game-controls">
                    <button onClick={handleShuffle} className="shuffle-button">Shuffle Cards</button>
                    <button onClick={handleFinish} className="finish-button">Finish Game</button>
                </div>

                {gameData && (
                    <div className="cards-section">
                        <div className="players-cards">
                            <h2 className="cards-title">Players' Cards</h2>
                            <div className="players-list">
                                {gameData.players.map(player => (
                                    <div key={player.id} className="player-card">
                                        <h3 className="player-name">Player {player.id}</h3>
                                        <div className="cards-list">
                                            {player.cards.map((card, index) => (
                                                <p key={index} className="card-detail">{card.value} of {card.suit}</p>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="dealer-cards">
                            <h2 className="cards-title">Dealer's Cards</h2>
                            <div className="dealer-card">
                                <h3 className="dealer-name">Dealer</h3>
                                <div className="cards-list">
                                    {gameData.dealer.cards.map((card, index) => (
                                        <p key={index} className="card-detail">{card.value} of {card.suit}</p>
                                    ))}
                                </div>
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

                <div className="evaluate-section" style={{display:'flex', flexDirection:"column"}}>
                    <h2 className="evaluate-title">Evaluate Cards</h2>
                    <span className='' style={{color:"red", fontSize:"11px"}}> Note : Enter 5 Cards Like (10 Hearts, J Diamonds, 3 Clubs, 2 Spades, Q Hearts)</span>
                    <input
                        type="text"
                        value={cardInput}
                        onChange={e => setCardInput(e.target.value)}
                        placeholder="Enter cards (e.g. 10 Hearts, J Diamonds, 3 Clubs, 2 Spades, Q Hearts)"
                        className="evaluate-input"
                    />
                    <button onClick={handleEvaluate} className="evaluate-button">Evaluate</button>
                    {evaluateResult && (
                        <div className="evaluate-result">
                            <h3>Result: {evaluateResult}</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default BullBullGame;
