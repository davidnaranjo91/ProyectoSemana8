const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")

const app = express()
const PORT = 3000

app.use(cors())
app.use(express.json())

const USERS_FILE = path.join(__dirname, "data", "users.json")
const INVENTORY_FILE = path.join(__dirname, "data", "inventory.json")
const CLIENTS_FILE = path.join(__dirname, "data", "clients.json")
const INVOICES_FILE = path.join(__dirname, "data", "invoices.json")

if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"))
}

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]))
}

if (!fs.existsSync(INVENTORY_FILE)) {
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify({}))
}

if (!fs.existsSync(CLIENTS_FILE)) {
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify({}))
}

if (!fs.existsSync(INVOICES_FILE)) {
  fs.writeFileSync(INVOICES_FILE, JSON.stringify({}))
}

const readUsers = () => {
  try {
    const data = fs.readFileSync(USERS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

const writeUsers = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2))
}

const readInventory = () => {
  try {
    const data = fs.readFileSync(INVENTORY_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return {}
  }
}

const writeInventory = (inventory) => {
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify(inventory, null, 2))
}

const readClients = () => {
  try {
    const data = fs.readFileSync(CLIENTS_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return {}
  }
}

const writeClients = (clients) => {
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify(clients, null, 2))
}

const readInvoices = () => {
  try {
    const data = fs.readFileSync(INVOICES_FILE, "utf8")
    return JSON.parse(data)
  } catch (error) {
    return {}
  }
}

const writeInvoices = (invoices) => {
  fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2))
}

// registro de usuario
app.post("/api/register", (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" })
  }

  const users = readUsers()

  if (users.find((user) => user.username === username)) {
    return res.status(400).json({ error: "El usuario ya existe" })
  }

  const newUser = {
    id: Date.now().toString(),
    username,
    password,
  }

  users.push(newUser)
  writeUsers(users)

  const inventory = readInventory()
  inventory[newUser.id] = []
  writeInventory(inventory)

  const clients = readClients()
  clients[newUser.id] = []
  writeClients(clients)

  const invoices = readInvoices()
  invoices[newUser.id] = []
  writeInvoices(invoices)

  res.json({ message: "Usuario registrado exitosamente", userId: newUser.id })
})

// login usuario
app.post("/api/login", (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" })
  }

  const users = readUsers()
  const user = users.find((u) => u.username === username && u.password === password)

  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" })
  }

  res.json({ message: "Login exitoso", userId: user.id, username: user.username })
})


app.get("/api/inventory/:userId", (req, res) => {
  const { userId } = req.params
  const inventory = readInventory()
  const userProducts = inventory[userId] || []
  res.json(userProducts)
})

// producto específico
app.get("/api/inventory/:userId/:productId", (req, res) => {
  const { userId, productId } = req.params
  const inventory = readInventory()

  if (!inventory[userId]) {
    return res.status(404).json({ error: "Inventario no encontrado" })
  }

  const product = inventory[userId].find((product) => product.id === productId)

  if (!product) {
    return res.status(404).json({ error: "Producto no encontrado" })
  }

  res.json(product)
})

// agregar producto al inventario
app.post("/api/inventory/:userId", (req, res) => {
  const { userId } = req.params
  const { name, quantity, price } = req.body

  if (!name || quantity === undefined || price === undefined) {
    return res.status(400).json({ error: "Nombre, cantidad y precio son requeridos" })
  }

  const inventory = readInventory()

  if (!inventory[userId]) {
    inventory[userId] = []
  }

  const newProduct = {
    id: Date.now().toString(),
    name: name.trim(),
    quantity: Number.parseInt(quantity),
    price: Number.parseFloat(price),
    createdAt: new Date().toISOString(),
  }

  inventory[userId].push(newProduct)
  writeInventory(inventory)

  res.json({ message: "Producto agregado exitosamente", product: newProduct })
})

// actualizar producto
app.put("/api/inventory/:userId/:productId", (req, res) => {
  const { userId, productId } = req.params
  const { name, quantity, price } = req.body
  const inventory = readInventory()

  if (!inventory[userId]) {
    return res.status(404).json({ error: "Inventario no encontrado" })
  }

  const productIndex = inventory[userId].findIndex((product) => product.id === productId)

  if (productIndex === -1) {
    return res.status(404).json({ error: "Producto no encontrado" })
  }

  if (!name || quantity === undefined || price === undefined) {
    return res.status(400).json({ error: "Nombre, cantidad y precio son requeridos" })
  }

  inventory[userId][productIndex] = {
    ...inventory[userId][productIndex],
    name: name.trim(),
    quantity: Number.parseInt(quantity),
    price: Number.parseFloat(price),
    updatedAt: new Date().toISOString(),
  }

  writeInventory(inventory)

  res.json({ message: "Producto actualizado exitosamente", product: inventory[userId][productIndex] })
})

