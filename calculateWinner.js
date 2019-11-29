const calculateWinner = (challengerId, table) => {
	const {
		bidNumber,
		bidDiceType,
		diceRoll1,
		diceRoll2,
		player1Id,
		player2Id
	} = table
	const arrayDice = diceRoll1.concat(diceRoll2).split("")
	const winnerId =
		arrayDice.filter(type => type === bidDiceType).length <= bidNumber
			? challengerId === player1Id
				? player2Id
				: player2Id
			: challengerId
	return winnerId
}
module.exports = calculateWinner
