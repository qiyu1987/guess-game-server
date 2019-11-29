const calculateWinner = require("./calculateWinner")
describe("calculate winner function", () => {
	test("it should return number type as winnerId", () => {
		// take input of challengerId and a table object
		const challengerId = 1
		const table = {
			name: "test table",
			status: "playing",
			diceRoll1: "12345",
			diceRoll2: "54321",
			bidNumber: 2,
			bidDiceType: 4,
			player1Id: 1,
			player2Id: 2,
			turnId: 1,
			winnerId: null
		}
		// out put should be 2
		const output = 2
		expect(calculateWinner(challengerId, table)).toEqual(output)
	})
})
