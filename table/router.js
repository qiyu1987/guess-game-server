const { Router } = require('express')
const Sse = require('json-sse')
const router = new Router()
const stream = new Sse()
const Table = require('./model')
const authMiddleware = require('../auth/middleware')
const { toData } = require("../auth/jwt");
// get all tables as a list
router.get('/lobby', 
    async (req, res) => {
        const tables = await Table.findAll()
        const data = JSON.stringify(tables)
        stream.updateInit(data)
        stream.init(req, res)
    }
)
// get one table
router.get('/table/:id',
    async (req, res) => {
        const table = await Table.findByPk(req.params.id, { include: [{all:true}] })
        const data = JSON.stringify(table)
        stream.updateInit(data)
        stream.init(req, res)
    }
)
//create a table
router.post('/lobby', 
    (req, res, next) => {
        console.log('request post /lobby')
        console.log(req.body)
        Table.create({...req.body, status: 'empty'})
            .then(table => res.json(table))
            .catch(next)
    }
)
// join a table
router.put('/table/:id/join', authMiddleware, 
    async (req, res, next) => {
        console.log(`get a request on put /table/${req.params.id}/join`)
        const auth =
        req.headers.authorization && req.headers.authorization.split(" ");
        const user = toData(auth[1])
        console.log('what is the user out of token',user)
        const table = await Table.findByPk(req.params.id, {include: [{all:true}]})
        
        if (table) {
            switch (table.status) {
                case 'empty':
                    table.update({ status:'waiting', player1Id:user.userId })
                    const tableData = JSON.stringify(table)
                    stream.send(tableData)
                    res.send(tableData)
                case 'waiting':
                    if (table.player1Id!==user.userId)
                    {
                        table.update({ status:'playing', player2Id:user.userId })
                        const tableData = JSON.stringify(table)
                        stream.send(tableData)
                        res.send(tableData)
                    } else {
                        res.send('You already joined the table')
                    }
                default:
                    res.send('Table not available')
            }
        } else {
        res.status(404).end();
        }
        
        
    }
)
// start a game --> req.body = {diceRoll1:'12345',diceRoll2:'54321'}
router.put('/table/:id/start', async (req, res) => {
    const table = await Table.findByPk(req.params.id, {include: [{all:true}]})
    if (table) {
        const {player1Id} = table
        table.update({
            ...req.body,
            status:'playing', 
            turnId: player1Id, 
            bidNumber: null, 
            bidDiceType: null, 
            winnerId: null})
        const data = JSON.stringify(table)
        stream.send(data)
        res.send(data)
    } else {
        res.status(404).end()
    }
})
// place a bid --> req.body = {bidNumber:1,bidDiceType:'3'}
router.put('/table/:id/bid', async (req, res) => {
    console.log(`a bid is placed on table ${req.params.id}`)
    const table = await Table.findByPk(req.params.id,{include:[{all:true}]})
    if (table){
        const {turnId, player1Id, player2Id} = table
        const newTurnId = turnId === player1Id ? player2Id : player1Id
        table.update({...req.body, turnId: newTurnId})
        const data = JSON.stringify(table)
        stream.send(data)
        res.send(data)
    } else {
        res.status(404).end()
    }
})
// challenge --> req.body = {winnerId: 1}
router.put('/table/:id/challenge', (req, res, next) => {
    console.log('got a put request on challenge')
    Table.findByPk(req.params.id, {include: [{all:true}]})
        .then(table => {
            if (table) {
                table.update({status:'done', ...req.body})
                const data = JSON.stringify(table)
                stream.send(data)
                res.send(data)
            } else {
                res.status(404).end()
            }
        })
})
module.exports = router