// Eliminar producto
app.delete("/api/inventory/:userId/:productId", (req, res) => {
  const { userId, productId } = req.params
  const inventory = readInventory()

  if (!inventory[userId]) {
    return res.status(404).json({ error: "Inventario no encontrado" })
  }

  const productToDelete = inventory[userId].find((product) => product.id === productId)
  if (!productToDelete) {
    return res.status(404).json({ error: "Producto no encontrado" })
  }

  inventory[userId] = inventory[userId].filter((product) => product.id !== productId)
  writeInventory(inventory)

  res.json({ message: "Producto eliminado exitosamente" })
})


// obtener datos clientes
app.get("/api/clients/:userId", (req, res) => {
  const { userId } = req.params
  const clients = readClients()
  const userClients = clients[userId] || []
  res.json(userClients)
})

// obtener un cliente específico
app.get("/api/clients/:userId/:clientId", (req, res) => {
  const { userId, clientId } = req.params
  const clients = readClients()


  if (!clients[userId]) {
    return res.status(404).json({ error: "Clientes no encontrados" })
  }

  const client = clients[userId].find((client) => client.id === clientId)

  if (!client) {
    return res.status(404).json({ error: "Cliente no encontrado" })
  }

  res.json(client)
})

//agregar cliente
app.post("/api/clients/:userId", (req, res) => {
  const { userId } = req.params
  const { name, phone, email, address } = req.body

  if (!name || !phone) {
    return res.status(400).json({ error: "Nombre y teléfono son requeridos" })
  }

  const clients = readClients()

  if (!clients[userId]) {
    clients[userId] = []
  }

  const newClient = {
    id: Date.now().toString(),
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : "",
    address: address ? address.trim() : "",
    createdAt: new Date().toISOString(),
  }

  clients[userId].push(newClient)
  writeClients(clients)

  res.json({ message: "Cliente agregado exitosamente", client: newClient })
})

// actualizar cliente
app.put("/api/clients/:userId/:clientId", (req, res) => {
  const { userId, clientId } = req.params
  const { name, phone, email, address } = req.body
  const clients = readClients()

  if (!clients[userId]) {
    return res.status(404).json({ error: "Clientes no encontrados" })
  }

  const clientIndex = clients[userId].findIndex((client) => client.id === clientId)

  if (clientIndex === -1) {
    return res.status(404).json({ error: "Cliente no encontrado" })
  }

  if (!name || !phone) {
    return res.status(400).json({ error: "Nombre y teléfono son requeridos" })
  }

  clients[userId][clientIndex] = {
    ...clients[userId][clientIndex],
    name: name.trim(),
    phone: phone.trim(),
    email: email ? email.trim() : "",
    address: address ? address.trim() : "",
    updatedAt: new Date().toISOString(),
  }

  writeClients(clients)

  res.json({ message: "Cliente actualizado exitosamente", client: clients[userId][clientIndex] })
})

// eliminar cliente
app.delete("/api/clients/:userId/:clientId", (req, res) => {
  const { userId, clientId } = req.params
  const clients = readClients()

  if (!clients[userId]) {
    return res.status(404).json({ error: "Clientes no encontrados" })
  }

  const clientToDelete = clients[userId].find((client) => client.id === clientId)
  if (!clientToDelete) {
    return res.status(404).json({ error: "Cliente no encontrado" })
  }

  clients[userId] = clients[userId].filter((client) => client.id !== clientId)
  writeClients(clients)

  res.json({ message: "Cliente eliminado exitosamente" })
})


// obtener facturas  usuario
app.get("/api/invoices/:userId", (req, res) => {
  const { userId } = req.params
  const invoices = readInvoices()
  const userInvoices = invoices[userId] || []
  res.json(userInvoices)
})

// obtener factura específica
app.get("/api/invoices/:userId/:invoiceId", (req, res) => {
  const { userId, invoiceId } = req.params
  const invoices = readInvoices()

  if (!invoices[userId]) {
    return res.status(404).json({ error: "Facturas no encontradas" })
  }

  const invoice = invoices[userId].find((invoice) => invoice.id === invoiceId)

  if (!invoice) {
    return res.status(404).json({ error: "Factura no encontrada" })
  }

  res.json(invoice)
})

