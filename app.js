const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const expressValidator = require('express-validator');
const methodOverride = require('method-override');
const compression = require('compression');
const path = require('path');
require('dotenv').config();
const cors = require('cors')


//import routers
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const categoryRoutes = require('./routes/category');
const productRoutes = require('./routes/product');
const braintreeRoutes = require('./routes/braintree');
const orderRoutes = require('./routes/order');


// app
const app = express();
app.use(cors())
 app.use(methodOverride('_method'));
 app.use(methodOverride('X-HTTP-Method'));


//db
mongoose
    .connect(process.env.DATABASE, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    })
    .then(() => console.log("DB Connected"));


// middlewares
app.use(morgan("dev"));
app.use(bodyParser.json({ limit: '50mb' }));
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
        parameterLimit: 50000,
    })
)
app.use(cookieParser());
app.use(expressValidator());
app.use(compression());
app.use(express.static(path.join(__dirname, 'build')));
// app.get('*', function(req, res) {
//     res.sendFile(path.join(__dirname, 'build', 'index.html'));
// });

// router middleware
app.use("/api", authRoutes);
app.use("/api", userRoutes);
app.use("/api", categoryRoutes);
app.use("/api", productRoutes);
app.use("/api", braintreeRoutes);
app.use("/api", orderRoutes);

const port = process.env.PORT || 5000;


app.listen(port , () =>{
    console.log(`server is runming ${port}`);
});
