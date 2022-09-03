const { response, application } = require('express')
const express = require('express')
const { v4: uuid } = require("uuid")

const app = express()

app.listen(3000)

app.use(express.json())

const customers = []

//middleware
function verifyExistsAccountCpf(request, response, next) {
    const { cpf } = request.headers

    const customer = customers.find((customer) => customer.cpf === cpf)

    if(!customer) {
        return response.status(400).json({error: "Customer not found"})
    }

    request.customer = customer

    return next()

}

function getBalance(statement) {
    const balance = statement.reduce((acc, operation) => {
        if(operation.type === 'credit') {
            return acc + operation.amount
        } else {
            return acc - operation.amount
        }
    }, 0)

    return balance
}

//routes
app.post("/account", (request, response) => {
    const {cpf, name} = request.body

    const ifAlreadyExists = customers.some(
        customers => customers.cpf === cpf
    )

    if(ifAlreadyExists) {
        return response.status(400).json({error: "Customer already exists"})
    }

    customers.push({
        cpf, 
        name,
        id: uuid(),
        statement: []
    })

    return response.status(201).send()
})

app.get("/statement", verifyExistsAccountCpf, (request, response) => {
    const { customer } = request

    return response.json(customer.statement)
})

app.post("/deposit", verifyExistsAccountCpf, (request, response) => {
    const { description, amount } = request.body

    const { customer } = request

    const statementOperation = {
        description,
        amount,
        created_at: new Date(),
        type: "credit"
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()
})

app.post("/withdraw", verifyExistsAccountCpf, (request, response) => {
    const { amount } = request.body

    const { customer } = request

    const balance = getBalance(customer.statement)

    if(balance < amount) {
        return response.status(400).json({error: "Insuficiente funds!"})
    }

    const statementOperation = {
        amount,
        created_at: new Date(),
        type: "debit"
    }

    customer.statement.push(statementOperation)

    return response.status(201).send()
})

app.post("/account", (request, response) => {
    const {cpf, name} = request.body

    const ifAlreadyExists = customers.some(
        customers => customers.cpf === cpf
    )

    if(ifAlreadyExists) {
        return response.status(400).json({error: "Customer already exists"})
    }

    customers.push({
        cpf, 
        name,
        id: uuid(),
        statement: []
    })

    return response.status(201).send()
})

app.get("/statement/date", verifyExistsAccountCpf, (request, response) => {
    const { customer } = request
    const { date} = request.query

    const dateFormat = new Date(date + " 00:00")

    const statement = customer.statement.filter((statement) => statement.created_at.toDateString() === new Date(dateFormat).toDateString())

    return response.json(statement)
})

app.put("/account", verifyExistsAccountCpf, (request, response) => {
    const { name } = request.body
    const { customer } = request

    customer.name = name

    return response.status(201).send()
})

app.get("/account", verifyExistsAccountCpf, (request, response) => {
    const { customer } = request

    return response.json(customer)
})

app.delete("/account", verifyExistsAccountCpf, (request, response) => {
    const { customer } = request

    customers.splice(customer, 1)

    return response.status(200).json(customers)
})


app.get("/balance", verifyExistsAccountCpf, (request, response) => {
    const { customer} = request

    const balance = getBalance(customer.statement)

    return response.json(balance)
})