const express = require("express")
const fs = require("fs")
const path = require("path")
const cors = require("cors")

const app = express()
const PORT = 3000

// Middleware
app.use(cors())
app.use(express.json())

// Rutas de archivos para almacenar datos
const USERS_FILE = path.join(__dirname, "data", "users.json")
const INVENTORY_FILE = path.join(__dirname, "data", "inventory.json")
const CLIENTS_FILE = path.join(__dirname, "data", "clients.json")

// Crear carpeta data si no existe
if (!fs.existsSync(path.join(__dirname, "data"))) {
  fs.mkdirSync(path.join(__dirname, "data"))
}

// Inicializar archivos si no existen
if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]))
}

if (!fs.existsSync(INVENTORY_FILE)) {
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify({}))
}

if (!fs.existsSync(CLIENTS_FILE)) {
  fs.writeFileSync(CLIENTS_FILE, JSON.stringify({}))
}

// Funciones helper para leer/escribir archivos
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

// RUTAS DE AUTENTICACIÓN

// Registro de usuario
app.post("/api/register", (req, res) => {
  console.log("POST /api/register - Body:", req.body)
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

  console.log("Usuario registrado:", newUser.username)
  res.json({ message: "Usuario registrado exitosamente", userId: newUser.id })
})

// Login de usuario
app.post("/api/login", (req, res) => {
  console.log("POST /api/login - Body:", req.body)
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" })
  }

  const users = readUsers()
  const user = users.find((u) => u.username === username && u.password === password)

  if (!user) {
    return res.status(401).json({ error: "Credenciales inválidas" })
  }

  console.log("Login exitoso:", user.username)
  res.json({ message: "Login exitoso", userId: user.id, username: user.username })
})

// RUTAS DE INVENTARIO

// Obtener inventario del usuario
app.get("/api/inventory/:userId", (req, res) => {
  console.log("GET /api/inventory/:userId - UserId:", req.params.userId)
  const { userId } = req.params
  const inventory = readInventory()
  const userProducts = inventory[userId] || []
  console.log("Productos encontrados:", userProducts.length)
  res.json(userProducts)
})

// Obtener un producto específico
app.get("/api/inventory/:userId/:productId", (req, res) => {
  console.log("🔍 GET /api/inventory/:userId/:productId - Params:", req.params)
  const { userId, productId } = req.params
  const inventory = readInventory()

  console.log("📂 Inventario completo:", inventory)
  console.log("👤 Productos del usuario:", inventory[userId])

  if (!inventory[userId]) {
    console.log("❌ Inventario no encontrado para usuario:", userId)
    return res.status(404).json({ error: "Inventario no encontrado" })
  }

  const product = inventory[userId].find((product) => product.id === productId)
  console.log("🔍 Buscando producto con ID:", productId)
  console.log("📦 Producto encontrado:", product)

  if (!product) {
    console.log("❌ Producto no encontrado con ID:", productId)
    return res.status(404).json({ error: "Producto no encontrado" })
  }

  console.log("✅ Producto encontrado:", product.name)
  res.json(product)
})

// Agregar producto al inventario
app.post("/api/inventory/:userId", (req, res) => {
  console.log("POST /api/inventory/:userId - UserId:", req.params.userId, "Body:", req.body)
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

  console.log("Producto agregado:", newProduct.name)
  res.json({ message: "Producto agregado exitosamente", product: newProduct })
})

// Actualizar producto del inventario
app.put("/api/inventory/:userId/:productId", (req, res) => {
  console.log("PUT /api/inventory/:userId/:productId - Params:", req.params, "Body:", req.body)
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

  console.log("Producto actualizado:", inventory[userId][productIndex].name)
  res.json({ message: "Producto actualizado exitosamente", product: inventory[userId][productIndex] })
})

// Eliminar producto del inventario
app.delete("/api/inventory/:userId/:productId", (req, res) => {
  console.log("DELETE /api/inventory/:userId/:productId - Params:", req.params)
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

  console.log("Producto eliminado:", productToDelete.name)
  res.json({ message: "Producto eliminado exitosamente" })
})

// RUTAS DE CLIENTES

// Obtener clientes del usuario
app.get("/api/clients/:userId", (req, res) => {
  console.log("👥 GET /api/clients/:userId - UserId:", req.params.userId)
  const { userId } = req.params
  const clients = readClients()
  const userClients = clients[userId] || []
  console.log("Clientes encontrados:", userClients.length)
  res.json(userClients)
})

// Obtener un cliente específico
app.get("/api/clients/:userId/:clientId", (req, res) => {
  console.log("🔍 GET /api/clients/:userId/:clientId - Params:", req.params)
  const { userId, clientId } = req.params
  const clients = readClients()

  console.log("📂 Clientes completo:", clients)
  console.log("👤 Clientes del usuario:", clients[userId])

  if (!clients[userId]) {
    console.log("❌ Clientes no encontrados para usuario:", userId)
    return res.status(404).json({ error: "Clientes no encontrados" })
  }

  const client = clients[userId].find((client) => client.id === clientId)
  console.log("🔍 Buscando cliente con ID:", clientId)
  console.log("👤 Cliente encontrado:", client)

  if (!client) {
    console.log("❌ Cliente no encontrado con ID:", clientId)
    return res.status(404).json({ error: "Cliente no encontrado" })
  }

  console.log("✅ Cliente encontrado:", client.name)
  res.json(client)
})

// Agregar cliente
app.post("/api/clients/:userId", (req, res) => {
  console.log("POST /api/clients/:userId - UserId:", req.params.userId, "Body:", req.body)
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

  console.log("Cliente agregado:", newClient.name)
  res.json({ message: "Cliente agregado exitosamente", client: newClient })
})

// Actualizar cliente
app.put("/api/clients/:userId/:clientId", (req, res) => {
  console.log("PUT /api/clients/:userId/:clientId - Params:", req.params, "Body:", req.body)
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

  console.log("Cliente actualizado:", clients[userId][clientIndex].name)
  res.json({ message: "Cliente actualizado exitosamente", client: clients[userId][clientIndex] })
})

// Eliminar cliente
app.delete("/api/clients/:userId/:clientId", (req, res) => {
  console.log("DELETE /api/clients/:userId/:clientId - Params:", req.params)
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

  console.log("Cliente eliminado:", clientToDelete.name)
  res.json({ message: "Cliente eliminado exitosamente" })
})

app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`)
  console.log(`📁 Archivos de datos en: ${path.join(__dirname, "data")}`)
})
