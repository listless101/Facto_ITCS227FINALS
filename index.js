const express = require('express');
const { v4: uuidv4 } = require('uuid');
const app = express();
const port = 4000;

app.use(express.json());

let users = [];
let products = [];
let orders = [];

app.post('/users', (req, res) => {
  const { email, password } = req.body;
  const existingUser = users.find(user => user.email === email);

  if (existingUser) {
    return res.send('Email already registered');
  }

  const newUser = {
    id: uuidv4(),
    email: email,
    password: password,
    isAdmin: false || req.body.isAdmin,
    cart: [],
    orders: []
  };

  users.push(newUser);
  console.log(newUser)
  res.send('Registered Successfully');
});

app.get('/users', (req, res) => {
    if (loggedUser && loggedUser.isAdmin) {
      res.send(users);
    } else {
      res.send('Unauthorized. Action Forbidden');
    }
  });

app.put('/users/:id/setadmin', (req, res) => {
    if (loggedUser && loggedUser.isAdmin) {
      const userId = req.params.id;
      const user = users.find(user => user.id === userId);
  
      if (user) {
        user.isAdmin = true;
        res.send('User set as admin successfully');
      } else {
        res.send('User not found');
      }
    } else {
      res.send('Unauthorized. Action Forbidden');
    }
  });

app.post('/users/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(user => user.email === email && user.password === password);

  if (user) {
    loggedUser = user;
    res.send('Logged in successfully');
  } else {
    loggedUser = null;
    res.send('Login failed. Wrong credentials.');
  }
});

app.post('/products', (req, res) => {
  if (loggedUser && loggedUser.isAdmin) {
    const { name, description, price } = req.body;
    const newProduct = {
      id: uuidv4(),
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      isActive: req.body.isActive
    };

    products.push(newProduct);
    res.send('Product created successfully');
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});

app.get('/products', (req, res) => {
  res.send(products);
});

app.get('/products/active', (req, res) => {
  const activeProducts = products.filter(product => product.isActive);
  res.send(activeProducts);
});

app.get('/products/:id', (req, res) => {
  const productId = req.params.id;
  const product = products.find(product => product.id === productId);

  if (product) {
    res.send(product);
  } else {
    res.send('Product not found');
  }
});

app.put('/products/:id', (req, res) => {
  if (loggedUser && loggedUser.isAdmin) {
    const productId = req.params.id;
    const { name, description, price, isActive } = req.body;

    const product = products.find(product => product.id === productId);

    if (product) {
      product.name = name || product.name;
      product.description = description || product.description;
      product.price = price || product.price;
      product.isActive = isActive !== undefined ? isActive : product.isActive;

      res.send('Product updated successfully');
    } else {
      res.send('Product not found');
    }
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});

app.put('/products/:id/archive', (req, res) => {
  if (loggedUser && loggedUser.isAdmin) {
    const productId = req.params.id;
    const product = products.find(product => product.id === productId);

    if (product) {
      product.isActive = false;
      res.send('Product archived successfully');
    } else {
      res.send('Product not found');
    }
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});

app.post('/orders', (req, res) => {
    if (loggedUser) {
      const { userId, products, quantity, purchasedOn } = req.body;
  
      let newOrder = {
        id: uuidv4(),
        userId: userId,
        products: products,
        quantity: quantity,
        purchasedOn: purchasedOn || new Date()
      };
  
      orders.push(newOrder);
      loggedUser.orders.push(newOrder.id);
      console.log(orders);
  
      res.send('Your order has been placed successfully.');
    } else {
      res.send('Unauthorized. Action Forbidden');
    }
  });
  
app.get('/users/orders', (req, res) => {
  if (loggedUser && loggedUser.isAdmin) {
    res.send(loggedUser.orders);
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});

app.get('/orders', (req, res) => {
  if (loggedUser && loggedUser.isAdmin) {
    res.send(orders);
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});


app.post('/cart/add', (req, res) => {
  if (loggedUser) {
    const { productId, quantity } = req.body;
    const product = products.find(product => product.id === productId);

    if (product) {
      const cartItem = loggedUser.cart.find(item => item.productId === productId);

      if (cartItem) {
        cartItem.quantity += quantity;
      } else {
        loggedUser.cart.push({
          productId: productId,
          quantity: quantity
        });
      }

      res.send('Product added to cart');
    } else {
      res.send('Product not found');
    }
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});

app.get('/cart', (req, res) => {
  if (loggedUser) {
    res.send(loggedUser.cart);
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});

app.put('/cart/quantity/:productId', (req, res) => {
  if (loggedUser) {
    const productId = req.params.productId;
    const { quantity } = req.body;

    const cartItem = loggedUser.cart.find(item => item.productId === productId);

    if (cartItem) {
      cartItem.quantity = quantity;
      res.send('Cart item quantity updated');
    } else {
      res.send('Cart item not found');
    }
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});

app.delete('/cart/remove/:productId', (req, res) => {
  if (loggedUser) {
    const productId = req.params.productId;

    const cartItemIndex = loggedUser.cart.findIndex(item => item.productId === productId);

    if (cartItemIndex !== -1) {
      loggedUser.cart.splice(cartItemIndex, 1);
      res.send(`${loggedUser.cart}Product removed from cart`);
    } else {
      res.send('Cart item not found');
    }
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});

app.get('/cart/subtotal', (req, res) => {
  if (loggedUser) {
    let subtotal = 0;

    for (const cartItem of loggedUser.cart) {
      const product = products.find(product => product.id === cartItem.productId);

      if (product) {
        subtotal += product.price * cartItem.quantity;
      }
    }

    res.send(`Subtotal: $${subtotal.toFixed(2)}`);
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});

app.get('/cart/total', (req, res) => {
  if (loggedUser) {
    let total = 0;

    for (const cartItem of loggedUser.cart) {
      const product = products.find(product => product.id === cartItem.productId);

      if (product) {
        total += product.price * cartItem.quantity;
      }
    }

    res.send(`Total: $${total.toFixed(2)}`);
  } else {
    res.send('Unauthorized. Action Forbidden');
  }
});

app.listen(port, () => console.log(`Server is running at ${port}`));
