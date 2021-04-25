const formidable = require('formidable')
const _ = require('lodash')
const fs = require('fs')
const Product = require('../models/product')
const { errorHandler } = require('../helpers/dbErrorHandler');
const Reviews = require('../models/review');

exports.productById = (req, res, next, id) =>{
    Product.findById(id)
    .populate("category") 
    .populate({path: "reviews", populate: {path: "author"}})
    .populate("author")
    .exec((err, product) =>{
        if(err || !product) {
            return res.status(400).json({
                error: "Product not found"
            }); 
        } 
        req.product = product;
        next();
    });
};


exports.read = (req,res) =>{
    req.product.photo = undefined;
    return res.json(req.product);
};


exports.create = (req, res) => {
    let form = new formidable.IncomingForm()
    form.multiples = true;
    form.keepExtensions = true;

    form.parse(req, (err, fields, files) =>{
        if(err) {
            return res.status(400).json({
                error: "Image could not be uploaded"
            });
        }

        //check for all fields
        const { name, description, price, category, quantity, shipping, color, size } = fields;
        
        if (!name || !description || !price || !category || !quantity || !shipping || !color || !size) {
            return res.status(400).json({
                    error: "All fields are required"
                });
        }
        let product = new Product(fields);
        console.log(files);
        if(files.photo){
            console.log(files)
            if(files.photo.size > 1000000) {
                return res.status(400).json({
                    error: "Image should be less then 1mb in size"
                });
            }
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }
        console.log(product)
        product.save((err, result) =>{
            if(err){
                return res.status(400).json({
                    error: errorHandler(error)
                });
            }
            res.json(result);
        });
    });
};


exports.remove = (req, res) => {
    let product = req.product;
    product.remove((err, deletedproduct) =>{
        if(err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({
            deletedproduct,
            massage: "Product deleted successfully"
        });
    });
};



exports.update = (req, res) => {
    let form = new formidable.IncomingForm()
    form.keepExtensions = true
    form.parse(req, (err, fields, files) =>{
        if(err) {
            return res.status(400).json({
                error: "Image could not be uploaded"
            });
        }

        let product = req.product;
        product = _.extend(product, fields);


        if(files.photo){
            if(files.photo.size > 1000000) {
                return res.status(400).json({
                    error: "Image should be less then 1mb in size"
                });
            }
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }

        product.save((err, result) =>{
            if(err){
                return res.status(400).json({
                    error: errorHandler(error)
                });
            }
            res.json(result);
        });
    });
};



//sell
//by sell = /products?sortBy=sold&order=desc&limit=4
//by arrival = /products?sortBy=createdAt&order=desc&limit=4

exports.list = (req, res) => {
    let order = req.query.order ? req.query.order : 'asc'
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id'
    let limit = req.query.limit ? parseInt(req.query.limit) : 40

    Product.find()
        .select("-photo")
        .populate("category")
        .sort([[sortBy, order]])
        .limit(limit)
        .exec((err, data) => {
            if(err) {
                return res.status(400).json({
                    error: "Product not found"
                });
            }
            res.json(data);
        });
};

//find the products based on the req product category
//other products that has ths same category, will be returned


exports.listRelated = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 30

    Product.find({ _id: { $ne: req.product }, category: req.product.category})
    .limit(limit)
    .populate("category", "_id name")
    .exec((err, product) => {
        if(err) {
            return res.status(400).json({
                error: "Product not found"
            });
        }
        res.json(product);
    });
};


exports.listCategories = (req, res) => {
    Product.distinct("category", {}, (err, categories) => {
        if(err) {
            return res.status(400).json({
                error: "Categories not found"
            });
        }
        res.json(categories);
    });
};



/**
 * list products by search
 * implement product search in react frontend
 * show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * api request and show the products to users based on what he wants
 */
 
// route - make sure its post
// router.post("/products/by/search", listBySearch);
 
exports.listBySearch = (req, res) => {
    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};
 
    // console.log(order, sortBy, limit, skip, req.body.filters);
    // console.log("findArgs", findArgs);
 
    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                findArgs[key] = req.body.filters[key];
            }
        }
    }
 
    Product.find(findArgs)
        .select("-photo")
        .populate("category")
        .sort([[sortBy, order]])
        .skip(skip)
        .limit(limit)
        .exec((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: "Products not found"
                });
            }
            res.json({
                size: data.length,
                data
            });
        });
};


exports.photo = (req, res, next) => {
    if (req.product.photo.data) {
        res.set("Content-Type", req.product.photo.contentType);
        return res.send(req.product.photo.data);
    }
    next();
};


exports.listSearch = (req, res) => {
    // query object to search value and category value
    const query = {};
    // assign search value to query.name
    if (req.query.search) {
        query.name = {$regex: req.query.search, $options: 'i'};
        // assign category value to query.category
        if (req.query.category && req.query.category != 'All') {
            query.category = req.query.category;
        }
        Product.find(query, (err, products) =>{
            if(err){
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(products);
        }).select('-photo');
    }
};



exports.decreaseQuantity = (req,res,next) => {
    let bulkOps = req.body.order.product.map(item=>{
        return {
            updateOne: {
                filter: {_id: item._id},
                update: {$inc: {quantity: -item.count, sold: +item.count}}
            }
        };
    });
    Product.bulkWrite(bulkOps, {}, (error,product) =>{
        if (error) {
            return res.status(400).json({
                error: "Could not update product"
            });
        }
        next();
    });
};


exports.reviews =  (req,res) => {
    const prodreview = req.product;
    const review =  new  Reviews(req.body.review)
    review.author = req.profile._id;
    prodreview.reviews.push(review);
    review.save();
    prodreview.save();
    res.redirect(`http://localhost:3000/product/${req.product._id}`)
};


exports.removeReview = (req,res) => {
    const {id} = req.product;
    const {reviewId} = req.params;
    Product.findByIdAndUpdate(id, {$pull: { reviews: reviewId }});
    Reviews.findByIdAndDelete(reviewId,
    (err) =>{
        if(err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.redirect(`http://localhost:3000/product/${req.product._id}`)
    });
};
