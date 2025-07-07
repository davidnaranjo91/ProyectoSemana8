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

// RUTAS DE AUTENTICACIÓN

// Registro de usuario
app.post("/api/register", (req, res) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: "Usuario y contraseña son requeridos" })
  }

  const users = readUsers()

  // Verificar si el usuario ya existe
  if (users.find((user) => user.username === username)) {
    return res.status(400).json({ error: "El usuario ya existe" })
  }

  // Crear nuevo usuario
  const newUser = {
    id: Date.now().toString(),
    username,
    password, // En producción deberías hashear la contraseña
  }

  users.push(newUser)
  writeUsers(users)

  // Inicializar inventario vacío para el nuevo usuario
  const inventory = readInventory()
  inventory[newUser.id] = []
  writeInventory(inventory)

  res.json({ message: "Usuario registrado exitosamente", userId: newUser.id })
})

// Login de usuario
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

// RUTAS DE INVENTARIO

// Obtener inventario del usuario
app.get("/api/inventory/:userId", (req, res) => {
  const { userId } = req.params
  const inventory = readInventory()

  res.json(inventory[userId] || [])
})

// Agregar producto al inventario
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
    name,
    quantity: Number.parseInt(quantity),
    price: Number.parseFloat(price),
    createdAt: new Date().toISOString(),
  }

  inventory[userId].push(newProduct)
  writeInventory(inventory)

  res.json({ message: "Producto agregado exitosamente", product: newProduct })
})

// Eliminar producto del inventario
app.delete("/api/inventory/:userId/:productId", (req, res) => {
  const { userId, productId } = req.params
  const inventory = readInventory()

  if (!inventory[userId]) {
    return res.status(404).json({ error: "Inventario no encontrado" })
  }

  inventory[userId] = inventory[userId].filter((product) => product.id !== productId)
  writeInventory(inventory)

  res.json({ message: "Producto eliminado exitosamente" })
})

// Actualizar producto del inventario
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

  inventory[userId][productIndex] = {
    ...inventory[userId][productIndex],
    name: name || inventory[userId][productIndex].name,
    quantity: quantity !== undefined ? Number.parseInt(quantity) : inventory[userId][productIndex].quantity,
    price: price !== undefined ? Number.parseFloat(price) : inventory[userId][productIndex].price,
    updatedAt: new Date().toISOString(),
  }

  writeInventory(inventory)

  res.json({ message: "Producto actualizado exitosamente", product: inventory[userId][productIndex] })
})

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})