app.post("/api/invoices/:userId", (req, res) => {
  const { userId } = req.params
  const { clientId, items } = req.body

  if (!clientId || !items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "Cliente y productos son requeridos" })
  }

  const clients = readClients()
  if (!clients[userId]) {
    return res.status(404).json({ error: "No tienes clientes registrados" })
  }

  const client = clients[userId].find((c) => c.id === clientId)
  if (!client) {
    return res.status(404).json({ error: "Cliente no encontrado" })
  }

  // verificar inventario y stock
  const inventory = readInventory()
  if (!inventory[userId]) {
    return res.status(404).json({ error: "No tienes productos en inventario" })
  }

  // validar que los productos existen y tengan stock suficiente
  for (const item of items) {
    const product = inventory[userId].find((p) => p.id === item.productId)
    if (!product) {
      return res.status(404).json({ error: `Producto con ID ${item.productId} no encontrado` })
    }
    if (product.quantity < item.quantity) {
      return res.status(400).json({
        error: `Stock insuficiente para ${product.name}. Disponible: ${product.quantity}, Solicitado: ${item.quantity}`,
      })
    }
  }

  // Crear la factura
  const invoiceNumber = `INV-${Date.now()}`
  let total = 0
  const invoiceItems = []

  for (const item of items) {
    const productIndex = inventory[userId].findIndex((p) => p.id === item.productId)
    const product = inventory[userId][productIndex]

    inventory[userId][productIndex].quantity -= item.quantity

    const itemTotal = item.quantity * product.price
    total += itemTotal

    invoiceItems.push({
      productId: product.id,
      productName: product.name,
      quantity: item.quantity,
      unitPrice: product.price,
      total: itemTotal,
    })
  }

  // Guardar inventario
  writeInventory(inventory)

  // Crear factura
  const newInvoice = {
    id: Date.now().toString(),
    invoiceNumber,
    client: {
      id: client.id,
      name: client.name,
      phone: client.phone,
      email: client.email,
      address: client.address,
    },
    items: invoiceItems,
    subtotal: total,
    total: total, 
    createdAt: new Date().toISOString(),
  }

  // Guardar factura
  const invoices = readInvoices()
  if (!invoices[userId]) {
    invoices[userId] = []
  }
  invoices[userId].push(newInvoice)
  writeInvoices(invoices)

  res.json({
    message: "Factura creada exitosamente",
    invoice: newInvoice,
    inventoryUpdated: true,
  })
})


// Obtener reporte de productos vendidos
app.get("/api/reports/sales/:userId", (req, res) => {
  const { userId } = req.params
  const { productName } = req.query 

  const invoices = readInvoices()
  const userInvoices = invoices[userId] || []

  // Crear reporte de ventas
  const salesReport = []

  userInvoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      const saleRecord = {
        productId: item.productId,
        productName: item.productName,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        quantitySold: item.quantity,
        unitPrice: item.unitPrice,
        totalSale: item.total,
        client: {
          id: invoice.client.id,
          name: invoice.client.name,
          phone: invoice.client.phone,
        },
        saleDate: invoice.createdAt,
      }
      salesReport.push(saleRecord)
    })
  })

  let filteredReport = salesReport
  if (productName && productName.trim() !== "") {
    const searchTerm = productName.toLowerCase().trim()
    filteredReport = salesReport.filter((record) => record.productName.toLowerCase().includes(searchTerm))
  }

  filteredReport.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate))

  res.json(filteredReport)
})

// Obtener resumen de ventas por producto
app.get("/api/reports/summary/:userId", (req, res) => {
  const { userId } = req.params

  const invoices = readInvoices()
  const userInvoices = invoices[userId] || []

  // Crear resumen por producto
  const productSummary = {}

  userInvoices.forEach((invoice) => {
    invoice.items.forEach((item) => {
      if (!productSummary[item.productId]) {
        productSummary[item.productId] = {
          productId: item.productId,
          productName: item.productName,
          totalQuantitySold: 0,
          totalRevenue: 0,
          salesCount: 0,
          averagePrice: 0,
        }
      }

      productSummary[item.productId].totalQuantitySold += item.quantity
      productSummary[item.productId].totalRevenue += item.total
      productSummary[item.productId].salesCount += 1
      productSummary[item.productId].averagePrice = item.unitPrice
    })
  })

  const summaryArray = Object.values(productSummary).sort((a, b) => b.totalQuantitySold - a.totalQuantitySold)
  res.json(summaryArray)
})

app.listen(PORT, () => {
})
