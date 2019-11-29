const { Router } = require("express")
const Sse = require("json-sse")
const router = new Router()
const stream = new Sse()
const Table = require("./model")
const User = require("../user/model")
const authMiddleware = require("../auth/middleware")

// get all tables as a list
router.get("/lobby", async (req, res, next) => {
	try {
		const tables = await Table.findAll()
		const data = JSON.stringify(tables)
		const action = {
			type: "TABELS_FETCHED",
			payload: data
		}
		stream.updateInit(action)
		stream.init(req, res)
	} catch (error) {
		next(error)
	}
})
// get one table
router.get("/table/:id", async (req, res, next) => {
	try {
		const table = await Table.findByPk(req.params.id, {
			include: [
				{ model: User, as: "player1", attributes: { exclude: "password" } },
				{ model: User, as: "player2", attributes: { exclude: "password" } },
				{ model: User, as: "turn", attributes: { exclude: "password" } },
				{ model: User, as: "winner", attributes: { exclude: "password" } }
			]
		})
		const data = JSON.stringify(table)
		const action = {
			type: "TABLE_FETCHED",
			payload: data
		}
		stream.updateInit(action)
		stream.init(req, res)
	} catch (error) {
		next(error)
	}
})
//create a table
router.post("/lobby", async (req, res) => {
	console.log("request post /lobby")
	console.log(req.body)
	const table = await Table.create({ ...req.body, status: "empty" })
	const tables = await Table.findAll()
	const data = JSON.stringify(tables)
	console.log("sse data back", data)
	stream.send(data)
	res.status(201)
	res.send("Create Table Success")
})
// join a table
router.put("/table/:id/join", authMiddleware, async (req, res) => {
	try {
		const table = await Table.findByPk(req.params.id, {
			include: [{ all: true }]
		})
		if (table) {
			switch (table.status) {
				case "empty":
					const newtable = await table.update({
						status: "waiting",
						player1Id: req.user.id
					})
					const data = JSON.stringify(newtable)
					const action = {
						type: "TABLE_JOINED",
						payload: data
					}
					stream.send(action)
					break
				case "waiting":
					if (table.player1Id !== req.user.userId) {
						const newtable = await table.update({
							status: "ready",
							player2Id: req.user.id
						})
						const data = JSON.stringify(newtable)
						const action = {
							type: "TABLE_JOINED",
							payload: data
						}
						stream.send(action)
					} else {
						res.state(400).send("You have already joined table")
					}
					break
				default:
					res.status(400).send("Table not available")
			}
		} else {
			res.status(404).end()
		}
	} catch {
		error => console.error
	}
})
// start a game
router.put("/table/:id/start", async (req, res, next) => {
	try {
		const table = await Table.findByPk(req.params.id, {
			include: [{ all: true }]
		})
		if (table) {
			const diceRoll1 = Array(5)
				.fill("")
				.map(() => Math.round(Math.random() * 5 + 1))
				.join("")
				.toString()
			const diceRoll2 = Array(5)
				.fill("")
				.map(() => Math.round(Math.random() * 5 + 1))
				.join("")
				.toString()
			const { player1Id } = table
			table.update({
				diceRoll1,
				diceRoll2,
				turnId: player1Id,
				status: "playing"
			})
			const data = JSON.stringify(table)
			stream.send(data)
			res.send(data)
		} else {
			res.status(404).end()
		}
	} catch (error) {
		next(error)
	}
})
// place a bid --> req.body = {bidNumber:1,bidDiceType:'3'}
router.put("/table/:id/bid", async (req, res) => {
	console.log(`a bid is placed on table ${req.params.id}`)
	const table = await Table.findByPk(req.params.id, {
		include: [{ all: true }]
	})
	if (table) {
		const { turnId, player1Id, player2Id } = table
		const newTurnId = turnId === player1Id ? player2Id : player1Id
		table.update({ ...req.body, turnId: newTurnId })
		const data = JSON.stringify(table)
		stream.send(data)
		res.send(data)
	} else {
		res.status(404).end()
	}
})
// challenge --> req.body = {winnerId: 1}
router.put("/table/:id/challenge", authMiddleware, async (req, res, next) => {
	try {
		console.log("got a put request on challenge")
		const table = await Table.findByPk(req.params.id, {
			include: [{ all: true }]
		})
		if (table) {
			const calculateWinner = require("../calculateWinner")
			const winnerId = calculateWinner(req.user.id, table)
			table.update({ status: "done", winnerId })
			const data = JSON.stringify(table)
			stream.send(data)
			res.send(data)
		} else {
			res.status(404).end()
		}
	} catch (error) {
		next(error)
	}
})
module.exports = router
