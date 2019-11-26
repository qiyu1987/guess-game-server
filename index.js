const express = require("express")
const app = express()
const port = process.env.PORT || 4000

const bcrypt = require("bcrypt")

const bodyParser = require("body-parser")
const cors = require("cors")
const bodyParserMiddleWare = bodyParser.json()
const corsMiddleWare = cors()

const db = require("./db")
const User = require("./user/model")
const Table = require("./table/model")
const signupRouter = require("./user/router")
const loginRouter = require("./auth/router")
const lobbyRouter = require("./table/router")
db.sync({ force: true })
	.then(async () => {
		console.log("Database connected")
		try {
			const tables = [
				{ name: "Egel", status: "empty" },
				{ name: "Das", status: "empty" }
			]
			await Table.bulkCreate(tables)
			const users = [
				{ email: "yuki", password: bcrypt.hashSync("yuki", 10) },
				{ email: "xiaodan", password: bcrypt.hashSync("xiaodan", 10) }
			]
			await User.bulkCreate(users)
		} catch (error) {
			console.log(error)
		}
	})
	.catch(console.error)
app
	.use(corsMiddleWare)
	.use(bodyParserMiddleWare)
	.use(signupRouter)
	.use(loginRouter)
	.use(lobbyRouter)
	.listen(port, () => console.log("Server runing on port: ", port))
