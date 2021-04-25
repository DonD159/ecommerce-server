const mongoose = require('mongoose');
const {ObjectId} = mongoose.Schema;
const Schema = mongoose.Schema

const productSchema = new Schema(
    {
        name: {
            type: String,
            trim: true,
            required: true,
            maxlengrh: 32
        },
        description: {
            type: String,
            required: true,
            maxlengrh: 2000
        },
        price: {
            type: Number,
            trim: true,
            required: true,
            maxlengrh: 2000
        },
        category: {
            type: ObjectId,
            ref: 'Category',
            required: true
        },
        quantity: {
            type: Number
        },
        sold: {
            type: Number,
            default: 0
        },
        photo: 
        {
            data: Buffer,
            contentType: String
        },
        shipping: {
            required: false,
            type: Boolean
        },
        color: {
            data: Buffer,
            contentType: String,
        },
        size: {
            type: String
        },
        sizenumber: {
            type: Number
        },
        reviews: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Reviews'
            }
        ]
    },
    {timestamps: true}
);



module.exports = mongoose.model("Product", productSchema);


